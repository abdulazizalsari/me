using System;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Printing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using ZXing;
using ZXing.Common;

namespace QuotationStudio
{
    public sealed class DocumentPrintSession
    {
        private int _pageIndex;
        private readonly DocumentModel _document;
        private readonly CompanySettings _settings;
        public PrintDocument PrintDocument { get; }

        public DocumentPrintSession(DocumentModel document, CompanySettings settings)
        {
            _document = document;
            _settings = settings;
            PrintDocument = new PrintDocument();
            PrintDocument.DocumentName = string.IsNullOrWhiteSpace(document.Number) ? "Quotation" : document.Number;
            PrintDocument.DefaultPageSettings.PaperSize = new PaperSize("A4", 827, 1169);
            PrintDocument.DefaultPageSettings.Margins = new Margins(35, 35, 35, 35);
            PrintDocument.BeginPrint += delegate { _pageIndex = 0; };
            PrintDocument.PrintPage += OnPrintPage;
        }

        private void OnPrintPage(object sender, PrintPageEventArgs e)
        {
            PageDrawResult result = DocumentRenderer.DrawPage(e.Graphics, e.MarginBounds, _document, _settings, _pageIndex, false);
            e.HasMorePages = result.HasMore;
            _pageIndex++;
        }
    }

    public struct PageDrawResult
    {
        public bool HasMore;
        public int TotalPages;
    }

    public static class DocumentRenderer
    {
        private const int ItemsPerPage = 12;

        public static int GetPageCount(DocumentModel document)
        {
            int count = DocumentRules.PrintableItems(document).Count();
            return Math.Max(1, (int)Math.Ceiling(count / (double)ItemsPerPage));
        }

        public static PageDrawResult DrawPage(Graphics g, Rectangle bounds, DocumentModel doc, CompanySettings settings, int pageIndex, bool preview)
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

            Color primary = Ui.ParseColor(settings.PrimaryColorHex, Ui.Teal);
            Color accent = Ui.ParseColor(settings.AccentColorHex, Ui.Orange);
            if (string.Equals(settings.TemplatePreset, "Corporate", StringComparison.OrdinalIgnoreCase)) primary = Color.FromArgb(27, 42, 64);
            if (string.Equals(settings.TemplatePreset, "Minimal", StringComparison.OrdinalIgnoreCase)) accent = primary;

            var allItems = DocumentRules.PrintableItems(doc).ToList();
            int totalPages = Math.Max(1, (int)Math.Ceiling(allItems.Count / (double)ItemsPerPage));
            pageIndex = Math.Max(0, Math.Min(pageIndex, totalPages - 1));
            var pageItems = allItems.Skip(pageIndex * ItemsPerPage).Take(ItemsPerPage).ToList();
            bool showBarcode = allItems.Any(x => !string.IsNullOrWhiteSpace(x.Barcode));

            using StringFormat rtl = new StringFormat(StringFormatFlags.DirectionRightToLeft) { Alignment = StringAlignment.Near, LineAlignment = StringAlignment.Center, Trimming = StringTrimming.EllipsisCharacter };
            using StringFormat rtlCenter = new StringFormat(StringFormatFlags.DirectionRightToLeft) { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center, Trimming = StringTrimming.EllipsisCharacter };
            using StringFormat ltr = new StringFormat { Alignment = StringAlignment.Near, LineAlignment = StringAlignment.Center, Trimming = StringTrimming.EllipsisCharacter };
            using StringFormat ltrCenter = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center, Trimming = StringTrimming.EllipsisCharacter };

            string fontName = string.IsNullOrWhiteSpace(settings.FontName) ? "Segoe UI" : settings.FontName;
            using Font title = SafeFont(fontName, 15, FontStyle.Bold);
            using Font h = SafeFont(fontName, 9, FontStyle.Bold);
            using Font n = SafeFont(fontName, 8.2f);
            using Font small = SafeFont(fontName, 7.2f);
            using SolidBrush primaryBrush = new SolidBrush(primary);
            using SolidBrush accentBrush = new SolidBrush(accent);
            using SolidBrush textBrush = new SolidBrush(Ui.Navy);
            using SolidBrush mutedBrush = new SolidBrush(Ui.Muted);
            using SolidBrush whiteBrush = new SolidBrush(Color.White);
            using Pen border = new Pen(Ui.Border, 1);

