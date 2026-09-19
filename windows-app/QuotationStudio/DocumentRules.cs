using System;
using System.Collections.Generic;
using System.Linq;

namespace QuotationStudio
{
    public sealed class DocumentValidationResult
    {
        public List<string> Errors { get; } = new List<string>();
        public List<string> Warnings { get; } = new List<string>();
        public bool IsValid => Errors.Count == 0;
    }

    public static class DocumentRules
    {
        public static IEnumerable<LineItem> PrintableItems(DocumentModel document)
        {
            return (document?.Items ?? new List<LineItem>()).Where(IsMeaningfulItem);
        }

        public static bool IsMeaningfulItem(LineItem item)
        {
            if (item == null) return false;
            return !string.IsNullOrWhiteSpace(item.Name)
                || item.UnitPrice != 0m
                || !string.IsNullOrWhiteSpace(item.Barcode)
                || !string.IsNullOrWhiteSpace(item.Note)
                || item.DiscountPercent != 0m
                || item.TaxPercent != 0m;
        }

        public static DocumentValidationResult ValidateForOutput(DocumentModel document, CompanySettings settings)
        {
            var result = new DocumentValidationResult();
            if (document == null)
            {
                result.Errors.Add("لا يوجد مستند مفتوح.");
                return result;
            }

            if (settings == null || string.IsNullOrWhiteSpace(settings.CompanyName) || settings.CompanyName.Trim() == "اسم الشركة")
                result.Errors.Add("أدخل اسم الشركة من الإعدادات قبل إصدار PDF أو الطباعة.");

            if (string.IsNullOrWhiteSpace(document.Currency))
                result.Errors.Add("حدد العملة.");

            var items = PrintableItems(document).ToList();
            if (items.Count == 0)
                result.Errors.Add("أضف صنفاً واحداً على الأقل قبل إصدار المستند.");

            for (int i = 0; i < items.Count; i++)
            {
                var item = items[i];
                if (string.IsNullOrWhiteSpace(item.Name))
                    result.Errors.Add("الصنف رقم " + (i + 1) + " بدون اسم.");
                if (item.Quantity <= 0m)
                    result.Errors.Add("كمية الصنف رقم " + (i + 1) + " يجب أن تكون أكبر من صفر.");
                if (item.UnitPrice < 0m)
                    result.Errors.Add("سعر الصنف رقم " + (i + 1) + " لا يمكن أن يكون سالباً.");
            }

            if (string.IsNullOrWhiteSpace(document.CustomerName))
                result.Warnings.Add("اسم العميل فارغ. يمكنك المتابعة إذا كان المستند لا يحتاج اسماً للعميل.");

            if (document.ValidUntil.Date < document.Date.Date)
                result.Warnings.Add("تاريخ الصلاحية أقدم من تاريخ المستند.");

            return result;
        }
    }
}
