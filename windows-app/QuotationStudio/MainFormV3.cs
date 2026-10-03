using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Linq;
using System.Windows.Forms;

namespace QuotationStudio
{
    public sealed class MainFormV3 : Form
    {
        private readonly StorageService _storage;
        private AppState _state;
        private readonly Panel _content=new Panel();
        private readonly Label _pageTitle=new Label();
        private readonly Label _status=new Label();
        private readonly Timer _autosave=new Timer{Interval=1500};
        private bool _dirty;
        private DocumentModel _doc;
        private BindingList<LineItem> _items;
        private ComboBox _docType,_customerPicker;
        private TextBox _docNumber,_currency,_customerName,_customerPhone,_customerEmail,_customerAddress,_notes,_terms,_qr;
        private DateTimePicker _docDate,_validUntil;
        private NumericUpDown _globalDiscount;
        private DataGridView _itemGrid;
        private DocumentPreviewPanel _preview;
        private Label _pageLabel,_totalsLabel;
        private int _pageIndex;

        public MainFormV3()
        {
            _storage=new StorageService(); _state=_storage.Load();
            Text="Quotation Studio 3 - عروض الأسعار والفواتير"; Width=1420; Height=900; MinimumSize=new Size(1120,700); StartPosition=FormStartPosition.CenterScreen;
            BackColor=Ui.Paper; Font=Ui.Font(); RightToLeft=RightToLeft.Yes; RightToLeftLayout=true; KeyPreview=true;
            BuildShell(); ShowDashboard();
            _autosave.Tick+=(s,e)=>{_autosave.Stop();if(_dirty)AutoSave(false);};
            FormClosing+=(s,e)=>{AutoSave(false);TrySaveState();};
            KeyDown+=(s,e)=>{if(e.Control&&e.KeyCode==Keys.S){SaveCurrent(true);e.SuppressKeyPress=true;} if(e.Control&&e.KeyCode==Keys.P){PrintCurrent();e.SuppressKeyPress=true;} if(e.Control&&e.KeyCode==Keys.N){Navigate(()=>ShowDocumentEditor(NewDocument("عرض سعر")));e.SuppressKeyPress=true;}};
        }

        private void BuildShell()
        {
            var side=new Panel{Dock=DockStyle.Right,Width=220,BackColor=Ui.Teal,Padding=new Padding(0,14,0,0)};
            side.Controls.Add(new Label{Text="QUOTATION\nSTUDIO 3",Dock=DockStyle.Top,Height=82,ForeColor=Color.White,Font=Ui.Font(16,FontStyle.Bold),TextAlign=ContentAlignment.MiddleCenter});
            var nav=new FlowLayoutPanel{Dock=DockStyle.Fill,FlowDirection=FlowDirection.TopDown,WrapContents=false,BackColor=Ui.Teal,Padding=new Padding(0,8,0,0)}; side.Controls.Add(nav); nav.BringToFront();
            AddNav(nav,"الرئيسية",ShowDashboard); AddNav(nav,"عرض سعر جديد",()=>ShowDocumentEditor(NewDocument("عرض سعر"))); AddNav(nav,"فاتورة جديدة",()=>ShowDocumentEditor(NewDocument("فاتورة")));
            AddNav(nav,"المستندات",ShowDocuments); AddNav(nav,"العملاء",ShowCustomers); AddNav(nav,"المنتجات",ShowProducts); AddNav(nav,"الإعدادات والنسخ",ShowSettings);
            var header=new Panel{Dock=DockStyle.Top,Height=66,BackColor=Color.White,Padding=new Padding(22,10,22,10)};
            _pageTitle.Dock=DockStyle.Right; _pageTitle.Width=460; _pageTitle.Font=Ui.Font(17,FontStyle.Bold); _pageTitle.ForeColor=Ui.Navy; _pageTitle.TextAlign=ContentAlignment.MiddleRight; header.Controls.Add(_pageTitle);
            var quick=Ui.ActionButton("+ مستند جديد",true); quick.Dock=DockStyle.Left; quick.Width=135; quick.Click+=(s,e)=>Navigate(()=>ShowDocumentEditor(NewDocument("عرض سعر"))); header.Controls.Add(quick);
            _status.Dock=DockStyle.Bottom; _status.Height=28; _status.BackColor=Color.White; _status.ForeColor=Ui.Muted; _status.TextAlign=ContentAlignment.MiddleRight; _status.Padding=new Padding(12,0,12,0); _status.Text="جاهز";
            _content.Dock=DockStyle.Fill; _content.BackColor=Ui.Paper; _content.Padding=new Padding(18);
            Controls.Add(_content); Controls.Add(_status); Controls.Add(header); Controls.Add(side);
        }

        private void AddNav(FlowLayoutPanel nav,string text,Action action){var b=Ui.NavButton(text);b.Width=220;b.Margin=new Padding(0);b.Click+=(s,e)=>Navigate(action);nav.Controls.Add(b);}
        private void Navigate(Action action){AutoSave(false);action();}
        private void Clear(string title){_autosave.Stop();_pageTitle.Text=title;_content.SuspendLayout();foreach(Control c in _content.Controls)c.Dispose();_content.Controls.Clear();_doc=null;_items=null;_preview=null;_itemGrid=null;_dirty=false;_content.ResumeLayout();}
        private void MarkDirty(){if(_doc==null)return;_dirty=true;_status.Text="تغييرات غير محفوظة...";_autosave.Stop();_autosave.Start();RefreshPreviewOnly();}
        private void TrySaveState(){try{_storage.Save(_state);}catch(Exception ex){MessageBox.Show("تعذر حفظ البيانات:\n"+ex.Message,"الحفظ",MessageBoxButtons.OK,MessageBoxIcon.Error);}}