            int x = bounds.Left;
            int y = bounds.Top;
            int w = bounds.Width;

            DrawHeader(g, settings, x, ref y, w, primary, title, small, primaryBrush, textBrush, whiteBrush, rtl);
            DrawMeta(g, doc, x, ref y, w, primaryBrush, textBrush, mutedBrush, border, h, n, small, rtl, ltr);

            int[] col;
            string[] labels;
            if (showBarcode)
            {
                double[] widths = { .26, .07, .11, .12, .08, .08, .15, .13 };
                labels = new[] { "الصنف", "الكمية", "الكرتون", "سعر الوحدة", "خصم %", "ضريبة %", "الإجمالي", "باركود" };
                col = MakeColumns(x, w, widths);
            }
            else
            {
                double[] widths = { .34, .09, .13, .14, .10, .10, .10 };
                labels = new[] { "الصنف", "الكمية", "الكرتون", "سعر الوحدة", "خصم %", "ضريبة %", "الإجمالي" };
                col = MakeColumns(x, w, widths);
            }

            int headH = 30;
            g.FillRectangle(primaryBrush, x, y, w, headH);
            for (int i = 0; i < labels.Length; i++)
                g.DrawString(labels[i], h, whiteBrush, new RectangleF(col[i] + 2, y, col[i + 1] - col[i] - 4, headH), rtlCenter);
            y += headH;

            int rowH = 46;
            int rowsToDraw = Math.Max(1, pageItems.Count);
            for (int r = 0; r < rowsToDraw; r++)
            {
                int rowY = y + r * rowH;
                g.DrawRectangle(border, x, rowY, w, rowH);
                for (int c = 1; c < col.Length - 1; c++) g.DrawLine(border, col[c], rowY, col[c], rowY + rowH);

                if (r >= pageItems.Count)
                {
                    if (preview) g.DrawString("أضف الأصناف من محرر المستند", small, mutedBrush, new RectangleF(col[0] + 5, rowY, col[1] - col[0] - 10, rowH), rtl);
                    continue;
                }

                LineItem item = pageItems[r];
                string itemText = string.IsNullOrWhiteSpace(item.Note) ? item.Name : item.Name + "\n" + item.Note;
                g.DrawString(itemText ?? "", small, textBrush, new RectangleF(col[0] + 4, rowY + 2, col[1] - col[0] - 8, rowH - 4), rtl);
                DrawCell(g, item.Quantity.ToString("0.##"), n, textBrush, col[1], col[2], rowY, rowH, ltrCenter);
                DrawCell(g, item.Carton ?? "", n, textBrush, col[2], col[3], rowY, rowH, ltrCenter);
                DrawCell(g, item.UnitPrice.ToString("N2"), n, textBrush, col[3], col[4], rowY, rowH, ltrCenter);
                DrawCell(g, item.DiscountPercent.ToString("0.##"), n, textBrush, col[4], col[5], rowY, rowH, ltrCenter);
                DrawCell(g, item.TaxPercent.ToString("0.##"), n, textBrush, col[5], col[6], rowY, rowH, ltrCenter);
                DrawCell(g, item.Total.ToString("N2"), n, textBrush, col[6], col[7], rowY, rowH, ltrCenter);

                if (showBarcode)
                {
                    int last = col.Length - 1;
                    if (!string.IsNullOrWhiteSpace(item.Barcode))
                    {
                        try
                        {
                            using Bitmap code = MakeBarcode(item.Barcode, col[last] - col[last - 1] - 8, 25);
                            g.DrawImage(code, new Rectangle(col[last - 1] + 4, rowY + 7, col[last] - col[last - 1] - 8, 25));
                            g.DrawString(item.Barcode, small, textBrush, new RectangleF(col[last - 1] + 2, rowY + 32, col[last] - col[last - 1] - 4, 12), ltrCenter);
                        }
                        catch
                        {
                            g.DrawString(item.Barcode, small, textBrush, new RectangleF(col[last - 1] + 2, rowY, col[last] - col[last - 1] - 4, rowH), ltrCenter);
                        }
                    }
                }
            }
            y += rowsToDraw * rowH + 12;

