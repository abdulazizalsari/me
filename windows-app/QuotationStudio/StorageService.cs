using Microsoft.Data.Sqlite;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace QuotationStudio
{
    public sealed class StorageService
    {
        private readonly string _root;
        private readonly string _dbFile;
        private readonly string _assets;
        private readonly JsonSerializerOptions _json = new JsonSerializerOptions { WriteIndented = true, PropertyNameCaseInsensitive = true };

        public StorageService(string customRoot = null)
        {
            _root = customRoot ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "QuotationStudio");
            _assets = Path.Combine(_root, "Assets");
            _dbFile = Path.Combine(_root, "quotation.db");
            Directory.CreateDirectory(_root);
            Directory.CreateDirectory(_assets);
            EnsureSchema();
        }

        public string DataFolder => _root;
        public string DatabaseFile => _dbFile;

        private SqliteConnection Open()
        {
            var c = new SqliteConnection("Data Source=" + _dbFile + ";Mode=ReadWriteCreate;Pooling=False");
            c.Open();
            using var cmd = c.CreateCommand();
            cmd.CommandText = "PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;";
            cmd.ExecuteNonQuery();
            return c;
        }

        private void EnsureSchema()
        {
            using var c = Open();
            using var cmd = c.CreateCommand();
            cmd.CommandText = @"
CREATE TABLE IF NOT EXISTS AppSettings (Id INTEGER PRIMARY KEY CHECK(Id=1), Json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS Customers (Id TEXT PRIMARY KEY, Name TEXT, Company TEXT, Phone TEXT, Email TEXT, Address TEXT);
CREATE TABLE IF NOT EXISTS Products (Id TEXT PRIMARY KEY, Name TEXT, DefaultPrice TEXT, CartonFormat TEXT, Barcode TEXT, Note TEXT);
CREATE TABLE IF NOT EXISTS Documents (
 Id TEXT PRIMARY KEY, Number TEXT NOT NULL COLLATE NOCASE UNIQUE, Type TEXT, Date TEXT, ValidUntil TEXT, Currency TEXT,
 CustomerId TEXT, CustomerName TEXT, CustomerPhone TEXT, CustomerEmail TEXT, CustomerAddress TEXT,
 Notes TEXT, PaymentTerms TEXT, QrText TEXT, GlobalDiscountPercent TEXT, CreatedAt TEXT, UpdatedAt TEXT);
CREATE TABLE IF NOT EXISTS LineItems (
 Id INTEGER PRIMARY KEY AUTOINCREMENT, DocumentId TEXT NOT NULL, SortOrder INTEGER NOT NULL,
 Name TEXT, Quantity TEXT, Carton TEXT, UnitPrice TEXT, DiscountPercent TEXT, TaxPercent TEXT, Note TEXT, Barcode TEXT,
 FOREIGN KEY(DocumentId) REFERENCES Documents(Id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS IX_Documents_UpdatedAt ON Documents(UpdatedAt);
CREATE INDEX IF NOT EXISTS IX_LineItems_DocumentId ON LineItems(DocumentId, SortOrder);";
            cmd.ExecuteNonQuery();
        }

        public AppState Load()
        {
            EnsureSchema();
            var state = new AppState();
            using var c = Open();

            using (var cmd = c.CreateCommand())
            {
                cmd.CommandText = "SELECT Json FROM AppSettings WHERE Id=1";
                var v = cmd.ExecuteScalar()?.ToString();
                if (!string.IsNullOrWhiteSpace(v))
                    state.Settings = JsonSerializer.Deserialize<CompanySettings>(v, _json) ?? new CompanySettings();
            }

            using (var cmd = c.CreateCommand())
            {
                cmd.CommandText = "SELECT Id,Name,Company,Phone,Email,Address FROM Customers ORDER BY Company,Name";
                using var r = cmd.ExecuteReader();
                while (r.Read()) state.Customers.Add(new Customer { Id=S(r,0), Name=S(r,1), Company=S(r,2), Phone=S(r,3), Email=S(r,4), Address=S(r,5) });
            }
            using (var cmd = c.CreateCommand())
            {
                cmd.CommandText = "SELECT Id,Name,DefaultPrice,CartonFormat,Barcode,Note FROM Products ORDER BY Name";
                using var r = cmd.ExecuteReader();
                while (r.Read()) state.Products.Add(new Product { Id=S(r,0), Name=S(r,1), DefaultPrice=D(S(r,2)), CartonFormat=S(r,3), Barcode=S(r,4), Note=S(r,5) });
            }
            using (var cmd = c.CreateCommand())
            {
                cmd.CommandText = "SELECT Id,Number,Type,Date,ValidUntil,Currency,CustomerId,CustomerName,CustomerPhone,CustomerEmail,CustomerAddress,Notes,PaymentTerms,QrText,GlobalDiscountPercent,CreatedAt,UpdatedAt FROM Documents ORDER BY UpdatedAt DESC";
                using var r = cmd.ExecuteReader();
                while (r.Read())
                {
                    state.Documents.Add(new DocumentModel {
                        Id=S(r,0), Number=S(r,1), Type=S(r,2), Date=DT(S(r,3),DateTime.Today), ValidUntil=DT(S(r,4),DateTime.Today.AddDays(14)), Currency=S(r,5),
                        CustomerId=S(r,6), CustomerName=S(r,7), CustomerPhone=S(r,8), CustomerEmail=S(r,9), CustomerAddress=S(r,10), Notes=S(r,11), PaymentTerms=S(r,12), QrText=S(r,13),
                        GlobalDiscountPercent=D(S(r,14)), CreatedAt=DT(S(r,15),DateTime.Now), UpdatedAt=DT(S(r,16),DateTime.Now)
                    });
                }
            }
            foreach (var doc in state.Documents)
            {
                using var cmd = c.CreateCommand();
                cmd.CommandText = "SELECT Name,Quantity,Carton,UnitPrice,DiscountPercent,TaxPercent,Note,Barcode FROM LineItems WHERE DocumentId=$id ORDER BY SortOrder";
                cmd.Parameters.AddWithValue("$id", doc.Id);
                using var r = cmd.ExecuteReader();
                while (r.Read()) doc.Items.Add(new LineItem { Name=S(r,0), Quantity=D(S(r,1),1), Carton=S(r,2), UnitPrice=D(S(r,3)), DiscountPercent=D(S(r,4)), TaxPercent=D(S(r,5)), Note=S(r,6), Barcode=S(r,7) });
            }

            if (!string.IsNullOrWhiteSpace(state.Settings.LogoPath) && !File.Exists(state.Settings.LogoPath))
            {
                var logo = Directory.Exists(_assets) ? Directory.GetFiles(_assets, "logo.*").FirstOrDefault() : null;
                if (logo != null) state.Settings.LogoPath = logo;
            }
            return state;
        }

        public void Save(AppState state)
        {
            EnsureSchema();
            using var c = Open();
            using var tx = c.BeginTransaction();
            Exec(c, tx, "DELETE FROM LineItems; DELETE FROM Documents; DELETE FROM Customers; DELETE FROM Products; DELETE FROM AppSettings;");

            using (var cmd = c.CreateCommand())
            {
                cmd.Transaction = tx; cmd.CommandText = "INSERT INTO AppSettings(Id,Json) VALUES(1,$json)";
                cmd.Parameters.AddWithValue("$json", JsonSerializer.Serialize(state.Settings ?? new CompanySettings(), _json)); cmd.ExecuteNonQuery();
            }
            foreach (var x in state.Customers ?? new List<Customer>())
                Insert(c,tx,"INSERT INTO Customers(Id,Name,Company,Phone,Email,Address) VALUES($0,$1,$2,$3,$4,$5)",x.Id,x.Name,x.Company,x.Phone,x.Email,x.Address);
            foreach (var x in state.Products ?? new List<Product>())
                Insert(c,tx,"INSERT INTO Products(Id,Name,DefaultPrice,CartonFormat,Barcode,Note) VALUES($0,$1,$2,$3,$4,$5)",x.Id,x.Name,N(x.DefaultPrice),x.CartonFormat,x.Barcode,x.Note);
            foreach (var d in state.Documents ?? new List<DocumentModel>())
            {
                Insert(c,tx,@"INSERT INTO Documents(Id,Number,Type,Date,ValidUntil,Currency,CustomerId,CustomerName,CustomerPhone,CustomerEmail,CustomerAddress,Notes,PaymentTerms,QrText,GlobalDiscountPercent,CreatedAt,UpdatedAt)
VALUES($0,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
                    d.Id,d.Number,d.Type,ISO(d.Date),ISO(d.ValidUntil),d.Currency,d.CustomerId,d.CustomerName,d.CustomerPhone,d.CustomerEmail,d.CustomerAddress,d.Notes,d.PaymentTerms,d.QrText,N(d.GlobalDiscountPercent),ISO(d.CreatedAt),ISO(d.UpdatedAt));
                int i=0; foreach (var item in d.Items ?? new List<LineItem>())
                    Insert(c,tx,"INSERT INTO LineItems(DocumentId,SortOrder,Name,Quantity,Carton,UnitPrice,DiscountPercent,TaxPercent,Note,Barcode) VALUES($0,$1,$2,$3,$4,$5,$6,$7,$8,$9)",
                        d.Id,i++,item.Name,N(item.Quantity),item.Carton,N(item.UnitPrice),N(item.DiscountPercent),N(item.TaxPercent),item.Note,item.Barcode);
            }
            tx.Commit();
        }

        public string ImportLogo(string source)
        {
            Directory.CreateDirectory(_assets);
            foreach (var f in Directory.GetFiles(_assets,"logo.*")) try { File.Delete(f); } catch { }
            var ext = Path.GetExtension(source).ToLowerInvariant(); if (ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".bmp") ext = ".png";
            var dest = Path.Combine(_assets,"logo"+ext); File.Copy(source,dest,true); return dest;
        }

        public void Backup(string destination, AppState state)
        {
            Save(state);
            if (File.Exists(destination)) File.Delete(destination);
            using var zip = ZipFile.Open(destination, ZipArchiveMode.Create);
            zip.CreateEntryFromFile(_dbFile,"quotation.db",CompressionLevel.Optimal);
            if (Directory.Exists(_assets)) foreach (var f in Directory.GetFiles(_assets)) zip.CreateEntryFromFile(f,"Assets/"+Path.GetFileName(f),CompressionLevel.Optimal);
        }

        public AppState Restore(string source)
        {
            var temp = Path.Combine(Path.GetTempPath(),"QuotationStudioRestore-"+Guid.NewGuid().ToString("N")); Directory.CreateDirectory(temp);
            try
            {
                ZipFile.ExtractToDirectory(source,temp);
                var candidate = Path.Combine(temp,"quotation.db"); if (!File.Exists(candidate)) throw new InvalidDataException("النسخة الاحتياطية لا تحتوي قاعدة بيانات صالحة.");
                using (var test = new SqliteConnection("Data Source="+candidate+";Mode=ReadOnly")) { test.Open(); using var cmd=test.CreateCommand(); cmd.CommandText="SELECT name FROM sqlite_master LIMIT 1"; cmd.ExecuteScalar(); }
                File.Copy(candidate,_dbFile,true);
                var a=Path.Combine(temp,"Assets"); if (Directory.Exists(a)) { Directory.CreateDirectory(_assets); foreach(var f in Directory.GetFiles(a)) File.Copy(f,Path.Combine(_assets,Path.GetFileName(f)),true); }
                return Load();
            }
            finally { try { Directory.Delete(temp,true); } catch { } }
        }

        public void ExportJson(string destination, AppState state) => File.WriteAllText(destination,JsonSerializer.Serialize(state,_json),new UTF8Encoding(true));
        public AppState ImportJson(string source)
        {
            var s=JsonSerializer.Deserialize<AppState>(File.ReadAllText(source,Encoding.UTF8),_json) ?? throw new InvalidDataException("ملف JSON غير صالح"); Save(s); return Load();
        }

        public void ExportProductsCsv(string destination, AppState state)
        {
            var sb=new StringBuilder(); sb.AppendLine("اسم المنتج,السعر,الكرتون,الباركود,ملاحظات");
            foreach(var p in state.Products) sb.AppendLine(string.Join(",",Csv(p.Name),N(p.DefaultPrice),Csv(p.CartonFormat),Csv(p.Barcode),Csv(p.Note)));
            File.WriteAllText(destination,sb.ToString(),new UTF8Encoding(true));
        }
        public void ExportCustomersCsv(string destination, AppState state)
        {
            var sb=new StringBuilder(); sb.AppendLine("الاسم,الشركة,الهاتف,البريد,العنوان");
            foreach(var c in state.Customers) sb.AppendLine(string.Join(",",Csv(c.Name),Csv(c.Company),Csv(c.Phone),Csv(c.Email),Csv(c.Address)));
            File.WriteAllText(destination,sb.ToString(),new UTF8Encoding(true));
        }
        public int ImportProductsCsv(string source, AppState state)
        {
            var rows=ReadCsv(source); int count=0; foreach(var row in rows.Skip(1)) { if(row.Count==0||string.IsNullOrWhiteSpace(row[0])) continue; state.Products.Add(new Product { Name=V(row,0), DefaultPrice=D(V(row,1)), CartonFormat=string.IsNullOrWhiteSpace(V(row,2))?"10*2":V(row,2), Barcode=V(row,3), Note=V(row,4)}); count++; } Save(state); return count;
        }
        public int ImportCustomersCsv(string source, AppState state)
        {
            var rows=ReadCsv(source); int count=0; foreach(var row in rows.Skip(1)) { if(row.Count==0||string.IsNullOrWhiteSpace(row[0])) continue; state.Customers.Add(new Customer { Name=V(row,0), Company=V(row,1), Phone=V(row,2), Email=V(row,3), Address=V(row,4)}); count++; } Save(state); return count;
        }

        private static List<List<string>> ReadCsv(string path)
        {
            var result=new List<List<string>>(); foreach(var line in File.ReadAllLines(path,Encoding.UTF8)) { var row=new List<string>(); var sb=new StringBuilder(); bool q=false; for(int i=0;i<line.Length;i++){char ch=line[i]; if(ch=='\"'){ if(q&&i+1<line.Length&&line[i+1]=='\"'){sb.Append('\"');i++;} else q=!q;} else if(ch==','&&!q){row.Add(sb.ToString());sb.Clear();} else sb.Append(ch);} row.Add(sb.ToString()); result.Add(row);} return result;
        }
        private static string V(List<string> row,int i)=>i<row.Count?row[i]:"";
        private static string Csv(string value)=>"\""+(value??"").Replace("\"","\"\"")+"\"";
        private static void Exec(SqliteConnection c,SqliteTransaction tx,string sql){using var cmd=c.CreateCommand();cmd.Transaction=tx;cmd.CommandText=sql;cmd.ExecuteNonQuery();}
        private static void Insert(SqliteConnection c,SqliteTransaction tx,string sql,params object[] values){using var cmd=c.CreateCommand();cmd.Transaction=tx;cmd.CommandText=sql;for(int i=0;i<values.Length;i++)cmd.Parameters.AddWithValue("$"+i,values[i]??"");cmd.ExecuteNonQuery();}
        private static string S(SqliteDataReader r,int i)=>r.IsDBNull(i)?"":r.GetString(i);
        private static string N(decimal d)=>d.ToString(CultureInfo.InvariantCulture);
        private static decimal D(string s,decimal fallback=0)=>decimal.TryParse(s,NumberStyles.Any,CultureInfo.InvariantCulture,out var v)?v:fallback;
        private static string ISO(DateTime d)=>d.ToString("O",CultureInfo.InvariantCulture);
        private static DateTime DT(string s,DateTime fallback)=>DateTime.TryParse(s,CultureInfo.InvariantCulture,DateTimeStyles.RoundtripKind,out var v)?v:fallback;
    }
}
