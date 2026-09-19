using System;
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
            _document=document; _settings=settings; PrintDocument=new PrintDocument();
            PrintDocument.DocumentName=string.IsNullOrWhiteSpace(document.Number)?"Quotation":document.Number;
            PrintDocument.DefaultPageSettings.PaperSize=new PaperSize("A4",827,1169);
            PrintDocument.DefaultPageSettings.Margins=new Margins(35,35,35,35);
            PrintDocument.BeginPrint+=(s,e)=>_pageIndex=0;
            PrintDocument.PrintPage+=OnPrintPage;
        }
        private void OnPrintPage(object sender,PrintPageEventArgs e){var r=DocumentRenderer.DrawPage(e.Graphics,e.MarginBounds,_document,_settings,_pageIndex,false);e.HasMorePages=r.HasMore;_pageIndex++;}
    }

    public struct PageDrawResult { public bool HasMore; public int TotalPages; }

    public static class DocumentRenderer
    {
        private const int ItemsPerPage=9;
        public static int GetPageCount(DocumentModel d)=>Math.Max(1,(int)Math.Ceiling((d?.Items?.Count??0)/(double)ItemsPerPage));

        public static PageDrawResult DrawPage(Graphics g,Rectangle bounds,DocumentModel doc,CompanySettings settings,int pageIndex,bool preview)
        {
            g.SmoothingMode=SmoothingMode.AntiAlias; g.TextRenderingHint=System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
            var primary=Ui.ParseColor(settings.PrimaryColorHex,Ui.Teal); var accent=Ui.ParseColor(settings.AccentColorHex,Ui.Orange);
            if(string.Equals(settings.TemplatePreset,"Corporate",StringComparison.OrdinalIgnoreCase)) primary=Color.FromArgb(27,42,64);
            if(string.Equals(settings.TemplatePreset,"Minimal",StringComparison.OrdinalIgnoreCase)) accent=primary;
            var totalPages=GetPageCount(doc); pageIndex=Math.Max(0,Math.Min(pageIndex,totalPages-1));
            var rtl=new StringFormat(StringFormatFlags.DirectionRightToLeft){Alignment=StringAlignment.Near,LineAlignment=StringAlignment.Center,Trimming=StringTrimming.EllipsisCharacter};
            var center=new StringFormat(StringFormatFlags.DirectionRightToLeft){Alignment=StringAlignment.Center,LineAlignment=StringAlignment.Center,Trimming=StringTrimming.EllipsisCharacter};
            var ltr=new StringFormat{Alignment=StringAlignment.Near,LineAlignment=StringAlignment.Center};
            string fontName=string.IsNullOrWhiteSpace(settings.FontName)?"Segoe UI":settings.FontName;
            using var title=SafeFont(fontName,15,FontStyle.Bold); using var h=SafeFont(fontName,9,FontStyle.Bold); using var n=SafeFont(fontName,8.1f); using var small=SafeFont(fontName,7.1f);
            using var pb=new SolidBrush(primary); using var ab=new SolidBrush(accent); using var tb=new SolidBrush(Ui.Navy); using var mb=new SolidBrush(Ui.Muted); using var wb=new SolidBrush(Color.White); using var border=new Pen(Ui.Border,1);
            int x=bounds.Left,y=bounds.Top,w=bounds.Width;

            // Header
            if(!string.Equals(settings.TemplatePreset,"Minimal",StringComparison.OrdinalIgnoreCase)) g.FillRectangle(pb,x,y,w,86);
            else { g.DrawLine(new Pen(primary,3),x,y+78,x+w,y+78); }
            var headerTextBrush=string.Equals(settings.TemplatePreset,"Minimal",StringComparison.OrdinalIgnoreCase)?tb:wb;
            if(!string.IsNullOrWhiteSpace(settings.LogoPath)&&System.IO.File.Exists(settings.LogoPath)) try{using var img=Image.FromFile(settings.LogoPath);var ratio=Math.Min(100d/img.Width,56d/img.Height);g.DrawImage(img,new Rectangle(x+10,y+10,(int)(img.Width*ratio),(int)(img.Height*ratio)));}catch{}
            g.DrawString(settings.CompanyName??"",title,headerTextBrush,new RectangleF(x+120,y+5,w-135,28),rtl);
            var info=string.Join("  |  ",new[]{settings.Phone,settings.Email,settings.Website}.Where(s=>!string.IsNullOrWhiteSpace(s)));
            g.DrawString(info,small,headerTextBrush,new RectangleF(x+120,y+34,w-135,18),rtl);
            var address=string.Join(" - ",new[]{settings.Address1,settings.Address2}.Where(s=>!string.IsNullOrWhiteSpace(s)));
            g.DrawString(address,small,headerTextBrush,new RectangleF(x+120,y+52,w-135,15),rtl);
            if(!string.IsNullOrWhiteSpace(settings.TaxNumber)) g.DrawString("الرقم الضريبي: "+settings.TaxNumber,small,headerTextBrush,new RectangleF(x+120,y+67,w-135,15),rtl);
            y+=98;

            // Meta + customer
            int half=(w-12)/2, metaH=98;
            g.DrawRectangle(border,x,y,half,metaH); g.DrawRectangle(border,x+half+12,y,half,metaH);
            g.DrawString(doc.Type??"عرض سعر",h,pb,new RectangleF(x+8,y+4,half-16,20),rtl);
            g.DrawString("رقم: "+(doc.Number??""),n,tb,new RectangleF(x+8,y+27,half-16,18),rtl);
            g.DrawString("التاريخ: "+doc.Date.ToString("yyyy-MM-dd"),n,tb,new RectangleF(x+8,y+46,half-16,18),rtl);
            g.DrawString("صالح حتى: "+doc.ValidUntil.ToString("yyyy-MM-dd"),n,tb,new RectangleF(x+8,y+65,half-16,18),rtl);
            g.DrawString("العملة: "+(doc.Currency??""),n,tb,new RectangleF(x+8,y+82,half-16,14),rtl);
            int cx=x+half+12;
            g.DrawString("العميل",h,pb,new RectangleF(cx+8,y+4,half-16,20),rtl);
            g.DrawString(doc.CustomerName??"",n,tb,new RectangleF(cx+8,y+27,half-16,18),rtl);
            g.DrawString(doc.CustomerPhone??"",small,mb,new RectangleF(cx+8,y+46,half-16,15),rtl);
            g.DrawString(doc.CustomerEmail??"",small,mb,new RectangleF(cx+8,y+62,half-16,15),ltr);
            g.DrawString(doc.CustomerAddress??"",small,mb,new RectangleF(cx+8,y+78,half-16,18),rtl);
            y+=metaH+12;

            // Table
            var widths=new[]{.25,.08,.11,.12,.09,.09,.16,.10}; var labels=new[]{"الصنف","الكمية","الكرتون","سعر الوحدة","خصم %","ضريبة %","الإجمالي","باركود"};
            var col=new int[widths.Length+1]; col[0]=x; for(int i=0;i<widths.Length;i++) col[i+1]=col[i]+(int)(w*widths[i]); col[^1]=x+w;
            int headH=28; g.FillRectangle(pb,x,y,w,headH); for(int i=0;i<labels.Length;i++) g.DrawString(labels[i],h,wb,new RectangleF(col[i]+2,y,col[i+1]-col[i]-4,headH),center); y+=headH;
            var items=(doc.Items??new()).Skip(pageIndex*ItemsPerPage).Take(ItemsPerPage).ToList(); int rowH=46;
            for(int r=0;r<ItemsPerPage;r++)
            {
                int ry=y+r*rowH; g.DrawRectangle(border,x,ry,w,rowH); for(int c=1;c<col.Length-1;c++)g.DrawLine(border,col[c],ry,col[c],ry+rowH); if(r>=items.Count)continue;
                var it=items[r]; string itemText=string.IsNullOrWhiteSpace(it.Note)?it.Name:(it.Name+"\n"+it.Note);
                g.DrawString(itemText,small,tb,new RectangleF(col[0]+4,ry+2,col[1]-col[0]-8,rowH-4),rtl);
                string[] vals={it.Quantity.ToString("0.##"),it.Carton??"",it.UnitPrice.ToString("N2"),it.DiscountPercent.ToString("0.##"),it.TaxPercent.ToString("0.##"),it.Total.ToString("N2")};
                for(int c=0;c<vals.Length;c++)g.DrawString(vals[c],n,tb,new RectangleF(col[c+1]+2,ry+1,col[c+2]-col[c+1]-4,rowH-2),center);
                if(!string.IsNullOrWhiteSpace(it.Barcode)) try{using var code=MakeBarcode(it.Barcode,col[8]-col[7]-8,26);g.DrawImage(code,new Rectangle(col[7]+4,ry+9,col[8]-col[7]-8,26));}catch{g.DrawString(it.Barcode,small,tb,new RectangleF(col[7]+2,ry,col[8]-col[7]-4,rowH),center);}
            }
            y+=ItemsPerPage*rowH+10;

            if(pageIndex==totalPages-1)
            {
                int tw=Math.Min(320,w/2),tx=x+w-tw,lh=22;
                DrawTotal(g,"المجموع",doc.Subtotal,doc.Currency,tx,ref y,tw,lh,n,tb,rtl,border,false,ab,wb);
                if(doc.LineDiscounts!=0)DrawTotal(g,"خصومات الأصناف",-doc.LineDiscounts,doc.Currency,tx,ref y,tw,lh,n,tb,rtl,border,false,ab,wb);
                DrawTotal(g,"صافي قبل الضريبة",doc.TaxableTotal,doc.Currency,tx,ref y,tw,lh,n,tb,rtl,border,false,ab,wb);
                if(doc.GlobalDiscountAmount!=0)DrawTotal(g,"خصم عام "+doc.GlobalDiscountPercent.ToString("0.##")+"%",-doc.GlobalDiscountAmount,doc.Currency,tx,ref y,tw,lh,n,tb,rtl,border,false,ab,wb);
                DrawTotal(g,"الضريبة",doc.Taxes,doc.Currency,tx,ref y,tw,lh,n,tb,rtl,border,false,ab,wb);
                DrawTotal(g,"الإجمالي النهائي",doc.GrandTotal,doc.Currency,tx,ref y,tw,lh+5,h,tb,rtl,border,true,ab,wb);
                int notesY=y+6;
                if(!string.IsNullOrWhiteSpace(doc.PaymentTerms)){g.DrawString("شروط الدفع: "+doc.PaymentTerms,small,tb,new RectangleF(x,notesY,w-tw-20,22),rtl);notesY+=22;}
                if(!string.IsNullOrWhiteSpace(doc.Notes)){g.DrawString("ملاحظات: "+doc.Notes,small,tb,new RectangleF(x,notesY,w-tw-20,42),rtl);notesY+=44;}
                var qrText=string.IsNullOrWhiteSpace(doc.QrText)?$"{doc.Number} | {doc.GrandTotal:N2} {doc.Currency}":doc.QrText;
                try{using var qr=MakeQr(qrText,72);g.DrawImage(qr,new Rectangle(x+4,Math.Min(notesY,bounds.Bottom-105),72,72));}catch{}
            }
            int fy=bounds.Bottom-18; g.DrawLine(border,x,fy-5,x+w,fy-5); g.DrawString(settings.FooterText??"",small,mb,new RectangleF(x,fy,w-90,15),rtl); g.DrawString($"{pageIndex+1} / {totalPages}",small,mb,new RectangleF(x+w-75,fy,75,15),ltr);
            return new PageDrawResult{HasMore=pageIndex+1<totalPages,TotalPages=totalPages};
        }

        private static Font SafeFont(string name,float size,FontStyle style=FontStyle.Regular){try{return new Font(name,size,style);}catch{return new Font("Segoe UI",size,style);}}
        private static void DrawTotal(Graphics g,string label,decimal value,string currency,int x,ref int y,int w,int h,Font font,Brush tb,StringFormat rtl,Pen border,bool final,Brush ab,Brush wb){if(final){g.FillRectangle(ab,x,y,w,h);g.DrawString(label,font,wb,new RectangleF(x+w/2,y,w/2-6,h),rtl);g.DrawString(value.ToString("N2")+" "+currency,font,wb,new RectangleF(x+5,y,w/2-10,h),rtl);}else{g.DrawRectangle(border,x,y,w,h);g.DrawString(label,font,tb,new RectangleF(x+w/2,y,w/2-6,h),rtl);g.DrawString(value.ToString("N2")+" "+currency,font,tb,new RectangleF(x+5,y,w/2-10,h),rtl);}y+=h;}
        private static Bitmap MakeQr(string value,int size)=>MakeCode(value,BarcodeFormat.QR_CODE,size,size,0);
        private static Bitmap MakeBarcode(string value,int width,int height)
        {
            BarcodeFormat f=BarcodeFormat.CODE_128; if(value.All(char.IsDigit)&&value.Length==13)f=BarcodeFormat.EAN_13; else if(value.All(char.IsDigit)&&value.Length==8)f=BarcodeFormat.EAN_8;
            try{return MakeCode(value,f,Math.Max(40,width),Math.Max(20,height),0);}catch{return MakeCode(value,BarcodeFormat.CODE_128,Math.Max(40,width),Math.Max(20,height),0);}
        }
        private static Bitmap MakeCode(string value,BarcodeFormat format,int width,int height,int margin)
        {
            var writer=new BarcodeWriterPixelData{Format=format,Options=new EncodingOptions{Width=width,Height=height,Margin=margin,PureBarcode=format!=BarcodeFormat.QR_CODE}}; var px=writer.Write(value);
            var bmp=new Bitmap(px.Width,px.Height,PixelFormat.Format32bppRgb); var data=bmp.LockBits(new Rectangle(0,0,bmp.Width,bmp.Height),ImageLockMode.WriteOnly,PixelFormat.Format32bppRgb); try{Marshal.Copy(px.Pixels,0,data.Scan0,px.Pixels.Length);}finally{bmp.UnlockBits(data);} return bmp;
        }
    }

    public sealed class DocumentPreviewPanel:Panel
    {
        public DocumentModel Document{get;set;} public CompanySettings Settings{get;set;} public int PageIndex{get;set;}
        public DocumentPreviewPanel(){DoubleBuffered=true;BackColor=Color.FromArgb(224,228,232);ResizeRedraw=true;}
        protected override void OnPaint(PaintEventArgs e){base.OnPaint(e);if(Document==null||Settings==null)return;int pad=18,aw=Math.Max(100,ClientSize.Width-pad*2),ah=Math.Max(100,ClientSize.Height-pad*2);float ratio=Math.Min(aw/827f,ah/1169f);int w=(int)(827*ratio),h=(int)(1169*ratio),x=(ClientSize.Width-w)/2,y=(ClientSize.Height-h)/2;e.Graphics.FillRectangle(Brushes.White,x,y,w,h);e.Graphics.DrawRectangle(Pens.Silver,x,y,w,h);var state=e.Graphics.Save();e.Graphics.TranslateTransform(x,y);e.Graphics.ScaleTransform(ratio,ratio);DocumentRenderer.DrawPage(e.Graphics,new Rectangle(35,35,757,1099),Document,Settings,PageIndex,true);e.Graphics.Restore(state);}
    }
}