            if (pageIndex == totalPages - 1)
            {
                int totalWidth = Math.Min(326, w / 2);
                int totalX = x + w - totalWidth;
                int lineH = 23;
                DrawTotal(g, "المجموع", doc.Subtotal, doc.Currency, totalX, ref y, totalWidth, lineH, n, textBrush, rtl, ltr, border, false, accentBrush, whiteBrush);
                if (doc.LineDiscounts != 0) DrawTotal(g, "خصومات الأصناف", -doc.LineDiscounts, doc.Currency, totalX, ref y, totalWidth, lineH, n, textBrush, rtl, ltr, border, false, accentBrush, whiteBrush);
                DrawTotal(g, "صافي قبل الضريبة", doc.TaxableTotal, doc.Currency, totalX, ref y, totalWidth, lineH, n, textBrush, rtl, ltr, border, false, accentBrush, whiteBrush);
                if (doc.GlobalDiscountAmount != 0) DrawTotal(g, "خصم عام " + doc.GlobalDiscountPercent.ToString("0.##") + "%", -doc.GlobalDiscountAmount, doc.Currency, totalX, ref y, totalWidth, lineH, n, textBrush, rtl, ltr, border, false, accentBrush, whiteBrush);
                DrawTotal(g, "الضريبة", doc.Taxes, doc.Currency, totalX, ref y, totalWidth, lineH, n, textBrush, rtl, ltr, border, false, accentBrush, whiteBrush);
                DrawTotal(g, "الإجمالي النهائي", doc.GrandTotal, doc.Currency, totalX, ref y, totalWidth, lineH + 6, h, textBrush, rtl, ltr, border, true, accentBrush, whiteBrush);

                int notesY = y + 7;
                int notesWidth = Math.Max(180, w - totalWidth - 24);
                if (!string.IsNullOrWhiteSpace(doc.PaymentTerms))
                {
                    g.DrawString("شروط الدفع: " + doc.PaymentTerms, small, textBrush, new RectangleF(x, notesY, notesWidth, 28), rtl);
                    notesY += 28;
                }
                if (!string.IsNullOrWhiteSpace(doc.Notes))
                {
                    g.DrawString("ملاحظات: " + doc.Notes, small, textBrush, new RectangleF(x, notesY, notesWidth, 50), rtl);
                    notesY += 50;
                }

                string qrText = string.IsNullOrWhiteSpace(doc.QrText) ? doc.Number + " | " + doc.GrandTotal.ToString("N2") + " " + doc.Currency : doc.QrText;
                try
                {
                    using Bitmap qr = MakeQr(qrText, 68);
                    g.DrawImage(qr, new Rectangle(x + 4, Math.Min(notesY + 3, bounds.Bottom - 100), 68, 68));
                }
                catch { }
            }

            int footerY = bounds.Bottom - 18;
            g.DrawLine(border, x, footerY - 5, x + w, footerY - 5);
            g.DrawString(settings.FooterText ?? "", small, mutedBrush, new RectangleF(x, footerY, w - 90, 15), rtl);
            g.DrawString((pageIndex + 1) + " / " + totalPages, small, mutedBrush, new RectangleF(x + w - 75, footerY, 75, 15), ltr);