        private void ShowDashboard()
        {
            Clear("الرئيسية");
            var cards=new FlowLayoutPanel{Dock=DockStyle.Top,Height=145,FlowDirection=FlowDirection.RightToLeft,WrapContents=false};
            cards.Controls.Add(Metric("عروض الأسعار",_state.Documents.Count(x=>x.Type=="عرض سعر").ToString(),"QT")); cards.Controls.Add(Metric("الفواتير",_state.Documents.Count(x=>x.Type=="فاتورة").ToString(),"INV")); cards.Controls.Add(Metric("العملاء",_state.Customers.Count.ToString(),"CRM")); cards.Controls.Add(Metric("المنتجات",_state.Products.Count.ToString(),"SKU"));
            _content.Controls.Add(cards);
            var grid=DocsGrid(); grid.ReadOnly=true; foreach(var d in _state.Documents.OrderByDescending(x=>x.UpdatedAt).Take(20))grid.Rows.Add(d.Id,d.Number,d.Type,d.CustomerName,d.Date.ToString("yyyy-MM-dd"),d.GrandTotal.ToString("N2"),d.Currency);
            var card=Ui.Card();card.Dock=DockStyle.Fill;card.Padding=new Padding(14);card.Controls.Add(grid);grid.Dock=DockStyle.Fill;_content.Controls.Add(card);card.BringToFront();cards.BringToFront();
        }
        private Control Metric(string title,string value,string tag){var p=Ui.Card();p.Width=235;p.Height=112;p.Margin=new Padding(7);p.Controls.Add(new Label{Text=tag,AutoSize=true,ForeColor=Ui.Orange,Font=Ui.Font(9,FontStyle.Bold),Location=new Point(14,12)});p.Controls.Add(new Label{Text=value,AutoSize=true,ForeColor=Ui.Navy,Font=Ui.Font(24,FontStyle.Bold),Location=new Point(14,36)});p.Controls.Add(new Label{Text=title,AutoSize=true,ForeColor=Ui.Muted,Location=new Point(14,84)});return p;}

        private DocumentModel NewDocument(string type)=>new DocumentModel{Type=type,Number=NextNumber(type),Currency=string.IsNullOrWhiteSpace(_state.Settings.DefaultCurrency)?"USD":_state.Settings.DefaultCurrency,Items=new List<LineItem>{new LineItem{Carton="10*2"}}};
        private string NextNumber(string type,string ignoreId=null){string p=type=="فاتورة"?"INV":"QT";int y=DateTime.Today.Year,n=1;while(_state.Documents.Any(x=>x.Id!=ignoreId&&string.Equals(x.Number,$"{p}-{y}-{n:0000}",StringComparison.OrdinalIgnoreCase)))n++;return $"{p}-{y}-{n:0000}";}
        private bool NumberExists(string number,string ignoreId)=>_state.Documents.Any(x=>x.Id!=ignoreId&&string.Equals(x.Number,number,StringComparison.OrdinalIgnoreCase));

        private void ShowDocuments()
        {
            Clear("المستندات");
            var top=new FlowLayoutPanel{Dock=DockStyle.Top,Height=50,FlowDirection=FlowDirection.RightToLeft,WrapContents=false};
            var search=Ui.TextBox("");search.Width=260;search.PlaceholderText="بحث بالرقم أو العميل";var q=Ui.ActionButton("عرض سعر جديد",true);var i=Ui.ActionButton("فاتورة جديدة");q.Click+=(s,e)=>ShowDocumentEditor(NewDocument("عرض سعر"));i.Click+=(s,e)=>ShowDocumentEditor(NewDocument("فاتورة"));top.Controls.Add(q);top.Controls.Add(i);top.Controls.Add(search);_content.Controls.Add(top);
            var grid=DocsGrid();_content.Controls.Add(grid);grid.BringToFront();top.BringToFront();
            Action load=()=>{grid.Rows.Clear();string s=search.Text.Trim();foreach(var d in _state.Documents.OrderByDescending(x=>x.UpdatedAt).Where(x=>string.IsNullOrEmpty(s)||x.Number.Contains(s,StringComparison.OrdinalIgnoreCase)||(x.CustomerName??"").Contains(s,StringComparison.OrdinalIgnoreCase)))grid.Rows.Add(d.Id,d.Number,d.Type,d.CustomerName,d.Date.ToString("yyyy-MM-dd"),d.GrandTotal.ToString("N2"),d.Currency);};load();search.TextChanged+=(s,e)=>load();
            grid.CellDoubleClick+=(s,e)=>{if(e.RowIndex>=0){var d=SelectedDoc(grid);if(d!=null)ShowDocumentEditor(d);}};
            var bottom=new FlowLayoutPanel{Dock=DockStyle.Bottom,Height=52,FlowDirection=FlowDirection.RightToLeft};var open=Ui.ActionButton("فتح");var clone=Ui.ActionButton("نسخ");var convert=Ui.ActionButton("تحويل إلى فاتورة");var del=Ui.ActionButton("حذف");bottom.Controls.Add(open);bottom.Controls.Add(clone);bottom.Controls.Add(convert);bottom.Controls.Add(del);_content.Controls.Add(bottom);bottom.BringToFront();
            open.Click+=(s,e)=>{var d=SelectedDoc(grid);if(d!=null)ShowDocumentEditor(d);};
            clone.Click+=(s,e)=>{var d=SelectedDoc(grid);if(d==null)return;var c=CloneDoc(d);c.Id=Guid.NewGuid().ToString("N");c.Number=NextNumber(c.Type);c.CreatedAt=c.UpdatedAt=DateTime.Now;_state.Documents.Add(c);TrySaveState();load();SetStatus("تم إنشاء نسخة جديدة");};
            convert.Click+=(s,e)=>{var d=SelectedDoc(grid);if(d==null)return;var c=CloneDoc(d);c.Id=Guid.NewGuid().ToString("N");c.Type="فاتورة";c.Number=NextNumber("فاتورة");c.CreatedAt=c.UpdatedAt=DateTime.Now;_state.Documents.Add(c);TrySaveState();ShowDocumentEditor(c);};
            del.Click+=(s,e)=>{var d=SelectedDoc(grid);if(d!=null&&MessageBox.Show("حذف "+d.Number+"؟","تأكيد",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)==DialogResult.Yes){_state.Documents.Remove(d);TrySaveState();load();}};
        }
        private DataGridView DocsGrid(){var g=Ui.Grid();g.Dock=DockStyle.Fill;g.ReadOnly=true;g.Columns.Add("Id","Id");g.Columns[0].Visible=false;g.Columns.Add("Number","الرقم");g.Columns.Add("Type","النوع");g.Columns.Add("Customer","العميل");g.Columns.Add("Date","التاريخ");g.Columns.Add("Total","الإجمالي");g.Columns.Add("Currency","العملة");return g;}
        private DocumentModel SelectedDoc(DataGridView g){if(g.CurrentRow==null)return null;var id=g.CurrentRow.Cells[0].Value?.ToString();return _state.Documents.FirstOrDefault(x=>x.Id==id);}
        private static DocumentModel CloneDoc(DocumentModel d)=>new DocumentModel{Id=d.Id,Number=d.Number,Type=d.Type,Date=d.Date,ValidUntil=d.ValidUntil,Currency=d.Currency,CustomerId=d.CustomerId,CustomerName=d.CustomerName,CustomerPhone=d.CustomerPhone,CustomerEmail=d.CustomerEmail,CustomerAddress=d.CustomerAddress,Notes=d.Notes,PaymentTerms=d.PaymentTerms,QrText=d.QrText,GlobalDiscountPercent=d.GlobalDiscountPercent,CreatedAt=d.CreatedAt,UpdatedAt=d.UpdatedAt,Items=(d.Items??new()).Select(x=>new LineItem{Name=x.Name,Quantity=x.Quantity,Carton=x.Carton,UnitPrice=x.UnitPrice,DiscountPercent=x.DiscountPercent,TaxPercent=x.TaxPercent,Note=x.Note,Barcode=x.Barcode}).ToList()};

