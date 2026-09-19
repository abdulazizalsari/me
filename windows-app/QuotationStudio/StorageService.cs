using System;
using System.IO;
using System.Text;
using System.Xml.Serialization;

namespace QuotationStudio
{
    public sealed class StorageService
    {
        private readonly string _root;
        private readonly string _dataFile;
        private readonly XmlSerializer _serializer = new XmlSerializer(typeof(AppState));

        public StorageService()
        {
            _root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "QuotationStudio");
            Directory.CreateDirectory(_root);
            _dataFile = Path.Combine(_root, "data.xml");
        }

        public string DataFolder => _root;

        public AppState Load()
        {
            try
            {
                if (!File.Exists(_dataFile)) return new AppState();
                using (var fs = File.OpenRead(_dataFile))
                    return (AppState)_serializer.Deserialize(fs) ?? new AppState();
            }
            catch
            {
                var damaged = Path.Combine(_root, "data-damaged-" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + ".xml");
                try { File.Copy(_dataFile, damaged, true); } catch { }
                return new AppState();
            }
        }

        public void Save(AppState state)
        {
            Directory.CreateDirectory(_root);
            var tmp = _dataFile + ".tmp";
            using (var fs = File.Create(tmp)) _serializer.Serialize(fs, state);
            if (File.Exists(_dataFile)) File.Replace(tmp, _dataFile, null);
            else File.Move(tmp, _dataFile);
        }

        public void Backup(string destination, AppState state)
        {
            Save(state);
            File.Copy(_dataFile, destination, true);
        }

        public AppState Restore(string source)
        {
            using (var fs = File.OpenRead(source))
            {
                var restored = (AppState)_serializer.Deserialize(fs) ?? new AppState();
                Save(restored);
                return restored;
            }
        }

        public void ExportProductsCsv(string destination, AppState state)
        {
            var sb = new StringBuilder();
            sb.AppendLine("اسم المنتج,السعر,الكرتون,الباركود,ملاحظات");
            foreach (var p in state.Products)
                sb.AppendLine(string.Join(",", Csv(p.Name), p.DefaultPrice.ToString(System.Globalization.CultureInfo.InvariantCulture), Csv(p.CartonFormat), Csv(p.Barcode), Csv(p.Note)));
            File.WriteAllText(destination, sb.ToString(), new UTF8Encoding(true));
        }

        public void ExportCustomersCsv(string destination, AppState state)
        {
            var sb = new StringBuilder();
            sb.AppendLine("الاسم,الشركة,الهاتف,البريد,العنوان");
            foreach (var c in state.Customers)
                sb.AppendLine(string.Join(",", Csv(c.Name), Csv(c.Company), Csv(c.Phone), Csv(c.Email), Csv(c.Address)));
            File.WriteAllText(destination, sb.ToString(), new UTF8Encoding(true));
        }

        private static string Csv(string value)
        {
            value = value ?? "";
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
    }
}
