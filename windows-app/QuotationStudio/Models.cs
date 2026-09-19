using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;

namespace QuotationStudio
{
    [Serializable]
    public class AppState
    {
        public CompanySettings Settings { get; set; } = new CompanySettings();
        public List<Customer> Customers { get; set; } = new List<Customer>();
        public List<Product> Products { get; set; } = new List<Product>();
        public List<DocumentModel> Documents { get; set; } = new List<DocumentModel>();
    }

    [Serializable]
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
    }

    [Serializable]
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

    [Serializable]
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

    [Serializable]
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

        [XmlIgnore]
        public decimal Subtotal => Items?.Sum(x => x.Subtotal) ?? 0m;
        [XmlIgnore]
        public decimal LineDiscounts => Items?.Sum(x => x.DiscountAmount) ?? 0m;
        [XmlIgnore]
        public decimal Taxes => Items?.Sum(x => x.TaxAmount) ?? 0m;
        [XmlIgnore]
        public decimal BeforeGlobalDiscount => Items?.Sum(x => x.Total) ?? 0m;
        [XmlIgnore]
        public decimal GlobalDiscountAmount => Math.Round(BeforeGlobalDiscount * GlobalDiscountPercent / 100m, 2, MidpointRounding.AwayFromZero);
        [XmlIgnore]
        public decimal GrandTotal => BeforeGlobalDiscount - GlobalDiscountAmount;
    }

    [Serializable]
    public class LineItem
    {
        public string Name { get; set; } = "";
        public decimal Quantity { get; set; } = 1m;
        // Free-text carton format. Examples: 10*2, 12*6, 24*1. It is NOT restricted to an integer.
        public string Carton { get; set; } = "10*2";
        public decimal UnitPrice { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal TaxPercent { get; set; }
        public string Note { get; set; } = "";
        public string Barcode { get; set; } = "";

        [XmlIgnore]
        public decimal Subtotal => Math.Round(Quantity * UnitPrice, 2, MidpointRounding.AwayFromZero);
        [XmlIgnore]
        public decimal DiscountAmount => Math.Round(Subtotal * DiscountPercent / 100m, 2, MidpointRounding.AwayFromZero);
        [XmlIgnore]
        public decimal Taxable => Subtotal - DiscountAmount;
        [XmlIgnore]
        public decimal TaxAmount => Math.Round(Taxable * TaxPercent / 100m, 2, MidpointRounding.AwayFromZero);
        [XmlIgnore]
        public decimal Total => Taxable + TaxAmount;
    }
}
