using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Linq;
using System.Windows.Forms;

namespace QuotationStudio
{
    public sealed class MainForm : Form
    {
        private readonly StorageService _storage = new StorageService();
        private AppState _state;
        private readonly Panel _content = new Panel();
        private readonly Label _pageTitle = new Label();
        private readonly Label _status = new Label();

        private DocumentModel _editingDocument;
        private BindingList<LineItem> _editingItems;
        private ComboBox _docType;
        private TextBox _docNumber;
        private DateTimePicker _docDate;
        private DateTimePicker _validUntil;
        private TextBox _currency;
        private ComboBox _customerPicker;
        private TextBox _customerName;
        private TextBox _customerPhone;
        private TextBox _customerEmail;
        private TextBox _customerAddress;
        private NumericUpDown _globalDiscount;
        private TextBox _notes;
        private TextBox _qrText;
        private DataGridView _itemGrid;
        private DocumentPreviewPanel _preview;
        private Label _previewPageLabel;
        private int _previewPageIndex;

        public MainForm()
        {
            _state = _storage.Load();
            Text = "Quotation Studio - عروض الأسعار والفواتير";
            Width = 1380;
            Height = 860;
            MinimumSize = new Size(1120, 700);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Ui.Paper;
            Font = Ui.Font();
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;
            KeyPreview = true;
            BuildShell();
            ShowDashboard();
            FormClosing += (s, e) => SafeSave();
            KeyDown += MainForm_KeyDown;
        }

        private void BuildShell()
        {
            var sidebar = new Panel { Dock = DockStyle.Right, Width = 220, BackColor = Ui.Teal, Padding = new Padding(0, 14, 0, 0) };
            var brand = new Label
            {
                Text = "QUOTATION\nSTUDIO",
                Dock = DockStyle.Top,
                Height = 78,
                ForeColor = Color.White,
                Font = Ui.Font(16, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter
            };
            sidebar.Controls.Add(brand);

            var nav = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.TopDown,
                WrapContents = false,
                BackColor = Ui.Teal,
                Padding = new Padding(0, 8, 0, 0),
                AutoScroll = false
            };
            sidebar.Controls.Add(nav);
            nav.BringToFront();

            AddNav(nav, "الرئيسية", ShowDashboard);
            AddNav(nav, "عرض سعر جديد", () => ShowDocumentEditor(NewDocument("عرض سعر")));
            AddNav(nav, "فاتورة جديدة", () => ShowDocumentEditor(NewDocument("فاتورة")));
            AddNav(nav, "المستندات", ShowDocuments);
            AddNav(nav, "العملاء", ShowCustomers);
            AddNav(nav, "المنتجات", ShowProducts);
            AddNav(nav, "الإعدادات والنسخ", ShowSettings);

            var header = new Panel { Dock = DockStyle.Top, Height = 66, BackColor = Color.White, Padding = new Padding(22, 10, 22, 10) };
            _pageTitle.Text = "الرئيسية";
            _pageTitle.Dock = DockStyle.Right;
            _pageTitle.Width = 360;
            _pageTitle.Font = Ui.Font(17, FontStyle.Bold);
            _pageTitle.ForeColor = Ui.Navy;
            _pageTitle.TextAlign = ContentAlignment.MiddleRight;
            header.Controls.Add(_pageTitle);

            var quick = Ui.ActionButton("+ مستند جديد", true);
            quick.Dock = DockStyle.Left;
            quick.Width = 135;
            quick.Click += (s, e) => ShowDocumentEditor(NewDocument("عرض سعر"));
            header.Controls.Add(quick);

            _status.Dock = DockStyle.Bottom;
            _status.Height = 28;
            _status.BackColor = Color.White;
            _status.ForeColor = Ui.Muted;
            _status.TextAlign = ContentAlignment.MiddleRight;
            _status.Padding = new Padding(12, 0, 12, 0);
            _status.Text = "جاهز";

            _content.Dock = DockStyle.Fill;
            _content.BackColor = Ui.Paper;
            _content.Padding = new Padding(18);

            Controls.Add(_content);
            Controls.Add(_status);
            Controls.Add(header);
            Controls.Add(sidebar);
        }

        private void AddNav(FlowLayoutPanel nav, string text, Action action)
        {
            var b = Ui.NavButton(text);
            b.Dock = DockStyle.None;
            b.Width = 220;
            b.Margin = new Padding(0);
            b.Click += (s, e) => action();
            nav.Controls.Add(b);
        }