            return new PageDrawResult { HasMore = pageIndex + 1 < totalPages, TotalPages = totalPages };
        }

        private static void DrawHeader(Graphics g, CompanySettings settings, int x, ref int y, int w, Color primary, Font title, Font small, Brush primaryBrush, Brush textBrush, Brush whiteBrush, StringFormat rtl)
        {
            bool minimal = string.Equals(settings.TemplatePreset, "Minimal", StringComparison.OrdinalIgnoreCase);
            if (!minimal) g.FillRectangle(primaryBrush, x, y, w, 76);
            else
            {
                using Pen p = new Pen(primary, 3);
                g.DrawLine(p, x, y + 70, x + w, y + 70);
            }

            Brush headerText = minimal ? textBrush : whiteBrush;
            int textRight = x + w - 12;
            int logoSpace = 0;
            if (!string.IsNullOrWhiteSpace(settings.LogoPath) && System.IO.File.Exists(settings.LogoPath))
            {
                try
                {
                    using Image image = Image.FromFile(settings.LogoPath);
                    double ratio = Math.Min(94d / image.Width, 52d / image.Height);
                    int iw = (int)(image.Width * ratio);
                    int ih = (int)(image.Height * ratio);
                    g.DrawImage(image, new Rectangle(x + 12, y + 10, iw, ih));
                    logoSpace = 110;
                }
                catch { }
            }

            int textX = x + 12 + logoSpace;
            int textW = Math.Max(150, textRight - textX);
            g.DrawString(settings.CompanyName ?? "", title, headerText, new RectangleF(textX, y + 5, textW, 28), rtl);
            string info = string.Join("  |  ", new[] { settings.Phone, settings.Email, settings.Website }.Where(s => !string.IsNullOrWhiteSpace(s)));
            g.DrawString(info, small, headerText, new RectangleF(textX, y + 34, textW, 16), rtl);
            string address = string.Join(" - ", new[] { settings.Address1, settings.Address2 }.Where(s => !string.IsNullOrWhiteSpace(s)));
            g.DrawString(address, small, headerText, new RectangleF(textX, y + 50, textW, 14), rtl);
            if (!string.IsNullOrWhiteSpace(settings.TaxNumber))
                g.DrawString("الرقم الضريبي: " + settings.TaxNumber, small, headerText, new RectangleF(textX, y + 63, textW, 13), rtl);
            y += 88;
        }

        private static void DrawMeta(Graphics g, DocumentModel doc, int x, ref int y, int w, Brush primaryBrush, Brush textBrush, Brush mutedBrush, Pen border, Font h, Font n, Font small, StringFormat rtl, StringFormat ltr)
        {
            int gap = 12;
            int half = (w - gap) / 2;
            int metaH = 94;
            g.DrawRectangle(border, x, y, half, metaH);
            g.DrawRectangle(border, x + half + gap, y, half, metaH);

            g.DrawString(doc.Type ?? "عرض سعر", h, primaryBrush, new RectangleF(x + 8, y + 4, half - 16, 20), rtl);
            g.DrawString("رقم: " + (doc.Number ?? ""), n, textBrush, new RectangleF(x + 8, y + 27, half - 16, 17), rtl);
            g.DrawString("التاريخ: " + doc.Date.ToString("yyyy-MM-dd"), n, textBrush, new RectangleF(x + 8, y + 45, half - 16, 17), rtl);
            g.DrawString("صالح حتى: " + doc.ValidUntil.ToString("yyyy-MM-dd"), n, textBrush, new RectangleF(x + 8, y + 63, half - 16, 17), rtl);
            g.DrawString("العملة: " + (doc.Currency ?? ""), n, textBrush, new RectangleF(x + 8, y + 79, half - 16, 13), rtl);

            int cx = x + half + gap;
            g.DrawString("العميل", h, primaryBrush, new RectangleF(cx + 8, y + 4, half - 16, 20), rtl);
            g.DrawString(doc.CustomerName ?? "", n, textBrush, new RectangleF(cx + 8, y + 27, half - 16, 17), rtl);
            g.DrawString(doc.CustomerPhone ?? "", small, mutedBrush, new RectangleF(cx + 8, y + 45, half - 16, 15), ltr);
            g.DrawString(doc.CustomerEmail ?? "", small, mutedBrush, new RectangleF(cx + 8, y + 60, half - 16, 15), ltr);
            g.DrawString(doc.CustomerAddress ?? "", small, mutedBrush, new RectangleF(cx + 8, y + 75, half - 16, 17), rtl);
            y += metaH + 12;
        }

        private static int[] MakeColumns(int x, int width, double[] widths)
        {
            int[] col = new int[widths.Length + 1];
            col[0] = x;
            for (int i = 0; i < widths.Length; i++) col[i + 1] = col[i] + (int)(width * widths[i]);
            col[col.Length - 1] = x + width;
            return col;
        }

        private static void DrawCell(Graphics g, string text, Font font, Brush brush, int left, int right, int y, int height, StringFormat format)
        {
            g.DrawString(text ?? "", font, brush, new RectangleF(left + 2, y + 1, right - left - 4, height - 2), format);
        }

        private static Font SafeFont(string name, float size, FontStyle style = FontStyle.Regular)
        {
            try { return new Font(name, size, style); }
            catch { return new Font("Segoe UI", size, style); }
        }

        private static void DrawTotal(Graphics g, string label, decimal value, string currency, int x, ref int y, int w, int h, Font font, Brush textBrush, StringFormat rtl, StringFormat ltr, Pen border, bool final, Brush accentBrush, Brush whiteBrush)
        {
            Brush labelBrush = final ? whiteBrush : textBrush;
            Brush valueBrush = final ? whiteBrush : textBrush;
            if (final) g.FillRectangle(accentBrush, x, y, w, h); else g.DrawRectangle(border, x, y, w, h);
            g.DrawString(label, font, labelBrush, new RectangleF(x + w / 2, y, w / 2 - 6, h), rtl);
            g.DrawString(value.ToString("N2") + " " + currency, font, valueBrush, new RectangleF(x + 6, y, w / 2 - 12, h), ltr);
            y += h;
        }

        private static Bitmap MakeQr(string value, int size) => MakeCode(value, BarcodeFormat.QR_CODE, size, size, 0);

        private static Bitmap MakeBarcode(string value, int width, int height)
        {
            BarcodeFormat format = BarcodeFormat.CODE_128;
            if (value.All(char.IsDigit) && value.Length == 13) format = BarcodeFormat.EAN_13;
            else if (value.All(char.IsDigit) && value.Length == 8) format = BarcodeFormat.EAN_8;
            try { return MakeCode(value, format, Math.Max(40, width), Math.Max(20, height), 0); }
            catch { return MakeCode(value, BarcodeFormat.CODE_128, Math.Max(40, width), Math.Max(20, height), 0); }
        }

        private static Bitmap MakeCode(string value, BarcodeFormat format, int width, int height, int margin)
        {
            BarcodeWriterPixelData writer = new BarcodeWriterPixelData
            {
                Format = format,
                Options = new EncodingOptions { Width = width, Height = height, Margin = margin, PureBarcode = format != BarcodeFormat.QR_CODE }
            };
            PixelData pixelData = writer.Write(value);
            Bitmap bitmap = new Bitmap(pixelData.Width, pixelData.Height, PixelFormat.Format32bppRgb);
            BitmapData data = bitmap.LockBits(new Rectangle(0, 0, bitmap.Width, bitmap.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppRgb);
            try { Marshal.Copy(pixelData.Pixels, 0, data.Scan0, pixelData.Pixels.Length); }
            finally { bitmap.UnlockBits(data); }
            return bitmap;
        }
    }

    public sealed class DocumentPreviewPanel : Panel
    {
        [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
        public DocumentModel Document { get; set; }

        [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
        public CompanySettings Settings { get; set; }

        [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
        public int PageIndex { get; set; }

        public DocumentPreviewPanel()
        {
            DoubleBuffered = true;
            BackColor = Color.FromArgb(224, 228, 232);
            ResizeRedraw = true;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            if (Document == null || Settings == null) return;
            int pad = 18;
            int availableWidth = Math.Max(100, ClientSize.Width - pad * 2);
            int availableHeight = Math.Max(100, ClientSize.Height - pad * 2);
            float ratio = Math.Min(availableWidth / 827f, availableHeight / 1169f);
            int width = (int)(827 * ratio);
            int height = (int)(1169 * ratio);
            int x = (ClientSize.Width - width) / 2;
            int y = (ClientSize.Height - height) / 2;
            e.Graphics.FillRectangle(Brushes.White, x, y, width, height);
            e.Graphics.DrawRectangle(Pens.Silver, x, y, width, height);
            GraphicsState state = e.Graphics.Save();
            e.Graphics.TranslateTransform(x, y);
            e.Graphics.ScaleTransform(ratio, ratio);
            DocumentRenderer.DrawPage(e.Graphics, new Rectangle(35, 35, 757, 1099), Document, Settings, PageIndex, true);
            e.Graphics.Restore(state);
        }
    }
}
