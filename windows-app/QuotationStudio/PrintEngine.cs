using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Printing;
using System.Linq;
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
            PrintDocument.BeginPrint += (s, e) => _pageIndex = 0;
            PrintDocument.PrintPage += OnPrintPage;
        }

        private void OnPrintPage(object sender, PrintPageEventArgs e)
        {
            var result = DocumentRenderer.DrawPage(e.Graphics, e.MarginBounds, _document, _settings, _pageIndex, false);
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

        public static int GetPageCount(DocumentModel doc)
        {
            var count = doc?.Items?.Count ?? 0;
            return Math.Max(1, (int)Math.Ceiling(count / (double)ItemsPerPage));
        }

        public static PageDrawResult DrawPage(Graphics g, Rectangle bounds, DocumentModel doc, CompanySettings settings, int pageIndex, bool preview)
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
            var primary = Ui.ParseColor(settings.PrimaryColorHex, Ui.Teal);
            var accent = Ui.ParseColor(settings.AccentColorHex, Ui.Orange);
            var totalPages = GetPageCount(doc);
            pageIndex = Math.Max(0, Math.Min(pageIndex, totalPages - 1));

            var rtl = new StringFormat(StringFormatFlags.DirectionRightToLeft) { Alignment = StringAlignment.Near, LineAlignment = StringAlignment.Center };
            var rtlCenter = new StringFormat(StringFormatFlags.DirectionRightToLeft) { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
            var ltr = new StringFormat { Alignment = StringAlignment.Near, LineAlignment = StringAlignment.Center };

            using (var title = new Font("Segoe UI", preview ? 16 : 15, FontStyle.Bold))
            using (var h = new Font("Segoe UI", preview ? 10 : 9, FontStyle.Bold))
            using (var n = new Font("Segoe UI", preview ? 9 : 8.2f, FontStyle.Regular))
            using (var small = new Font("Segoe UI", preview ? 8 : 7.2f, FontStyle.Regular))
            using (var primaryBrush = new SolidBrush(primary))
            using (var accentBrush = new SolidBrush(accent))
            using (var textBrush = new SolidBrush(Ui.Navy))
            using (var mutedBrush = new SolidBrush(Ui.Muted))
            using (var whiteBrush = new SolidBrush(Color.White))
            using (var borderPen = new Pen(Ui.Border, 1))
            {
                int x = bounds.Left;
                int y = bounds.Top;
                int w = bounds.Width;

                // Header identity block.
                g.FillRectangle(primaryBrush, x, y, w, 72);
                if (!string.IsNullOrWhiteSpace(settings.LogoPath) && System.IO.File.Exists(settings.LogoPath))
                {
                    try
                    {
                        using (var img = Image.FromFile(settings.LogoPath))
                        {
                            var maxW = 100; var maxH = 52;
                            var ratio = Math.Min(maxW / (double)img.Width, maxH / (double)img.Height);
                            var iw = (int)(img.Width * ratio); var ih = (int)(img.Height * ratio);
                            g.DrawImage(img, new Rectangle(x + 12, y + 10, iw, ih));
                        }
                    }
                    catch { }
                }
                g.DrawString(settings.CompanyName ?? "", title, whiteBrush, new RectangleF(x + 120, y + 7, w - 135, 30), rtl);
                var companyInfo = string.Join("  |  ", new[] { settings.Phone, settings.Email, settings.Website }.Where(s => !string.IsNullOrWhiteSpace(s)));
                g.DrawString(companyInfo, small, whiteBrush, new RectangleF(x + 120, y + 38, w - 135, 22), rtl);
                y += 88;

                // Document meta and customer.
                var metaH = 84;
                var half = (w - 12) / 2;
                g.DrawRectangle(borderPen, x, y, half, metaH);
                g.DrawRectangle(borderPen, x + half + 12, y, half, metaH);
                g.DrawString(doc.Type ?? "عرض سعر", h, primaryBrush, new RectangleF(x + 10, y + 5, half - 20, 20), rtl);
                g.DrawString("رقم المستند: " + (doc.Number ?? ""), n, textBrush, new RectangleF(x + 10, y + 28, half - 20, 18), rtl);
                g.DrawString("التاريخ: " + doc.Date.ToString("yyyy-MM-dd"), n, textBrush, new RectangleF(x + 10, y + 47, half - 20, 18), rtl);
                g.DrawString("صالح حتى: " + doc.ValidUntil.ToString("yyyy-MM-dd"), n, textBrush, new RectangleF(x + 10, y + 64, half - 20, 16), rtl);

                var cx = x + half + 12;
                g.DrawString("العميل", h, primaryBrush, new RectangleF(cx + 10, y + 5, half - 20, 20), rtl);
                g.DrawString(doc.CustomerName ?? "", n, textBrush, new RectangleF(cx + 10, y + 28, half - 20, 18), rtl);
                g.DrawString(doc.CustomerPhone ?? "", small, mutedBrush, new RectangleF(cx + 10, y + 47, half - 20, 16), rtl);
                g.DrawString(doc.CustomerAddress ?? "", small, mutedBrush, new RectangleF(cx + 10, y + 64, half - 20, 16), rtl);
                y += metaH + 14;

                // Table.
                var widths = new[] { 0.27, 0.09, 0.12, 0.13, 0.10, 0.10, 0.19 };
                var labels = new[] { "الصنف", "الكمية", "الكرتون", "سعر الوحدة", "خصم %", "ضريبة %", "الإجمالي" };
                var colX = new int[widths.Length + 1];
                colX[0] = x;
                for (int i = 0; i < widths.Length; i++) colX[i + 1] = colX[i] + (int)(w * widths[i]);
                colX[colX.Length - 1] = x + w;
                var headH = 30;
                g.FillRectangle(primaryBrush, x, y, w, headH);
                for (int i = 0; i < labels.Length; i++)
                    g.DrawString(labels[i], h, whiteBrush, new RectangleF(colX[i] + 2, y, colX[i + 1] - colX[i] - 4, headH), rtlCenter);
                y += headH;

                var pageItems = (doc.Items ?? new System.Collections.Generic.List<LineItem>()).Skip(pageIndex * ItemsPerPage).Take(ItemsPerPage).ToList();
                var rowH = 34;
                for (int r = 0; r < ItemsPerPage; r++)
                {
                    var rowY = y + r * rowH;
                    g.DrawRectangle(borderPen, x, rowY, w, rowH);
                    for (int c = 1; c < colX.Length - 1; c++) g.DrawLine(borderPen, colX[c], rowY, colX[c], rowY + rowH);
                    if (r >= pageItems.Count) continue;
                    var item = pageItems[r];
                    var values = new[]
                    {
                        item.Name ?? "", item.Quantity.ToString("0.##"), item.Carton ?? "", item.UnitPrice.ToString("N2"),
                        item.DiscountPercent.ToString("0.##"), item.TaxPercent.ToString("0.##"), item.Total.ToString("N2")
                    };
                    for (int c = 0; c < values.Length; c++)
                        g.DrawString(values[c], n, textBrush, new RectangleF(colX[c] + 4, rowY + 1, colX[c + 1] - colX[c] - 8, rowH - 2), c == 0 || c == 2 ? rtl : rtlCenter);
                }
                y += ItemsPerPage * rowH + 12;

                // Totals on last page only.
                if (pageIndex == totalPages - 1)
                {
                    var totalW = Math.Min(290, w / 2);
                    var totalX = x + w - totalW;
                    var lineH = 24;
                    DrawTotal(g, "المجموع قبل الخصم", doc.BeforeGlobalDiscount, doc.Currency, totalX, ref y, totalW, lineH, n, textBrush, rtl, borderPen, false, accentBrush, whiteBrush);
                    if (doc.GlobalDiscountPercent > 0)
                        DrawTotal(g, "خصم عام " + doc.GlobalDiscountPercent.ToString("0.##") + "%", -doc.GlobalDiscountAmount, doc.Currency, totalX, ref y, totalW, lineH, n, textBrush, rtl, borderPen, false, accentBrush, whiteBrush);
                    DrawTotal(g, "الإجمالي النهائي", doc.GrandTotal, doc.Currency, totalX, ref y, totalW, lineH + 4, h, textBrush, rtl, borderPen, true, accentBrush, whiteBrush);

                    y += 10;
                    if (!string.IsNullOrWhiteSpace(doc.Notes))
                    {
                        g.DrawString("ملاحظات", h, primaryBrush, new RectangleF(x, y, w, 20), rtl);
                        y += 20;
                        g.DrawString(doc.Notes, small, textBrush, new RectangleF(x, y, w - 100, 50), rtl);
                    }

                    var qrText = string.IsNullOrWhiteSpace(doc.QrText) ? (doc.Number + " | " + doc.GrandTotal.ToString("N2") + " " + doc.Currency) : doc.QrText;
                    try
                    {
                        var writer = new BarcodeWriter
                        {
                            Format = BarcodeFormat.QR_CODE,
                            Options = new EncodingOptions { Height = 78, Width = 78, Margin = 0 }
                        };
                        using (var qr = writer.Write(qrText)) g.DrawImage(qr, new Rectangle(x + 6, Math.Min(y, bounds.Bottom - 105), 78, 78));
                    }
                    catch { }
                }

                var footerY = bounds.Bottom - 20;
                g.DrawLine(borderPen, x, footerY - 5, x + w, footerY - 5);
                g.DrawString(settings.FooterText ?? "", small, mutedBrush, new RectangleF(x, footerY, w - 90, 16), rtl);
                g.DrawString((pageIndex + 1) + " / " + totalPages, small, mutedBrush, new RectangleF(x + w - 80, footerY, 80, 16), ltr);
            }

            return new PageDrawResult { HasMore = pageIndex + 1 < totalPages, TotalPages = totalPages };
        }

        private static void DrawTotal(Graphics g, string label, decimal value, string currency, int x, ref int y, int w, int h, Font font, Brush textBrush, StringFormat rtl, Pen borderPen, bool final, Brush accentBrush, Brush whiteBrush)
        {
            if (final)
            {
                g.FillRectangle(accentBrush, x, y, w, h);
                g.DrawString(label, font, whiteBrush, new RectangleF(x + w / 2, y, w / 2 - 8, h), rtl);
                g.DrawString(value.ToString("N2") + " " + currency, font, whiteBrush, new RectangleF(x + 6, y, w / 2 - 12, h), rtl);
            }
            else
            {
                g.DrawRectangle(borderPen, x, y, w, h);
                g.DrawString(label, font, textBrush, new RectangleF(x + w / 2, y, w / 2 - 8, h), rtl);
                g.DrawString(value.ToString("N2") + " " + currency, font, textBrush, new RectangleF(x + 6, y, w / 2 - 12, h), rtl);
            }
            y += h;
        }
    }

    public sealed class DocumentPreviewPanel : Panel
    {
        public DocumentModel Document { get; set; }
        public CompanySettings Settings { get; set; }
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
            var pad = 18;
            var availableW = Math.Max(100, ClientSize.Width - pad * 2);
            var availableH = Math.Max(100, ClientSize.Height - pad * 2);
            var ratio = Math.Min(availableW / 827f, availableH / 1169f);
            var w = (int)(827 * ratio);
            var h = (int)(1169 * ratio);
            var x = (ClientSize.Width - w) / 2;
            var y = (ClientSize.Height - h) / 2;
            e.Graphics.FillRectangle(Brushes.White, x, y, w, h);
            e.Graphics.DrawRectangle(Pens.Silver, x, y, w, h);
            var state = e.Graphics.Save();
            e.Graphics.TranslateTransform(x, y);
            e.Graphics.ScaleTransform(ratio, ratio);
            DocumentRenderer.DrawPage(e.Graphics, new Rectangle(35, 35, 757, 1099), Document, Settings, PageIndex, true);
            e.Graphics.Restore(state);
        }
    }
}