        private void MainForm_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Control && e.KeyCode == Keys.N) { ShowDocumentEditor(NewDocument("عرض سعر")); e.SuppressKeyPress = true; }
            if (e.Control && e.KeyCode == Keys.S && _editingDocument != null) { SaveCurrentDocument(true); e.SuppressKeyPress = true; }
            if (e.Control && e.KeyCode == Keys.P && _editingDocument != null) { PrintCurrent(); e.SuppressKeyPress = true; }
        }

        private void ClearContent(string title)
        {
            _pageTitle.Text = title;
            _content.SuspendLayout();
            foreach (Control c in _content.Controls) c.Dispose();
            _content.Controls.Clear();
            _editingDocument = null;
            _content.ResumeLayout();
        }

        private Label Heading(string title, string subtitle = null)
        {
            var l = new Label
            {
                AutoSize = false,
                Height = string.IsNullOrEmpty(subtitle) ? 44 : 64,
                Dock = DockStyle.Top,
                Text = string.IsNullOrEmpty(subtitle) ? title : title + "\r\n" + subtitle,
                Font = Ui.Font(15, FontStyle.Bold),
                ForeColor = Ui.Navy,
                TextAlign = ContentAlignment.MiddleRight,
                Padding = new Padding(8)
            };
            return l;
        }

        private void ShowDashboard()
        {
            ClearContent("الرئيسية");
            var top = Heading("لوحة التحكم", "إدارة عروض الأسعار والفواتير من مكان واحد");
            _content.Controls.Add(top);

            var cards = new FlowLayoutPanel
            {
                Dock = DockStyle.Top,
                Height = 142,
                FlowDirection = FlowDirection.RightToLeft,
                WrapContents = false,
                Padding = new Padding(0, 8, 0, 8)
            };
            cards.Controls.Add(MetricCard("عروض الأسعار", _state.Documents.Count(x => x.Type == "عرض سعر").ToString(), "QT"));
            cards.Controls.Add(MetricCard("الفواتير", _state.Documents.Count(x => x.Type == "فاتورة").ToString(), "INV"));
            cards.Controls.Add(MetricCard("العملاء", _state.Customers.Count.ToString(), "CRM"));
            cards.Controls.Add(MetricCard("المنتجات", _state.Products.Count.ToString(), "SKU"));
            _content.Controls.Add(cards);
            cards.BringToFront(); top.BringToFront();

            var recentPanel = Ui.Card();
            recentPanel.Dock = DockStyle.Fill;
            recentPanel.Padding = new Padding(16);
            var recentTitle = Ui.Label("آخر المستندات", 12, true);
            recentTitle.Dock = DockStyle.Top;
            recentTitle.Height = 36;
            recentPanel.Controls.Add(recentTitle);
            var grid = Ui.Grid();
            grid.Dock = DockStyle.Fill;
            grid.ReadOnly = true;
            grid.Columns.Add("Number", "الرقم");
            grid.Columns.Add("Type", "النوع");
            grid.Columns.Add("Customer", "العميل");
            grid.Columns.Add("Date", "التاريخ");
            grid.Columns.Add("Total", "الإجمالي");
            foreach (var d in _state.Documents.OrderByDescending(x => x.UpdatedAt).Take(12))
                grid.Rows.Add(d.Number, d.Type, d.CustomerName, d.Date.ToString("yyyy-MM-dd"), d.GrandTotal.ToString("N2") + " " + d.Currency);
            recentPanel.Controls.Add(grid);
            grid.BringToFront();
            _content.Controls.Add(recentPanel);
            recentPanel.BringToFront();
        }

        private Control MetricCard(string title, string value, string tag)
        {
            var p = new Panel { Width = 225, Height = 112, BackColor = Color.White, Margin = new Padding(7), Padding = new Padding(16) };
            var tagLabel = new Label { Text = tag, AutoSize = true, ForeColor = Ui.Orange, Font = Ui.Font(9, FontStyle.Bold), Location = new Point(14, 12) };
            var valueLabel = new Label { Text = value, AutoSize = true, ForeColor = Ui.Navy, Font = Ui.Font(24, FontStyle.Bold), Location = new Point(14, 36) };
            var titleLabel = new Label { Text = title, AutoSize = true, ForeColor = Ui.Muted, Font = Ui.Font(10), Location = new Point(14, 82) };
            p.Controls.Add(tagLabel); p.Controls.Add(valueLabel); p.Controls.Add(titleLabel);
            return p;
        }

        private DocumentModel NewDocument(string type)
        {
            return new DocumentModel
            {
                Type = type,
                Number = NextDocumentNumber(type),
                Currency = string.IsNullOrWhiteSpace(_state.Settings.DefaultCurrency) ? "USD" : _state.Settings.DefaultCurrency,
                Items = new List<LineItem> { new LineItem { Carton = "10*2" } }
            };
        }

        private string NextDocumentNumber(string type)
        {
            var prefix = type == "فاتورة" ? "INV" : "QT";
            var year = DateTime.Today.Year;
            var n = 1;
            while (_state.Documents.Any(x => string.Equals(x.Number, prefix + "-" + year + "-" + n.ToString("0000"), StringComparison.OrdinalIgnoreCase))) n++;
            return prefix + "-" + year + "-" + n.ToString("0000");
        }

        private void ShowDocuments()
        {
            ClearContent("المستندات");
            var actions = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 52, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            var newQ = Ui.ActionButton("عرض سعر جديد", true); newQ.Click += (s, e) => ShowDocumentEditor(NewDocument("عرض سعر"));
            var newI = Ui.ActionButton("فاتورة جديدة"); newI.Click += (s, e) => ShowDocumentEditor(NewDocument("فاتورة"));
            actions.Controls.Add(newQ); actions.Controls.Add(newI);
            _content.Controls.Add(actions);

            var grid = Ui.Grid();
            grid.ReadOnly = true;
            grid.Columns.Add("Id", "Id"); grid.Columns[0].Visible = false;
            grid.Columns.Add("Number", "رقم المستند");
            grid.Columns.Add("Type", "النوع");
            grid.Columns.Add("Customer", "العميل");
            grid.Columns.Add("Date", "التاريخ");
            grid.Columns.Add("Total", "الإجمالي");
            grid.Columns.Add("Currency", "العملة");
            FillDocumentsGrid(grid);
            grid.CellDoubleClick += (s, e) =>
            {
                if (e.RowIndex < 0) return;
                var id = grid.Rows[e.RowIndex].Cells[0].Value?.ToString();
                var doc = _state.Documents.FirstOrDefault(x => x.Id == id);
                if (doc != null) ShowDocumentEditor(doc);
            };
            _content.Controls.Add(grid);

            var bottom = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 54, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            var open = Ui.ActionButton("فتح");
            var clone = Ui.ActionButton("نسخ المستند");
            var convert = Ui.ActionButton("تحويل إلى فاتورة");
            var delete = Ui.ActionButton("حذف");
            open.Click += (s, e) => WithSelectedDocument(grid, d => ShowDocumentEditor(d));
            clone.Click += (s, e) => WithSelectedDocument(grid, d =>
            {
                var c = CloneDocument(d);
                c.Id = Guid.NewGuid().ToString("N"); c.Number = NextDocumentNumber(c.Type); c.CreatedAt = c.UpdatedAt = DateTime.Now;
                _state.Documents.Add(c); SafeSave(); FillDocumentsGrid(grid); SetStatus("تم نسخ المستند");
            });
            convert.Click += (s, e) => WithSelectedDocument(grid, d =>
            {
                var c = CloneDocument(d); c.Id = Guid.NewGuid().ToString("N"); c.Type = "فاتورة"; c.Number = NextDocumentNumber("فاتورة"); c.CreatedAt = c.UpdatedAt = DateTime.Now;
                _state.Documents.Add(c); SafeSave(); ShowDocumentEditor(c);
            });
            delete.Click += (s, e) => WithSelectedDocument(grid, d =>
            {
                if (MessageBox.Show("حذف " + d.Number + "؟", "تأكيد", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes) return;
                _state.Documents.Remove(d); SafeSave(); FillDocumentsGrid(grid); SetStatus("تم الحذف");
            });
            bottom.Controls.Add(open); bottom.Controls.Add(clone); bottom.Controls.Add(convert); bottom.Controls.Add(delete);
            _content.Controls.Add(bottom);
            grid.BringToFront(); actions.BringToFront(); bottom.BringToFront();
        }

        private void FillDocumentsGrid(DataGridView grid)
        {
            grid.Rows.Clear();
            foreach (var d in _state.Documents.OrderByDescending(x => x.UpdatedAt))
                grid.Rows.Add(d.Id, d.Number, d.Type, d.CustomerName, d.Date.ToString("yyyy-MM-dd"), d.GrandTotal.ToString("N2"), d.Currency);
        }

        private void WithSelectedDocument(DataGridView grid, Action<DocumentModel> action)
        {
            if (grid.CurrentRow == null) return;
            var id = grid.CurrentRow.Cells[0].Value?.ToString();
            var d = _state.Documents.FirstOrDefault(x => x.Id == id);
            if (d != null) action(d);
        }

        private static DocumentModel CloneDocument(DocumentModel d)
        {
            return new DocumentModel
            {
                Id = d.Id, Number = d.Number, Type = d.Type, Date = d.Date, ValidUntil = d.ValidUntil, Currency = d.Currency,
                CustomerId = d.CustomerId, CustomerName = d.CustomerName, CustomerPhone = d.CustomerPhone, CustomerEmail = d.CustomerEmail,
                CustomerAddress = d.CustomerAddress, Notes = d.Notes, PaymentTerms = d.PaymentTerms, QrText = d.QrText,
                GlobalDiscountPercent = d.GlobalDiscountPercent, CreatedAt = d.CreatedAt, UpdatedAt = d.UpdatedAt,
                Items = (d.Items ?? new List<LineItem>()).Select(i => new LineItem
                {
                    Name = i.Name, Quantity = i.Quantity, Carton = i.Carton, UnitPrice = i.UnitPrice,
                    DiscountPercent = i.DiscountPercent, TaxPercent = i.TaxPercent, Note = i.Note, Barcode = i.Barcode
                }).ToList()
            };
        }

        private void ShowDocumentEditor(DocumentModel document)
        {
            ClearContent(document.Type + " - " + document.Number);
            _editingDocument = document;
            _previewPageIndex = 0;
            _editingItems = new BindingList<LineItem>(document.Items ?? new List<LineItem>());

            var toolbar = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 52, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            var save = Ui.ActionButton("حفظ", true); save.Click += (s, e) => SaveCurrentDocument(true);
            var pdf = Ui.ActionButton("حفظ PDF"); pdf.Click += (s, e) => ExportPdf();
            var print = Ui.ActionButton("طباعة"); print.Click += (s, e) => PrintCurrent();
            var add = Ui.ActionButton("+ إضافة صف"); add.Click += (s, e) => { _editingItems.Add(new LineItem { Carton = "10*2" }); RefreshPreview(); };
            var remove = Ui.ActionButton("حذف الصف"); remove.Click += (s, e) => { if (_itemGrid?.CurrentRow != null && _itemGrid.CurrentRow.Index >= 0 && _itemGrid.CurrentRow.Index < _editingItems.Count) { _editingItems.RemoveAt(_itemGrid.CurrentRow.Index); RefreshPreview(); } };
            toolbar.Controls.Add(save); toolbar.Controls.Add(pdf); toolbar.Controls.Add(print); toolbar.Controls.Add(add); toolbar.Controls.Add(remove);
            _content.Controls.Add(toolbar);

            var split = new SplitContainer { Dock = DockStyle.Fill, Orientation = Orientation.Vertical, SplitterWidth = 6, BackColor = Ui.Paper };
            split.SplitterDistance = 675;
            split.Panel1.Padding = new Padding(0, 0, 10, 0);
            split.Panel2.Padding = new Padding(10, 0, 0, 0);
            _content.Controls.Add(split);
            split.BringToFront(); toolbar.BringToFront();

            BuildEditorPanel(split.Panel1, document);
            BuildPreviewPanel(split.Panel2, document);
            RefreshPreview();
        }

        private void BuildEditorPanel(Control host, DocumentModel document)
        {
            var editor = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, AutoScroll = true, Padding = new Padding(14) };
            host.Controls.Add(editor);

            var meta = new TableLayoutPanel { Dock = DockStyle.Top, Height = 174, ColumnCount = 4, RowCount = 4, Padding = new Padding(4) };
            meta.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 16)); meta.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 34));
            meta.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 16)); meta.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 34));
            for (int i = 0; i < 4; i++) meta.RowStyles.Add(new RowStyle(SizeType.Percent, 25));

            _docType = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill, Font = Ui.Font(10) };
            _docType.Items.AddRange(new object[] { "عرض سعر", "فاتورة" }); _docType.SelectedItem = document.Type;
            _docNumber = Ui.TextBox(document.Number); _docNumber.Dock = DockStyle.Fill; _docNumber.RightToLeft = RightToLeft.No;
            _docDate = new DateTimePicker { Value = document.Date, Format = DateTimePickerFormat.Custom, CustomFormat = "yyyy-MM-dd", Dock = DockStyle.Fill, Font = Ui.Font(10) };
            _validUntil = new DateTimePicker { Value = document.ValidUntil, Format = DateTimePickerFormat.Custom, CustomFormat = "yyyy-MM-dd", Dock = DockStyle.Fill, Font = Ui.Font(10) };
            _currency = Ui.TextBox(document.Currency); _currency.Dock = DockStyle.Fill; _currency.RightToLeft = RightToLeft.No;
            _globalDiscount = new NumericUpDown { Minimum = 0, Maximum = 100, DecimalPlaces = 2, Value = Clamp(document.GlobalDiscountPercent, 0, 100), Dock = DockStyle.Fill, Font = Ui.Font(10) };
            _customerPicker = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill, Font = Ui.Font(10), DisplayMember = "Company" };
            _customerPicker.Items.Add("-- اختيار عميل محفوظ --"); foreach (var c in _state.Customers) _customerPicker.Items.Add(c); _customerPicker.SelectedIndex = 0;

            AddField(meta, 0, "نوع المستند", _docType); AddField(meta, 1, "رقم المستند", _docNumber);
            AddField(meta, 2, "التاريخ", _docDate); AddField(meta, 3, "صالح حتى", _validUntil);
            AddField(meta, 4, "العملة", _currency); AddField(meta, 5, "خصم عام %", _globalDiscount);
            AddField(meta, 6, "عميل محفوظ", _customerPicker);
            editor.Controls.Add(meta);

            var customer = new TableLayoutPanel { Dock = DockStyle.Top, Height = 124, ColumnCount = 4, RowCount = 2, Padding = new Padding(4) };
            customer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 16)); customer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 34));
            customer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 16)); customer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 34));
            _customerName = Ui.TextBox(document.CustomerName); _customerName.Dock = DockStyle.Fill;
            _customerPhone = Ui.TextBox(document.CustomerPhone); _customerPhone.Dock = DockStyle.Fill; _customerPhone.RightToLeft = RightToLeft.No;
            _customerEmail = Ui.TextBox(document.CustomerEmail); _customerEmail.Dock = DockStyle.Fill; _customerEmail.RightToLeft = RightToLeft.No;
            _customerAddress = Ui.TextBox(document.CustomerAddress); _customerAddress.Dock = DockStyle.Fill;
            AddField(customer, 0, "اسم العميل", _customerName); AddField(customer, 1, "الهاتف", _customerPhone);
            AddField(customer, 2, "البريد", _customerEmail); AddField(customer, 3, "العنوان", _customerAddress);
            editor.Controls.Add(customer);

            var productStrip = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 44, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 3, 0, 3) };
            var savedProducts = new ComboBox { Width = 260, DropDownStyle = ComboBoxStyle.DropDownList, Font = Ui.Font(10) };
            savedProducts.Items.Add("-- إضافة منتج محفوظ --"); foreach (var p in _state.Products) savedProducts.Items.Add(p); savedProducts.SelectedIndex = 0;
            var addSaved = Ui.ActionButton("إضافة المنتج"); addSaved.Width = 110;
            addSaved.Click += (s, e) =>
            {
                var p = savedProducts.SelectedItem as Product;
                if (p == null) return;
                _editingItems.Add(new LineItem { Name = p.Name, UnitPrice = p.DefaultPrice, Carton = p.CartonFormat, Barcode = p.Barcode, Note = p.Note, Quantity = 1 });
                RefreshPreview();
            };
            productStrip.Controls.Add(savedProducts); productStrip.Controls.Add(addSaved);
            editor.Controls.Add(productStrip);

            _itemGrid = Ui.Grid();
            _itemGrid.Dock = DockStyle.Top;
            _itemGrid.Height = 270;
            _itemGrid.AutoGenerateColumns = false;
            _itemGrid.DataSource = _editingItems;
            AddItemColumn("Name", "الصنف", 170);
            AddItemColumn("Quantity", "الكمية", 70, "0.##");
            AddItemColumn("Carton", "الكرتون (مثال 10*2)", 120);
            AddItemColumn("UnitPrice", "سعر الوحدة", 90, "N2");
            AddItemColumn("DiscountPercent", "خصم %", 70, "0.##");
            AddItemColumn("TaxPercent", "ضريبة %", 70, "0.##");
            AddItemColumn("Total", "الإجمالي", 95, "N2", true);
            AddItemColumn("Note", "ملاحظة", 140);
            _itemGrid.CellEndEdit += (s, e) => { _itemGrid.Refresh(); RefreshPreview(); };
            _itemGrid.DataError += (s, e) => { e.ThrowException = false; };
            editor.Controls.Add(_itemGrid);

            var notesTable = new TableLayoutPanel { Dock = DockStyle.Top, Height = 122, ColumnCount = 2, RowCount = 2, Padding = new Padding(4) };
            notesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 22)); notesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 78));
            _notes = new TextBox { Text = document.Notes, Multiline = true, Dock = DockStyle.Fill, Font = Ui.Font(9.5f), RightToLeft = RightToLeft.Yes, ScrollBars = ScrollBars.Vertical };
            _qrText = Ui.TextBox(document.QrText); _qrText.Dock = DockStyle.Fill;
            notesTable.Controls.Add(Ui.Label("ملاحظات"), 0, 0); notesTable.Controls.Add(_notes, 1, 0);
            notesTable.Controls.Add(Ui.Label("نص QR (اختياري)"), 0, 1); notesTable.Controls.Add(_qrText, 1, 1);
            editor.Controls.Add(notesTable);

            // Preserve visual order for Dock.Top controls.
            notesTable.BringToFront(); _itemGrid.BringToFront(); productStrip.BringToFront(); customer.BringToFront(); meta.BringToFront();

            EventHandler changed = (s, e) => RefreshPreview();
            _docType.SelectedIndexChanged += changed; _docNumber.TextChanged += changed; _docDate.ValueChanged += changed; _validUntil.ValueChanged += changed;
            _currency.TextChanged += changed; _globalDiscount.ValueChanged += changed; _customerName.TextChanged += changed; _customerPhone.TextChanged += changed;
            _customerEmail.TextChanged += changed; _customerAddress.TextChanged += changed; _notes.TextChanged += changed; _qrText.TextChanged += changed;
            _customerPicker.SelectedIndexChanged += (s, e) =>
            {
                var c = _customerPicker.SelectedItem as Customer;
                if (c == null) return;
                _customerName.Text = string.IsNullOrWhiteSpace(c.Company) ? c.Name : c.Company;
                _customerPhone.Text = c.Phone; _customerEmail.Text = c.Email; _customerAddress.Text = c.Address;
            };
        }

        private void AddField(TableLayoutPanel table, int index, string label, Control control)
        {
            int row = index / 2; int pair = index % 2; int col = pair * 2;
            var l = Ui.Label(label, 9, true); l.Dock = DockStyle.Fill; l.TextAlign = ContentAlignment.MiddleRight;
            control.Margin = new Padding(4); control.Dock = DockStyle.Fill;
            table.Controls.Add(l, col, row); table.Controls.Add(control, col + 1, row);
        }

        private void AddItemColumn(string property, string header, int width, string format = null, bool readOnly = false)
        {
            var c = new DataGridViewTextBoxColumn { DataPropertyName = property, HeaderText = header, Name = property, MinimumWidth = 55, FillWeight = width, ReadOnly = readOnly };
            if (!string.IsNullOrEmpty(format)) c.DefaultCellStyle.Format = format;
            if (property == "Carton") c.DefaultCellStyle.NullValue = "10*2";
            _itemGrid.Columns.Add(c);
        }

        private void BuildPreviewPanel(Control host, DocumentModel document)
        {
            var wrap = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(8) };
            host.Controls.Add(wrap);
            var controls = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 46, FlowDirection = FlowDirection.LeftToRight, WrapContents = false, Padding = new Padding(8, 4, 8, 4) };
            var prev = Ui.ActionButton("السابق"); prev.Width = 82;
            var next = Ui.ActionButton("التالي"); next.Width = 82;
            _previewPageLabel = new Label { Width = 120, Height = 36, TextAlign = ContentAlignment.MiddleCenter, Font = Ui.Font(9, FontStyle.Bold), ForeColor = Ui.Navy };
            prev.Click += (s, e) => { if (_previewPageIndex > 0) { _previewPageIndex--; RefreshPreview(); } };
            next.Click += (s, e) => { CommitEditor(false); if (_previewPageIndex + 1 < DocumentRenderer.GetPageCount(_editingDocument)) { _previewPageIndex++; RefreshPreview(); } };
            controls.Controls.Add(prev); controls.Controls.Add(_previewPageLabel); controls.Controls.Add(next);
            wrap.Controls.Add(controls);
            _preview = new DocumentPreviewPanel { Dock = DockStyle.Fill, Document = document, Settings = _state.Settings };
            wrap.Controls.Add(_preview); _preview.BringToFront(); controls.BringToFront();
        }

        private void CommitEditor(bool generateNumberIfNeeded)
        {
            if (_editingDocument == null || _docType == null) return;
            _itemGrid?.EndEdit();
            _editingDocument.Type = _docType.SelectedItem?.ToString() ?? "عرض سعر";
            _editingDocument.Number = (_docNumber.Text ?? "").Trim();
            if (generateNumberIfNeeded && string.IsNullOrWhiteSpace(_editingDocument.Number)) _editingDocument.Number = NextDocumentNumber(_editingDocument.Type);
            _editingDocument.Date = _docDate.Value.Date;
            _editingDocument.ValidUntil = _validUntil.Value.Date;
            _editingDocument.Currency = string.IsNullOrWhiteSpace(_currency.Text) ? "USD" : _currency.Text.Trim();
            _editingDocument.CustomerName = _customerName.Text.Trim();
            _editingDocument.CustomerPhone = _customerPhone.Text.Trim();
            _editingDocument.CustomerEmail = _customerEmail.Text.Trim();
            _editingDocument.CustomerAddress = _customerAddress.Text.Trim();
            _editingDocument.GlobalDiscountPercent = _globalDiscount.Value;
            _editingDocument.Notes = _notes.Text;
            _editingDocument.QrText = _qrText.Text.Trim();
            _editingDocument.Items = _editingItems.ToList();
            _editingDocument.UpdatedAt = DateTime.Now;
        }

        private void RefreshPreview()
        {
            if (_editingDocument == null || _preview == null) return;
            CommitEditor(false);
            var pageCount = DocumentRenderer.GetPageCount(_editingDocument);
            if (_previewPageIndex >= pageCount) _previewPageIndex = pageCount - 1;
            _preview.PageIndex = Math.Max(0, _previewPageIndex);
            _preview.Document = _editingDocument;
            _preview.Settings = _state.Settings;
            _previewPageLabel.Text = "صفحة " + (_preview.PageIndex + 1) + " / " + pageCount;
            _preview.Invalidate();
        }

        private void SaveCurrentDocument(bool showMessage)
        {
            if (_editingDocument == null) return;
            CommitEditor(true);
            if (!_state.Documents.Any(x => x.Id == _editingDocument.Id)) _state.Documents.Add(_editingDocument);
            SafeSave();
            _pageTitle.Text = _editingDocument.Type + " - " + _editingDocument.Number;
            if (showMessage) SetStatus("تم حفظ " + _editingDocument.Number);
            RefreshPreview();
        }

        private void ExportPdf()
        {
            if (_editingDocument == null) return;
            SaveCurrentDocument(false);
            var pdfPrinter = PrinterSettings.InstalledPrinters.Cast<string>().FirstOrDefault(x => x.Equals("Microsoft Print to PDF", StringComparison.OrdinalIgnoreCase));
            if (pdfPrinter == null)
            {
                MessageBox.Show("ميزة Microsoft Print to PDF غير مفعلة في Windows. يمكنك استخدام زر الطباعة واختيار أي طابعة PDF مثبتة.", "PDF", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            using (var dlg = new SaveFileDialog { Filter = "PDF (*.pdf)|*.pdf", FileName = SafeFileName(_editingDocument.Number) + ".pdf" })
            {
                if (dlg.ShowDialog(this) != DialogResult.OK) return;
                try
                {
                    var session = new DocumentPrintSession(_editingDocument, _state.Settings);
                    session.PrintDocument.PrinterSettings.PrinterName = pdfPrinter;
                    session.PrintDocument.PrinterSettings.PrintToFile = true;
                    session.PrintDocument.PrinterSettings.PrintFileName = dlg.FileName;
                    session.PrintDocument.PrintController = new StandardPrintController();
                    session.PrintDocument.Print();
                    SetStatus("تم إنشاء PDF: " + dlg.FileName);
                }
                catch (Exception ex) { MessageBox.Show("تعذر إنشاء PDF:\r\n" + ex.Message, "PDF", MessageBoxButtons.OK, MessageBoxIcon.Error); }
            }
        }

        private void PrintCurrent()
        {
            if (_editingDocument == null) return;
            SaveCurrentDocument(false);
            var session = new DocumentPrintSession(_editingDocument, _state.Settings);
            using (var dlg = new PrintDialog { Document = session.PrintDocument, UseEXDialog = true })
                if (dlg.ShowDialog(this) == DialogResult.OK)
                    try { session.PrintDocument.Print(); } catch (Exception ex) { MessageBox.Show(ex.Message, "الطباعة", MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        private void ShowCustomers()
        {
            ClearContent("العملاء");
            var actions = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 52, FlowDirection = FlowDirection.RightToLeft };
            var add = Ui.ActionButton("+ عميل جديد", true); var edit = Ui.ActionButton("تعديل"); var del = Ui.ActionButton("حذف");
            actions.Controls.Add(add); actions.Controls.Add(edit); actions.Controls.Add(del); _content.Controls.Add(actions);
            var grid = Ui.Grid(); grid.ReadOnly = true;
            grid.Columns.Add("Id", "Id"); grid.Columns[0].Visible = false; grid.Columns.Add("Name", "الاسم"); grid.Columns.Add("Company", "الشركة"); grid.Columns.Add("Phone", "الهاتف"); grid.Columns.Add("Email", "البريد"); grid.Columns.Add("Address", "العنوان");
            Action reload = () => { grid.Rows.Clear(); foreach (var c in _state.Customers.OrderBy(x => x.Company).ThenBy(x => x.Name)) grid.Rows.Add(c.Id, c.Name, c.Company, c.Phone, c.Email, c.Address); };
            reload(); _content.Controls.Add(grid); grid.BringToFront(); actions.BringToFront();
            add.Click += (s, e) => { var c = new Customer(); if (EditCustomer(c)) { _state.Customers.Add(c); SafeSave(); reload(); } };
            edit.Click += (s, e) => { var c = SelectedCustomer(grid); if (c != null && EditCustomer(c)) { SafeSave(); reload(); } };
            del.Click += (s, e) => { var c = SelectedCustomer(grid); if (c != null && MessageBox.Show("حذف العميل؟", "تأكيد", MessageBoxButtons.YesNo) == DialogResult.Yes) { _state.Customers.Remove(c); SafeSave(); reload(); } };
            grid.CellDoubleClick += (s, e) => { if (e.RowIndex >= 0) { var c = SelectedCustomer(grid); if (c != null && EditCustomer(c)) { SafeSave(); reload(); } } };
        }

        private Customer SelectedCustomer(DataGridView grid)
        {
            if (grid.CurrentRow == null) return null; var id = grid.CurrentRow.Cells[0].Value?.ToString(); return _state.Customers.FirstOrDefault(x => x.Id == id);
        }

        private bool EditCustomer(Customer c)
        {
            using (var f = NewEditorDialog("بيانات العميل", 500, 440))
            {
                var table = DialogTable(); f.Controls.Add(table);
                var name = Ui.TextBox(c.Name); var company = Ui.TextBox(c.Company); var phone = Ui.TextBox(c.Phone); phone.RightToLeft = RightToLeft.No;
                var email = Ui.TextBox(c.Email); email.RightToLeft = RightToLeft.No; var address = Ui.TextBox(c.Address); address.Multiline = true; address.Height = 70;
                DialogRow(table, 0, "الاسم", name); DialogRow(table, 1, "الشركة", company); DialogRow(table, 2, "الهاتف", phone); DialogRow(table, 3, "البريد", email); DialogRow(table, 4, "العنوان", address);
                AddDialogButtons(f, () => { c.Name = name.Text.Trim(); c.Company = company.Text.Trim(); c.Phone = phone.Text.Trim(); c.Email = email.Text.Trim(); c.Address = address.Text.Trim(); });
                return f.ShowDialog(this) == DialogResult.OK;
            }
        }

        private void ShowProducts()
        {
            ClearContent("المنتجات");
            var actions = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 52, FlowDirection = FlowDirection.RightToLeft };
            var add = Ui.ActionButton("+ منتج جديد", true); var edit = Ui.ActionButton("تعديل"); var del = Ui.ActionButton("حذف");
            actions.Controls.Add(add); actions.Controls.Add(edit); actions.Controls.Add(del); _content.Controls.Add(actions);
            var grid = Ui.Grid(); grid.ReadOnly = true;
            grid.Columns.Add("Id", "Id"); grid.Columns[0].Visible = false; grid.Columns.Add("Name", "اسم المنتج"); grid.Columns.Add("Price", "السعر"); grid.Columns.Add("Carton", "الكرتون"); grid.Columns.Add("Barcode", "الباركود"); grid.Columns.Add("Note", "ملاحظات");
            Action reload = () => { grid.Rows.Clear(); foreach (var p in _state.Products.OrderBy(x => x.Name)) grid.Rows.Add(p.Id, p.Name, p.DefaultPrice.ToString("N2"), p.CartonFormat, p.Barcode, p.Note); };
            reload(); _content.Controls.Add(grid); grid.BringToFront(); actions.BringToFront();
            add.Click += (s, e) => { var p = new Product(); if (EditProduct(p)) { _state.Products.Add(p); SafeSave(); reload(); } };
            edit.Click += (s, e) => { var p = SelectedProduct(grid); if (p != null && EditProduct(p)) { SafeSave(); reload(); } };
            del.Click += (s, e) => { var p = SelectedProduct(grid); if (p != null && MessageBox.Show("حذف المنتج؟", "تأكيد", MessageBoxButtons.YesNo) == DialogResult.Yes) { _state.Products.Remove(p); SafeSave(); reload(); } };
            grid.CellDoubleClick += (s, e) => { if (e.RowIndex >= 0) { var p = SelectedProduct(grid); if (p != null && EditProduct(p)) { SafeSave(); reload(); } } };
        }

        private Product SelectedProduct(DataGridView grid)
        {
            if (grid.CurrentRow == null) return null; var id = grid.CurrentRow.Cells[0].Value?.ToString(); return _state.Products.FirstOrDefault(x => x.Id == id);
        }

        private bool EditProduct(Product p)
        {
            using (var f = NewEditorDialog("بيانات المنتج", 500, 430))
            {
                var table = DialogTable(); f.Controls.Add(table);
                var name = Ui.TextBox(p.Name); var price = Ui.TextBox(p.DefaultPrice.ToString("0.##")); price.RightToLeft = RightToLeft.No;
                var carton = Ui.TextBox(string.IsNullOrWhiteSpace(p.CartonFormat) ? "10*2" : p.CartonFormat); carton.RightToLeft = RightToLeft.No;
                var barcode = Ui.TextBox(p.Barcode); barcode.RightToLeft = RightToLeft.No; var note = Ui.TextBox(p.Note);
                DialogRow(table, 0, "اسم المنتج", name); DialogRow(table, 1, "السعر", price); DialogRow(table, 2, "الكرتون", carton); DialogRow(table, 3, "الباركود", barcode); DialogRow(table, 4, "ملاحظات", note);
                var hint = new Label { Text = "حقل الكرتون يقبل صيغة مثل 10*2 أو 12*6 أو 24*1 كما هي.", Dock = DockStyle.Bottom, Height = 30, ForeColor = Ui.Orange, Font = Ui.Font(9, FontStyle.Bold), TextAlign = ContentAlignment.MiddleCenter };
                f.Controls.Add(hint); hint.BringToFront();
                AddDialogButtons(f, () => { decimal.TryParse(price.Text, out var v); p.Name = name.Text.Trim(); p.DefaultPrice = v; p.CartonFormat = carton.Text.Trim(); p.Barcode = barcode.Text.Trim(); p.Note = note.Text.Trim(); });
                return f.ShowDialog(this) == DialogResult.OK;
            }
        }

        private Form NewEditorDialog(string title, int width, int height)
        {
            return new Form { Text = title, Width = width, Height = height, StartPosition = FormStartPosition.CenterParent, Font = Ui.Font(), RightToLeft = RightToLeft.Yes, RightToLeftLayout = true, BackColor = Color.White, MinimizeBox = false, MaximizeBox = false };
        }

        private TableLayoutPanel DialogTable()
        {
            var t = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 6, Padding = new Padding(18, 18, 18, 68) };
            t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 28)); t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 72));
            for (int i = 0; i < 6; i++) t.RowStyles.Add(new RowStyle(SizeType.Absolute, 50));
            return t;
        }

        private void DialogRow(TableLayoutPanel t, int row, string label, Control field)
        {
            var l = Ui.Label(label, 9, true); l.Dock = DockStyle.Fill; l.TextAlign = ContentAlignment.MiddleRight; field.Dock = DockStyle.Fill; field.Margin = new Padding(3, 7, 3, 7);
            t.Controls.Add(l, 0, row); t.Controls.Add(field, 1, row);
        }

        private void AddDialogButtons(Form f, Action beforeOk)
        {
            var bar = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 58, FlowDirection = FlowDirection.LeftToRight, Padding = new Padding(14, 8, 14, 8) };
            var ok = Ui.ActionButton("حفظ", true); var cancel = Ui.ActionButton("إلغاء");
            ok.DialogResult = DialogResult.OK; cancel.DialogResult = DialogResult.Cancel;
            ok.Click += (s, e) => beforeOk(); bar.Controls.Add(ok); bar.Controls.Add(cancel); f.Controls.Add(bar); bar.BringToFront(); f.AcceptButton = ok; f.CancelButton = cancel;
        }

        private void ShowSettings()
        {
            ClearContent("الإعدادات والنسخ");
            var scroll = new Panel { Dock = DockStyle.Fill, AutoScroll = true, BackColor = Color.White, Padding = new Padding(22) };
            _content.Controls.Add(scroll);
            var table = new TableLayoutPanel { Dock = DockStyle.Top, Height = 420, ColumnCount = 2, RowCount = 10, Padding = new Padding(10) };
            table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 24)); table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 76));
            var s = _state.Settings;
            var company = Ui.TextBox(s.CompanyName); var address1 = Ui.TextBox(s.Address1); var address2 = Ui.TextBox(s.Address2); var phone = Ui.TextBox(s.Phone); phone.RightToLeft = RightToLeft.No;
            var email = Ui.TextBox(s.Email); email.RightToLeft = RightToLeft.No; var website = Ui.TextBox(s.Website); website.RightToLeft = RightToLeft.No; var tax = Ui.TextBox(s.TaxNumber); var currency = Ui.TextBox(s.DefaultCurrency); currency.RightToLeft = RightToLeft.No;
            var primary = Ui.TextBox(s.PrimaryColorHex); primary.RightToLeft = RightToLeft.No; var accent = Ui.TextBox(s.AccentColorHex); accent.RightToLeft = RightToLeft.No;
            DialogRow(table, 0, "اسم الشركة", company); DialogRow(table, 1, "العنوان 1", address1); DialogRow(table, 2, "العنوان 2", address2); DialogRow(table, 3, "الهاتف", phone); DialogRow(table, 4, "البريد", email); DialogRow(table, 5, "الموقع", website); DialogRow(table, 6, "الرقم الضريبي", tax); DialogRow(table, 7, "العملة الافتراضية", currency); DialogRow(table, 8, "اللون الرئيسي", primary); DialogRow(table, 9, "لون التمييز", accent);
            scroll.Controls.Add(table);

            var tools = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 110, FlowDirection = FlowDirection.RightToLeft, WrapContents = true, Padding = new Padding(8) };
            var save = Ui.ActionButton("حفظ الإعدادات", true);
            var logo = Ui.ActionButton("اختيار الشعار");
            var backup = Ui.ActionButton("نسخة احتياطية");
            var restore = Ui.ActionButton("استعادة نسخة");
            var productsCsv = Ui.ActionButton("تصدير المنتجات CSV"); productsCsv.Width = 160;
            var customersCsv = Ui.ActionButton("تصدير العملاء CSV"); customersCsv.Width = 160;
            var folder = Ui.ActionButton("فتح مجلد البيانات"); folder.Width = 150;
            tools.Controls.Add(save); tools.Controls.Add(logo); tools.Controls.Add(backup); tools.Controls.Add(restore); tools.Controls.Add(productsCsv); tools.Controls.Add(customersCsv); tools.Controls.Add(folder);
            scroll.Controls.Add(tools); tools.BringToFront(); table.BringToFront();

            save.Click += (o, e) =>
            {
                s.CompanyName = company.Text.Trim(); s.Address1 = address1.Text.Trim(); s.Address2 = address2.Text.Trim(); s.Phone = phone.Text.Trim(); s.Email = email.Text.Trim(); s.Website = website.Text.Trim(); s.TaxNumber = tax.Text.Trim(); s.DefaultCurrency = currency.Text.Trim(); s.PrimaryColorHex = primary.Text.Trim(); s.AccentColorHex = accent.Text.Trim(); SafeSave(); SetStatus("تم حفظ الإعدادات");
            };
            logo.Click += (o, e) => { using (var d = new OpenFileDialog { Filter = "صور|*.png;*.jpg;*.jpeg;*.bmp" }) if (d.ShowDialog(this) == DialogResult.OK) { s.LogoPath = d.FileName; SafeSave(); SetStatus("تم اختيار الشعار"); } };
            backup.Click += (o, e) => { using (var d = new SaveFileDialog { Filter = "Quotation Studio Backup|*.qsbak", FileName = "QuotationStudio-" + DateTime.Now.ToString("yyyyMMdd-HHmm") + ".qsbak" }) if (d.ShowDialog(this) == DialogResult.OK) { _storage.Backup(d.FileName, _state); SetStatus("تم إنشاء النسخة الاحتياطية"); } };
            restore.Click += (o, e) => { using (var d = new OpenFileDialog { Filter = "Quotation Studio Backup|*.qsbak;*.xml|All files|*.*" }) if (d.ShowDialog(this) == DialogResult.OK && MessageBox.Show("سيتم استبدال البيانات الحالية. متابعة؟", "استعادة", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes) { _state = _storage.Restore(d.FileName); ShowDashboard(); SetStatus("تمت الاستعادة"); } };
            productsCsv.Click += (o, e) => { using (var d = new SaveFileDialog { Filter = "CSV|*.csv", FileName = "products.csv" }) if (d.ShowDialog(this) == DialogResult.OK) _storage.ExportProductsCsv(d.FileName, _state); };
            customersCsv.Click += (o, e) => { using (var d = new SaveFileDialog { Filter = "CSV|*.csv", FileName = "customers.csv" }) if (d.ShowDialog(this) == DialogResult.OK) _storage.ExportCustomersCsv(d.FileName, _state); };
            folder.Click += (o, e) => System.Diagnostics.Process.Start("explorer.exe", _storage.DataFolder);
        }

        private static decimal Clamp(decimal value, decimal min, decimal max) => value < min ? min : (value > max ? max : value);

        private void SafeSave()
        {
            try { _storage.Save(_state); }
            catch (Exception ex) { MessageBox.Show("تعذر حفظ البيانات:\r\n" + ex.Message, "الحفظ", MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        private void SetStatus(string text) { _status.Text = text; }

        private static string SafeFileName(string value)
        {
            var s = string.IsNullOrWhiteSpace(value) ? "document" : value;
            foreach (var c in Path.GetInvalidFileNameChars()) s = s.Replace(c, '-');
            return s;
        }
    }
}
