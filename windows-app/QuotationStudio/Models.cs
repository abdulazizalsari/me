using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace QuotationStudio
{
    public class AppState
    {
        public CompanySettings Settings { get; set; } = new CompanySettings();
        public List<Customer> Customers { get; set; } = new List<Customer>();
        public List<Product> Products { get; set; } = new List<Product>();
        public List<DocumentModel> Documents { get; set; } = new List<DocumentModel>();
    }

    public class CompanySettings
    {
        public string CompanyName { get; set; } = "اسم الشركة";
        public string Address1 { get; set; } = "";
        public string Address2 { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Email { get; set; } = "";
        public string TaxNumber { get; set; } = "";
        public string Website { get; set; } = "";
        public string LogoPath { get; set; } = "";
        public string DefaultCurrency { get; set; } = "USD";
        public string PrimaryColorHex { get; set; } = "#0F3D46";
        public string AccentColorHex { get; set; } = "#F26A2E";
        public string FooterText { get; set; } = "شكراً لتعاملكم معنا";
        public string TemplatePreset { get; set; } = "Modern";
        public string FontName { get; set; } = "Segoe UI";
    }

    public class Customer
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } = "";
        public string Company { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Email { get; set; } = "";
        public string Address { get; set; } = "";
        public override string ToString() => string.IsNullOrWhiteSpace(Company) ? Name : Company;
    }

    public class Product
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } = "";
        public decimal DefaultPrice { get; set; }
        public string CartonFormat { get; set; } = "10*2";
        public string Barcode { get; set; } = "";
        public string Note { get; set; } = "";
        public override string ToString() => Name;
    }

    public class DocumentModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Number { get; set; } = "";
        public string Type { get; set; } = "عرض سعر";
        public DateTime Date { get; set; } = DateTime.Today;
        public DateTime ValidUntil { get; set; } = DateTime.Today.AddDays(14);
        public string Currency { get; set; } = "USD";
        public string CustomerId { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string CustomerPhone { get; set; } = "";
        public string CustomerEmail { get; set; } = "";
        public string CustomerAddress { get; set; } = "";
        public string Notes { get; set; } = "";
        public string PaymentTerms { get; set; } = "";
        public string QrText { get; set; } = "";
        public decimal GlobalDiscountPercent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        public List<LineItem> Items { get; set; } = new List<LineItem>();

        [JsonIgnore] public decimal Subtotal => Items?.Sum(x => x.Subtotal) ?? 0m;
        [JsonIgnore] public decimal LineDiscounts => Items?.Sum(x => x.DiscountAmount) ?? 0m;
        [JsonIgnore] public decimal TaxableTotal => Items?.Sum(x => x.Taxable) ?? 0m;
        [JsonIgnore] public decimal GlobalDiscountAmount => Math.Round(TaxableTotal * Clamp(GlobalDiscountPercent) / 100m, 2, MidpointRounding.AwayFromZero);
        [JsonIgnore] public decimal TaxAfterGlobalDiscount => Math.Round((Items?.Sum(x => x.TaxAmount) ?? 0m) * (1m - Clamp(GlobalDiscountPercent) / 100m), 2, MidpointRounding.AwayFromZero);
        [JsonIgnore] public decimal Taxes => TaxAfterGlobalDiscount;
        [JsonIgnore] public decimal BeforeGlobalDiscount => TaxableTotal + (Items?.Sum(x => x.TaxAmount) ?? 0m);
        [JsonIgnore] public decimal GrandTotal => Math.Round(TaxableTotal - GlobalDiscountAmount + TaxAfterGlobalDiscount, 2, MidpointRounding.AwayFromZero);

        private static decimal Clamp(decimal p) => p < 0 ? 0 : (p > 100 ? 100 : p);
    }

    public class LineItem
    {
        public string Name { get; set; } = "";
        public decimal Quantity { get; set; } = 1m;
        // Free-text carton format. Examples: 10*2, 12*6, 24*1. It is intentionally NOT numeric.
        public string Carton { get; set; } = "10*2";
        public decimal UnitPrice { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal TaxPercent { get; set; }
        public string Note { get; set; } = "";
        public string Barcode { get; set; } = "";

        [JsonIgnore] public decimal Subtotal => Math.Round(Quantity * UnitPrice, 2, MidpointRounding.AwayFromZero);
        [JsonIgnore] public decimal DiscountAmount => Math.Round(Subtotal * Clamp(DiscountPercent) / 100m, 2, MidpointRounding.AwayFromZero);
        [JsonIgnore] public decimal Taxable => Subtotal - DiscountAmount;
        [JsonIgnore] public decimal TaxAmount => Math.Round(Taxable * Clamp(TaxPercent) / 100m, 2, MidpointRounding.AwayFromZero);
        [JsonIgnore] public decimal Total => Math.Round(Taxable + TaxAmount, 2, MidpointRounding.AwayFromZero);

        private static decimal Clamp(decimal p) => p < 0 ? 0 : (p > 100 ? 100 : p);
    }
}