        private void ShowDocumentEditor(DocumentModel document)
        {
            Clear(document.Type+" - "+document.Number);_doc=document;_items=new BindingList<LineItem>(document.Items??new List<LineItem>());_pageIndex=0;
            var bar=new FlowLayoutPanel{Dock=DockStyle.Top,Height=52,FlowDirection=FlowDirection.RightToLeft,WrapContents=false};var save=Ui.ActionButton("حفظ",true);var pdf=Ui.ActionButton("حفظ PDF");var print=Ui.ActionButton("طباعة");var add=Ui.ActionButton("+ صف");var remove=Ui.ActionButton("حذف الصف");bar.Controls.Add(save);bar.Controls.Add(pdf);bar.Controls.Add(print);bar.Controls.Add(add);bar.Controls.Add(remove);_content.Controls.Add(bar);
            save.Click+=(s,e)=>SaveCurrent(true);pdf.Click+=(s,e)=>ExportPdf();print.Click+=(s,e)=>PrintCurrent();add.Click+=(s,e)=>{_items.Add(new LineItem{Carton="10*2"});MarkDirty();};remove.Click+=(s,e)=>{if(_itemGrid?.CurrentRow!=null&&_itemGrid.CurrentRow.Index>=0&&_itemGrid.CurrentRow.Index<_items.Count){_items.RemoveAt(_itemGrid.CurrentRow.Index);MarkDirty();}};
            var split=new SplitContainer{Dock=DockStyle.Fill,Orientation=Orientation.Vertical,SplitterWidth=6,BackColor=Ui.Paper,SplitterDistance=710};split.Panel1.Padding=new Padding(0,0,8,0);split.Panel2.Padding=new Padding(8,0,0,0);_content.Controls.Add(split);split.BringToFront();bar.BringToFront();
            BuildEditor(split.Panel1,document);BuildPreview(split.Panel2);RefreshPreviewOnly();
        }

