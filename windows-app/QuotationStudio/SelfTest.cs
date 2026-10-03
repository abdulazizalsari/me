using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace QuotationStudio
{
    internal static class SelfTest
    {
        public static int Run()
        {
            var root = Path.Combine(Path.GetTempPath(), "QuotationStudio-SelfTest-" + Guid.NewGuid().ToString("N"));
            var restoreRoot = root + "-restore";
            try
            {
                var storage = new StorageService(root);
                var state = new AppState();
                state.Settings.CompanyName = "Test Company";
                state.Products.Add(new Product { Name = "منتج", DefaultPrice = 10m, CartonFormat = "10*2", Barcode = "123456789012" });
                state.Customers.Add(new Customer { Name = "عميل", Company = "شركة العميل" });
                var doc = new DocumentModel { Number = "QT-2099-0001", Type = "عرض سعر", Currency = "USD", GlobalDiscountPercent = 10m, CustomerName = "شركة العميل" };
                doc.Items = new List<LineItem> { new LineItem { Name = "منتج", Quantity = 2m, UnitPrice = 10m, Carton = "10*2", DiscountPercent = 10m, TaxPercent = 20m, Barcode = "123456789012" } };
                state.Documents.Add(doc);
                storage.Save(state);

                var loaded = storage.Load();
                if (loaded.Documents.Count != 1 || loaded.Products.Count != 1 || loaded.Customers.Count != 1) return 11;
                if (loaded.Documents[0].Items[0].Carton != "10*2") return 12;
                if (loaded.Products[0].CartonFormat != "10*2") return 13;
                if (loaded.Documents[0].GrandTotal != 19.44m) return 14;

                var validation = DocumentRules.ValidateForOutput(loaded.Documents[0], loaded.Settings);
                if (!validation.IsValid) return 19;

                var bad = new DocumentModel { Currency = "USD" };
                bad.Items.Add(new LineItem { UnitPrice = 5m, Carton = "10*2" });
                var badValidation = DocumentRules.ValidateForOutput(bad, loaded.Settings);
                if (badValidation.IsValid || badValidation.Errors.Count == 0) return 20;

                if (DocumentRules.PrintableItems(new DocumentModel { Items = new List<LineItem> { new LineItem { Carton = "10*2" } } }).Any()) return 21;

                var backup = Path.Combine(root, "test.qsbak");
                storage.Backup(backup, loaded);
                if (!File.Exists(backup) || new FileInfo(backup).Length == 0) return 15;

                var storage2 = new StorageService(restoreRoot);
                var restored = storage2.Restore(backup);
                if (restored.Documents.Single().Number != "QT-2099-0001") return 16;
                if (restored.Documents.Single().Items.Single().Carton != "10*2") return 17;

                var json = Path.Combine(root, "data.json");
                storage.ExportJson(json, loaded);
                if (!File.Exists(json) || new FileInfo(json).Length == 0) return 18;
                return 0;
            }
            catch { return 99; }
            finally
            {
                try { if (Directory.Exists(root)) Directory.Delete(root, true); } catch { }
                try { if (Directory.Exists(restoreRoot)) Directory.Delete(restoreRoot, true); } catch { }
            }
        }
    }
}