        private void BuildEditor(Control host,DocumentModel d)
        {
            var editor=new Panel{Dock=DockStyle.Fill,AutoScroll=true,BackColor=Color.White,Padding=new Padding(12)};host.Controls.Add(editor);
            var meta=Table(4,4,170);_docType=new ComboBox{DropDownStyle=ComboBoxStyle.DropDownList,Font=Ui.Font(10)};_docType.Items.AddRange(new object[]{"عرض سعر","فاتورة"});_docType.SelectedItem=d.Type;_docNumber=Ui.TextBox(d.Number);_docNumber.RightToLeft=RightToLeft.No;_docDate=Date(d.Date);_validUntil=Date(d.ValidUntil);_currency=Ui.TextBox(d.Currency);_currency.RightToLeft=RightToLeft.No;_globalDiscount=new NumericUpDown{Minimum=0,Maximum=100,DecimalPlaces=2,Value=Math.Max(0,Math.Min(100,d.GlobalDiscountPercent)),Font=Ui.Font(10)};_customerPicker=new ComboBox{DropDownStyle=ComboBoxStyle.DropDownList,Font=Ui.Font(10)};_customerPicker.Items.Add("-- اختيار عميل محفوظ --");foreach(var c in _state.Customers)_customerPicker.Items.Add(c);_customerPicker.SelectedIndex=0;
            Field(meta,0,"نوع المستند",_docType);Field(meta,1,"رقم المستند",_docNumber);Field(meta,2,"التاريخ",_docDate);Field(meta,3,"صالح حتى",_validUntil);Field(meta,4,"العملة",_currency);Field(meta,5,"خصم عام %",_globalDiscount);Field(meta,6,"عميل محفوظ",_customerPicker);editor.Controls.Add(meta);
            var customer=Table(4,2,112);_customerName=Ui.TextBox(d.CustomerName);_customerPhone=Ui.TextBox(d.CustomerPhone);_customerPhone.RightToLeft=RightToLeft.No;_customerEmail=Ui.TextBox(d.CustomerEmail);_customerEmail.RightToLeft=RightToLeft.No;_customerAddress=Ui.TextBox(d.CustomerAddress);Field(customer,0,"اسم العميل",_customerName);Field(customer,1,"الهاتف",_customerPhone);Field(customer,2,"البريد",_customerEmail);Field(customer,3,"العنوان",_customerAddress);editor.Controls.Add(customer);
            var ps=new FlowLayoutPanel{Dock=DockStyle.Top,Height=44,FlowDirection=FlowDirection.RightToLeft,WrapContents=false};var products=new ComboBox{Width=270,DropDownStyle=ComboBoxStyle.DropDownList,Font=Ui.Font(10)};products.Items.Add("-- منتج محفوظ --");foreach(var p in _state.Products)products.Items.Add(p);products.SelectedIndex=0;var addP=Ui.ActionButton("إضافة المنتج");addP.Width=115;addP.Click+=(s,e)=>{if(products.SelectedItem is Product p){_items.Add(new LineItem{Name=p.Name,UnitPrice=p.DefaultPrice,Carton=p.CartonFormat,Barcode=p.Barcode,Note=p.Note});MarkDirty();}};ps.Controls.Add(products);ps.Controls.Add(addP);editor.Controls.Add(ps);
            _itemGrid=Ui.Grid();_itemGrid.Dock=DockStyle.Top;_itemGrid.Height=275;_itemGrid.AutoGenerateColumns=false;_itemGrid.DataSource=_items;Col("Name","الصنف",150);Col("Quantity","الكمية",65,"0.##");Col("Carton","الكرتون مثل 10*2",110);Col("UnitPrice","سعر الوحدة",80,"N2");Col("DiscountPercent","خصم %",65,"0.##");Col("TaxPercent","ضريبة %",65,"0.##");Col("Total","الإجمالي",85,"N2",true);Col("Barcode","الباركود",100);Col("Note","ملاحظة",130);_itemGrid.CellEndEdit+=(s,e)=>MarkDirty();_itemGrid.DataError+=(s,e)=>e.ThrowException=false;editor.Controls.Add(_itemGrid);
            var noteTable=Table(2,3,150);_notes=new TextBox{Text=d.Notes,Multiline=true,ScrollBars=ScrollBars.Vertical,Font=Ui.Font(9.5f)};_terms=Ui.TextBox(d.PaymentTerms);_qr=Ui.TextBox(d.QrText);Field2(noteTable,0,"ملاحظات",_notes);Field2(noteTable,1,"شروط الدفع",_terms);Field2(noteTable,2,"نص QR",_qr);editor.Controls.Add(noteTable);
            _totalsLabel=new Label{Dock=DockStyle.Top,Height=76,ForeColor=Ui.Navy,Font=Ui.Font(10,FontStyle.Bold),TextAlign=ContentAlignment.MiddleRight,Padding=new Padding(8)};editor.Controls.Add(_totalsLabel);
            _totalsLabel.BringToFront();noteTable.BringToFront();_itemGrid.BringToFront();ps.BringToFront();customer.BringToFront();meta.BringToFront();
            EventHandler ch=(s,e)=>MarkDirty();_docNumber.TextChanged+=ch;_docDate.ValueChanged+=ch;_validUntil.ValueChanged+=ch;_currency.TextChanged+=ch;_globalDiscount.ValueChanged+=ch;_customerName.TextChanged+=ch;_customerPhone.TextChanged+=ch;_customerEmail.TextChanged+=ch;_customerAddress.TextChanged+=ch;_notes.TextChanged+=ch;_terms.TextChanged+=ch;_qr.TextChanged+=ch;
            _docType.SelectedIndexChanged+=(s,e)=>{var t=_docType.SelectedItem?.ToString();if(_doc!=null&&!string.IsNullOrEmpty(t)&&t!=_doc.Type){_docNumber.Text=NextNumber(t,_doc.Id);MarkDirty();}};
            _customerPicker.SelectedIndexChanged+=(s,e)=>{if(_customerPicker.SelectedItem is Customer c){_doc.CustomerId=c.Id;_customerName.Text=string.IsNullOrWhiteSpace(c.Company)?c.Name:c.Company;_customerPhone.Text=c.Phone;_customerEmail.Text=c.Email;_customerAddress.Text=c.Address;}};
        }

        private void BuildPreview(Control host){var wrap=new Panel{Dock=DockStyle.Fill,BackColor=Color.White,Padding=new Padding(8)};host.Controls.Add(wrap);var nav=new FlowLayoutPanel{Dock=DockStyle.Bottom,Height=44,FlowDirection=FlowDirection.LeftToRight};var prev=Ui.ActionButton("السابق");prev.Width=80;var next=Ui.ActionButton("التالي");next.Width=80;_pageLabel=new Label{Width=120,Height=36,TextAlign=ContentAlignment.MiddleCenter,Font=Ui.Font(9,FontStyle.Bold)};prev.Click+=(s,e)=>{if(_pageIndex>0){_pageIndex--;RefreshPreviewOnly();}};next.Click+=(s,e)=>{Commit();if(_pageIndex+1<DocumentRenderer.GetPageCount(_doc)){_pageIndex++;RefreshPreviewOnly();}};nav.Controls.Add(prev);nav.Controls.Add(_pageLabel);nav.Controls.Add(next);wrap.Controls.Add(nav);_preview=new DocumentPreviewPanel{Dock=DockStyle.Fill,Document=_doc,Settings=_state.Settings};wrap.Controls.Add(_preview);_preview.BringToFront();nav.BringToFront();}
        private TableLayoutPanel Table(int cols,int rows,int height){var t=new TableLayoutPanel{Dock=DockStyle.Top,Height=height,ColumnCount=cols,RowCount=rows,Padding=new Padding(4)};for(int i=0;i<cols;i++)t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,i%2==0?16:34));for(int r=0;r<rows;r++)t.RowStyles.Add(new RowStyle(SizeType.Percent,100f/rows));return t;}
        private void Field(TableLayoutPanel t,int index,string label,Control c){int row=index/2,col=(index%2)*2;var l=Ui.Label(label,9,true);l.Dock=DockStyle.Fill;l.TextAlign=ContentAlignment.MiddleRight;c.Dock=DockStyle.Fill;c.Margin=new Padding(4);t.Controls.Add(l,col,row);t.Controls.Add(c,col+1,row);}
        private void Field2(TableLayoutPanel t,int row,string label,Control c){var l=Ui.Label(label,9,true);l.Dock=DockStyle.Fill;l.TextAlign=ContentAlignment.MiddleRight;c.Dock=DockStyle.Fill;c.Margin=new Padding(4);t.Controls.Add(l,0,row);t.Controls.Add(c,1,row);}
        private DateTimePicker Date(DateTime v)=>new DateTimePicker{Value=v,Format=DateTimePickerFormat.Custom,CustomFormat="yyyy-MM-dd",Font=Ui.Font(10)};
        private void Col(string property,string header,int weight,string format=null,bool ro=false){var c=new DataGridViewTextBoxColumn{DataPropertyName=property,HeaderText=header,Name=property,MinimumWidth=55,FillWeight=weight,ReadOnly=ro};if(format!=null)c.DefaultCellStyle.Format=format;_itemGrid.Columns.Add(c);}

        private void Commit()
        {
            if(_doc==null||_docType==null)return;_itemGrid?.EndEdit();_doc.Type=_docType.SelectedItem?.ToString()??"عرض سعر";_doc.Number=(_docNumber.Text??"").Trim();_doc.Date=_docDate.Value.Date;_doc.ValidUntil=_validUntil.Value.Date;_doc.Currency=string.IsNullOrWhiteSpace(_currency.Text)?"USD":_currency.Text.Trim();_doc.CustomerName=_customerName.Text.Trim();_doc.CustomerPhone=_customerPhone.Text.Trim();_doc.CustomerEmail=_customerEmail.Text.Trim();_doc.CustomerAddress=_customerAddress.Text.Trim();_doc.GlobalDiscountPercent=_globalDiscount.Value;_doc.Notes=_notes.Text;_doc.PaymentTerms=_terms.Text;_doc.QrText=_qr.Text.Trim();_doc.Items=_items.ToList();_doc.UpdatedAt=DateTime.Now;
        }
        private void AutoSave(bool userMessage){if(_doc==null||_docType==null)return;Commit();if(string.IsNullOrWhiteSpace(_doc.Number)||NumberExists(_doc.Number,_doc.Id)){var old=_doc.Number;_doc.Number=NextNumber(_doc.Type,_doc.Id);_docNumber.Text=_doc.Number;if(!string.IsNullOrWhiteSpace(old))SetStatus("تم منع رقم مكرر وإنشاء "+_doc.Number);}if(!_state.Documents.Any(x=>x.Id==_doc.Id))_state.Documents.Add(_doc);TrySaveState();_dirty=false;_autosave.Stop();if(userMessage)SetStatus("تم حفظ "+_doc.Number);else if(_status.Text.StartsWith("تغييرات"))SetStatus("حفظ تلقائي ✓");RefreshPreviewOnly();}
        private void SaveCurrent(bool msg){AutoSave(msg);}
        private void RefreshPreviewOnly(){if(_doc==null||_preview==null)return;try{Commit();int count=DocumentRenderer.GetPageCount(_doc);if(_pageIndex>=count)_pageIndex=count-1;_preview.PageIndex=Math.Max(0,_pageIndex);_preview.Document=_doc;_preview.Settings=_state.Settings;_pageLabel.Text=$"صفحة {_preview.PageIndex+1} / {count}";_preview.Invalidate();if(_totalsLabel!=null)_totalsLabel.Text=$"المجموع: {_doc.Subtotal:N2}  |  خصومات: {_doc.LineDiscounts:N2}  |  ضريبة: {_doc.Taxes:N2}\r\nالإجمالي النهائي: {_doc.GrandTotal:N2} {_doc.Currency}";}catch{}}

        private void ExportPdf(){if(_doc==null)return;SaveCurrent(false);var printer=PrinterSettings.InstalledPrinters.Cast<string>().FirstOrDefault(x=>x.Equals("Microsoft Print to PDF",StringComparison.OrdinalIgnoreCase));if(printer==null){MessageBox.Show("Microsoft Print to PDF غير متوفر. استخدم زر الطباعة واختر طابعة PDF.");return;}using var d=new SaveFileDialog{Filter="PDF|*.pdf",FileName=SafeName(_doc.Number)+".pdf"};if(d.ShowDialog(this)!=DialogResult.OK)return;try{var s=new DocumentPrintSession(_doc,_state.Settings);s.PrintDocument.PrinterSettings.PrinterName=printer;s.PrintDocument.PrinterSettings.PrintToFile=true;s.PrintDocument.PrinterSettings.PrintFileName=d.FileName;s.PrintDocument.PrintController=new StandardPrintController();s.PrintDocument.Print();SetStatus("تم إنشاء PDF");}catch(Exception ex){MessageBox.Show("تعذر إنشاء PDF:\n"+ex.Message);}}
        private void PrintCurrent(){if(_doc==null)return;SaveCurrent(false);var s=new DocumentPrintSession(_doc,_state.Settings);using var d=new PrintDialog{Document=s.PrintDocument,UseEXDialog=true};if(d.ShowDialog(this)==DialogResult.OK)try{s.PrintDocument.Print();}catch(Exception ex){MessageBox.Show(ex.Message,"الطباعة");}}

        private void ShowCustomers(){Clear("العملاء");var top=new FlowLayoutPanel{Dock=DockStyle.Top,Height=50,FlowDirection=FlowDirection.RightToLeft};var add=Ui.ActionButton("+ عميل",true),edit=Ui.ActionButton("تعديل"),del=Ui.ActionButton("حذف");top.Controls.Add(add);top.Controls.Add(edit);top.Controls.Add(del);_content.Controls.Add(top);var g=Ui.Grid();g.ReadOnly=true;g.Columns.Add("Id","Id");g.Columns[0].Visible=false;g.Columns.Add("Name","الاسم");g.Columns.Add("Company","الشركة");g.Columns.Add("Phone","الهاتف");g.Columns.Add("Email","البريد");g.Columns.Add("Address","العنوان");_content.Controls.Add(g);g.BringToFront();top.BringToFront();Action load=()=>{g.Rows.Clear();foreach(var c in _state.Customers.OrderBy(x=>x.Company).ThenBy(x=>x.Name))g.Rows.Add(c.Id,c.Name,c.Company,c.Phone,c.Email,c.Address);};load();add.Click+=(s,e)=>{var c=new Customer();if(EditCustomer(c)){_state.Customers.Add(c);TrySaveState();load();}};edit.Click+=(s,e)=>{var c=SelectedCustomer(g);if(c!=null&&EditCustomer(c)){TrySaveState();load();}};del.Click+=(s,e)=>{var c=SelectedCustomer(g);if(c!=null&&MessageBox.Show("حذف العميل؟","تأكيد",MessageBoxButtons.YesNo)==DialogResult.Yes){_state.Customers.Remove(c);TrySaveState();load();}};g.CellDoubleClick+=(s,e)=>{if(e.RowIndex>=0){var c=SelectedCustomer(g);if(c!=null&&EditCustomer(c)){TrySaveState();load();}}};}
        private Customer SelectedCustomer(DataGridView g){if(g.CurrentRow==null)return null;var id=g.CurrentRow.Cells[0].Value?.ToString();return _state.Customers.FirstOrDefault(x=>x.Id==id);}
        private bool EditCustomer(Customer c){using var f=Dialog("بيانات العميل",510,455);var t=DialogTable();f.Controls.Add(t);var n=Ui.TextBox(c.Name);var co=Ui.TextBox(c.Company);var ph=Ui.TextBox(c.Phone);ph.RightToLeft=RightToLeft.No;var em=Ui.TextBox(c.Email);em.RightToLeft=RightToLeft.No;var ad=Ui.TextBox(c.Address);DRow(t,0,"الاسم",n);DRow(t,1,"الشركة",co);DRow(t,2,"الهاتف",ph);DRow(t,3,"البريد",em);DRow(t,4,"العنوان",ad);Buttons(f,()=>{c.Name=n.Text.Trim();c.Company=co.Text.Trim();c.Phone=ph.Text.Trim();c.Email=em.Text.Trim();c.Address=ad.Text.Trim();});return f.ShowDialog(this)==DialogResult.OK;}

        private void ShowProducts(){Clear("المنتجات");var top=new FlowLayoutPanel{Dock=DockStyle.Top,Height=50,FlowDirection=FlowDirection.RightToLeft};var add=Ui.ActionButton("+ منتج",true),edit=Ui.ActionButton("تعديل"),del=Ui.ActionButton("حذف");top.Controls.Add(add);top.Controls.Add(edit);top.Controls.Add(del);_content.Controls.Add(top);var g=Ui.Grid();g.ReadOnly=true;g.Columns.Add("Id","Id");g.Columns[0].Visible=false;g.Columns.Add("Name","المنتج");g.Columns.Add("Price","السعر");g.Columns.Add("Carton","الكرتون");g.Columns.Add("Barcode","الباركود");g.Columns.Add("Note","ملاحظة");_content.Controls.Add(g);g.BringToFront();top.BringToFront();Action load=()=>{g.Rows.Clear();foreach(var p in _state.Products.OrderBy(x=>x.Name))g.Rows.Add(p.Id,p.Name,p.DefaultPrice.ToString("N2"),p.CartonFormat,p.Barcode,p.Note);};load();add.Click+=(s,e)=>{var p=new Product();if(EditProduct(p)){_state.Products.Add(p);TrySaveState();load();}};edit.Click+=(s,e)=>{var p=SelectedProduct(g);if(p!=null&&EditProduct(p)){TrySaveState();load();}};del.Click+=(s,e)=>{var p=SelectedProduct(g);if(p!=null&&MessageBox.Show("حذف المنتج؟","تأكيد",MessageBoxButtons.YesNo)==DialogResult.Yes){_state.Products.Remove(p);TrySaveState();load();}};g.CellDoubleClick+=(s,e)=>{if(e.RowIndex>=0){var p=SelectedProduct(g);if(p!=null&&EditProduct(p)){TrySaveState();load();}}};}
        private Product SelectedProduct(DataGridView g){if(g.CurrentRow==null)return null;var id=g.CurrentRow.Cells[0].Value?.ToString();return _state.Products.FirstOrDefault(x=>x.Id==id);}
        private bool EditProduct(Product p){using var f=Dialog("بيانات المنتج",510,450);var t=DialogTable();f.Controls.Add(t);var n=Ui.TextBox(p.Name);var pr=Ui.TextBox(p.DefaultPrice.ToString("0.##"));pr.RightToLeft=RightToLeft.No;var ca=Ui.TextBox(string.IsNullOrWhiteSpace(p.CartonFormat)?"10*2":p.CartonFormat);ca.RightToLeft=RightToLeft.No;var bc=Ui.TextBox(p.Barcode);bc.RightToLeft=RightToLeft.No;var no=Ui.TextBox(p.Note);DRow(t,0,"اسم المنتج",n);DRow(t,1,"السعر",pr);DRow(t,2,"الكرتون",ca);DRow(t,3,"الباركود",bc);DRow(t,4,"ملاحظات",no);f.Controls.Add(new Label{Text="الكرتون حقل نصي حر: 10*2 أو 12*6 أو 24*1",Dock=DockStyle.Bottom,Height=30,ForeColor=Ui.Orange,TextAlign=ContentAlignment.MiddleCenter,Font=Ui.Font(9,FontStyle.Bold)});Buttons(f,()=>{decimal.TryParse(pr.Text,out var v);p.Name=n.Text.Trim();p.DefaultPrice=v;p.CartonFormat=ca.Text.Trim();p.Barcode=bc.Text.Trim();p.Note=no.Text.Trim();});return f.ShowDialog(this)==DialogResult.OK;}

        private Form Dialog(string title,int w,int h)=>new Form{Text=title,Width=w,Height=h,StartPosition=FormStartPosition.CenterParent,Font=Ui.Font(),RightToLeft=RightToLeft.Yes,RightToLeftLayout=true,BackColor=Color.White,MinimizeBox=false,MaximizeBox=false};
        private TableLayoutPanel DialogTable(){var t=new TableLayoutPanel{Dock=DockStyle.Fill,ColumnCount=2,RowCount=6,Padding=new Padding(18,18,18,68)};t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,28));t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,72));for(int i=0;i<6;i++)t.RowStyles.Add(new RowStyle(SizeType.Absolute,50));return t;}
        private void DRow(TableLayoutPanel t,int row,string label,Control f){var l=Ui.Label(label,9,true);l.Dock=DockStyle.Fill;l.TextAlign=ContentAlignment.MiddleRight;f.Dock=DockStyle.Fill;f.Margin=new Padding(3,7,3,7);t.Controls.Add(l,0,row);t.Controls.Add(f,1,row);}
        private void Buttons(Form f,Action before){var b=new FlowLayoutPanel{Dock=DockStyle.Bottom,Height=58,FlowDirection=FlowDirection.LeftToRight,Padding=new Padding(14,8,14,8)};var ok=Ui.ActionButton("حفظ",true);var cancel=Ui.ActionButton("إلغاء");ok.DialogResult=DialogResult.OK;cancel.DialogResult=DialogResult.Cancel;ok.Click+=(s,e)=>before();b.Controls.Add(ok);b.Controls.Add(cancel);f.Controls.Add(b);b.BringToFront();f.AcceptButton=ok;f.CancelButton=cancel;}

        private void ShowSettings()
        {
            Clear("الإعدادات والنسخ");var scroll=new Panel{Dock=DockStyle.Fill,AutoScroll=true,BackColor=Color.White,Padding=new Padding(22)};_content.Controls.Add(scroll);var t=new TableLayoutPanel{Dock=DockStyle.Top,Height=590,ColumnCount=2,RowCount=13,Padding=new Padding(10)};t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,24));t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,76));var s=_state.Settings;
            var company=Ui.TextBox(s.CompanyName),a1=Ui.TextBox(s.Address1),a2=Ui.TextBox(s.Address2),phone=Ui.TextBox(s.Phone),email=Ui.TextBox(s.Email),web=Ui.TextBox(s.Website),tax=Ui.TextBox(s.TaxNumber),currency=Ui.TextBox(s.DefaultCurrency),primary=Ui.TextBox(s.PrimaryColorHex),accent=Ui.TextBox(s.AccentColorHex),footer=Ui.TextBox(s.FooterText),font=Ui.TextBox(s.FontName);phone.RightToLeft=email.RightToLeft=web.RightToLeft=currency.RightToLeft=primary.RightToLeft=accent.RightToLeft=font.RightToLeft=RightToLeft.No;var template=new ComboBox{DropDownStyle=ComboBoxStyle.DropDownList,Font=Ui.Font(10)};template.Items.AddRange(new object[]{"Modern","Corporate","Minimal"});template.SelectedItem=template.Items.Contains(s.TemplatePreset)?s.TemplatePreset:"Modern";
            DRow(t,0,"اسم الشركة",company);DRow(t,1,"العنوان 1",a1);DRow(t,2,"العنوان 2",a2);DRow(t,3,"الهاتف",phone);DRow(t,4,"البريد",email);DRow(t,5,"الموقع",web);DRow(t,6,"الرقم الضريبي",tax);DRow(t,7,"العملة الافتراضية",currency);DRow(t,8,"اللون الرئيسي",primary);DRow(t,9,"لون التمييز",accent);DRow(t,10,"نص الفوتر",footer);DRow(t,11,"الخط",font);DRow(t,12,"القالب",template);scroll.Controls.Add(t);
            var tools=new FlowLayoutPanel{Dock=DockStyle.Top,Height=180,FlowDirection=FlowDirection.RightToLeft,WrapContents=true,Padding=new Padding(8)};string[] names={"حفظ الإعدادات","اختيار الشعار","نسخة احتياطية","استعادة نسخة","تصدير JSON","استيراد JSON","تصدير المنتجات CSV","استيراد المنتجات CSV","تصدير العملاء CSV","استيراد العملاء CSV","فتح مجلد البيانات"};var btns=names.ToDictionary(n=>n,n=>Ui.ActionButton(n,n=="حفظ الإعدادات"));foreach(var b in btns.Values){b.Width=Math.Max(120,b.Text.Length*9+32);tools.Controls.Add(b);}scroll.Controls.Add(tools);tools.BringToFront();t.BringToFront();
            btns["حفظ الإعدادات"].Click+=(o,e)=>{s.CompanyName=company.Text.Trim();s.Address1=a1.Text.Trim();s.Address2=a2.Text.Trim();s.Phone=phone.Text.Trim();s.Email=email.Text.Trim();s.Website=web.Text.Trim();s.TaxNumber=tax.Text.Trim();s.DefaultCurrency=currency.Text.Trim();s.PrimaryColorHex=primary.Text.Trim();s.AccentColorHex=accent.Text.Trim();s.FooterText=footer.Text.Trim();s.FontName=font.Text.Trim();s.TemplatePreset=template.SelectedItem?.ToString()??"Modern";TrySaveState();SetStatus("تم حفظ الإعدادات");};
            btns["اختيار الشعار"].Click+=(o,e)=>{using var d=new OpenFileDialog{Filter="صور|*.png;*.jpg;*.jpeg;*.bmp"};if(d.ShowDialog(this)==DialogResult.OK){s.LogoPath=_storage.ImportLogo(d.FileName);TrySaveState();SetStatus("تم حفظ نسخة من الشعار داخل بيانات البرنامج");}};
            btns["نسخة احتياطية"].Click+=(o,e)=>{using var d=new SaveFileDialog{Filter="Quotation Studio Backup|*.qsbak",FileName="QuotationStudio-"+DateTime.Now.ToString("yyyyMMdd-HHmm")+".qsbak"};if(d.ShowDialog(this)==DialogResult.OK){_storage.Backup(d.FileName,_state);SetStatus("تم إنشاء النسخة الاحتياطية");}};
            btns["استعادة نسخة"].Click+=(o,e)=>{using var d=new OpenFileDialog{Filter="Quotation Studio Backup|*.qsbak"};if(d.ShowDialog(this)==DialogResult.OK&&MessageBox.Show("استبدال البيانات الحالية؟","استعادة",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)==DialogResult.Yes){_state=_storage.Restore(d.FileName);ShowDashboard();SetStatus("تمت الاستعادة");}};
            btns["تصدير JSON"].Click+=(o,e)=>{using var d=new SaveFileDialog{Filter="JSON|*.json",FileName="quotation-data.json"};if(d.ShowDialog(this)==DialogResult.OK)_storage.ExportJson(d.FileName,_state);};
            btns["استيراد JSON"].Click+=(o,e)=>{using var d=new OpenFileDialog{Filter="JSON|*.json"};if(d.ShowDialog(this)==DialogResult.OK&&MessageBox.Show("سيتم استبدال البيانات الحالية. متابعة؟","JSON",MessageBoxButtons.YesNo)==DialogResult.Yes){_state=_storage.ImportJson(d.FileName);ShowDashboard();}};
            btns["تصدير المنتجات CSV"].Click+=(o,e)=>{using var d=new SaveFileDialog{Filter="CSV|*.csv",FileName="products.csv"};if(d.ShowDialog(this)==DialogResult.OK)_storage.ExportProductsCsv(d.FileName,_state);};
            btns["استيراد المنتجات CSV"].Click+=(o,e)=>{using var d=new OpenFileDialog{Filter="CSV|*.csv"};if(d.ShowDialog(this)==DialogResult.OK){int c=_storage.ImportProductsCsv(d.FileName,_state);_state=_storage.Load();SetStatus("تم استيراد "+c+" منتج");}};
            btns["تصدير العملاء CSV"].Click+=(o,e)=>{using var d=new SaveFileDialog{Filter="CSV|*.csv",FileName="customers.csv"};if(d.ShowDialog(this)==DialogResult.OK)_storage.ExportCustomersCsv(d.FileName,_state);};
            btns["استيراد العملاء CSV"].Click+=(o,e)=>{using var d=new OpenFileDialog{Filter="CSV|*.csv"};if(d.ShowDialog(this)==DialogResult.OK){int c=_storage.ImportCustomersCsv(d.FileName,_state);_state=_storage.Load();SetStatus("تم استيراد "+c+" عميل");}};
            btns["فتح مجلد البيانات"].Click+=(o,e)=>Process.Start(new ProcessStartInfo("explorer.exe",_storage.DataFolder){UseShellExecute=true});
        }

        private void SetStatus(string t){_status.Text=t;}
        private static string SafeName(string s){if(string.IsNullOrWhiteSpace(s))s="document";foreach(var c in Path.GetInvalidFileNameChars())s=s.Replace(c,'-');return s;}
    }
}
