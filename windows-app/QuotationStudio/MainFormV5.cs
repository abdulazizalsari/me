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
    public sealed class MainFormV5 : Form
    {
        private readonly StorageService _storage = new StorageService();
        private AppState _state;
        private readonly Panel _content = new Panel();
        private readonly Label _title = new Label();
        private readonly Label _status = new Label();
        private readonly System.Windows.Forms.Timer _autoSave = new System.Windows.Forms.Timer { Interval = 1200 };

        private DocumentModel _doc;
        private BindingList<LineItem> _items;
        private bool _dirty;
        private int _pageIndex;

        private ComboBox _type;
        private ComboBox _customerPick;
        private TextBox _number;
        private DateTimePicker _date;
        private DateTimePicker _valid;
        private TextBox _currency;
        private NumericUpDown _globalDiscount;
        private TextBox _customerName;
        private TextBox _customerPhone;
        private TextBox _customerEmail;
        private TextBox _customerAddress;
        private TextBox _notes;
        private TextBox _terms;
        private TextBox _qr;
        private DataGridView _grid;
        private DocumentPreviewPanel _preview;
        private Label _pageInfo;
        private Label _totals;
        private Label _validation;

        public MainFormV5()
        {
            _state = _storage.Load();
            Text = "Quotation Studio 3.1";
            Width = 1440;
            Height = 920;
            MinimumSize = new Size(1140, 720);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Ui.Paper;
            Font = Ui.Font();
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;
            KeyPreview = true;

            BuildShell();
            ShowDashboard();

            _autoSave.Tick += delegate
            {
                _autoSave.Stop();
                if (_dirty) SaveCurrent(false);
            };
            FormClosing += delegate { SaveCurrent(false); SaveState(); };
            KeyDown += OnShortcut;
            Shown += delegate
            {
                if (NeedsCompanySetup()) ShowFirstRunSetup();
            };
        }

        private void BuildShell()
        {
            Panel side = new Panel { Dock = DockStyle.Right, Width = 225, BackColor = Ui.Teal, Padding = new Padding(0, 14, 0, 0) };
            Label brand = new Label
            {
                Text = "QUOTATION\nSTUDIO",
                Dock = DockStyle.Top,
                Height = 82,
                ForeColor = Color.White,
                Font = Ui.Font(16, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter
            };
            FlowLayoutPanel nav = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.TopDown,
                WrapContents = false,
                BackColor = Ui.Teal,
                Padding = new Padding(0, 8, 0, 0)
            };
            side.Controls.Add(brand);
            side.Controls.Add(nav);
            nav.BringToFront();

            Nav(nav, "الرئيسية", ShowDashboard);
            Nav(nav, "عرض سعر جديد", delegate { ShowEditor(NewDocument("عرض سعر")); });
            Nav(nav, "فاتورة جديدة", delegate { ShowEditor(NewDocument("فاتورة")); });
            Nav(nav, "المستندات", ShowDocuments);
            Nav(nav, "العملاء", ShowCustomers);
            Nav(nav, "المنتجات", ShowProducts);
            Nav(nav, "الإعدادات والنسخ", ShowSettings);

            Panel header = new Panel { Dock = DockStyle.Top, Height = 68, BackColor = Color.White, Padding = new Padding(22, 10, 22, 10) };
            _title.Dock = DockStyle.Right;
            _title.Width = 520;
            _title.Font = Ui.Font(17, FontStyle.Bold);
            _title.ForeColor = Ui.Navy;
            _title.TextAlign = ContentAlignment.MiddleRight;
            Button quick = Ui.ActionButton("+ مستند جديد", true);
            quick.Dock = DockStyle.Left;
            quick.Width = 140;
            quick.Click += delegate { Navigate(delegate { ShowEditor(NewDocument("عرض سعر")); }); };
            header.Controls.Add(_title);
            header.Controls.Add(quick);

            _status.Dock = DockStyle.Bottom;
            _status.Height = 30;
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
            Controls.Add(side);
        }

        private void Nav(FlowLayoutPanel nav, string text, Action action)
        {
            Button button = Ui.NavButton(text);
            button.Width = 225;
            button.Margin = new Padding(0);
            button.Click += delegate { Navigate(action); };
            nav.Controls.Add(button);
        }

        private void Navigate(Action action)
        {
            SaveCurrent(false);
            action();
        }

        private void ClearView(string title)
        {
            _autoSave.Stop();
            _title.Text = title;
            foreach (Control control in _content.Controls) control.Dispose();
            _content.Controls.Clear();
            _doc = null;
            _items = null;
            _grid = null;
            _preview = null;
            _validation = null;
            _dirty = false;
        }

        private void OnShortcut(object sender, KeyEventArgs e)
        {
            if (e.Control && e.KeyCode == Keys.S) { SaveCurrent(true); e.SuppressKeyPress = true; }
            if (e.Control && e.KeyCode == Keys.P) { PrintCurrent(); e.SuppressKeyPress = true; }
            if (e.Control && e.KeyCode == Keys.N) { Navigate(delegate { ShowEditor(NewDocument("عرض سعر")); }); e.SuppressKeyPress = true; }
        }

        private bool NeedsCompanySetup()
        {
            return _state.Settings == null || string.IsNullOrWhiteSpace(_state.Settings.CompanyName) || _state.Settings.CompanyName.Trim() == "اسم الشركة";
        }

        private void ShowFirstRunSetup()
        {
            using Form form = Dialog("إعداد الشركة - أول تشغيل", 560, 340);
            TableLayoutPanel table = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 4, Padding = new Padding(22, 26, 22, 76) };
            table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 28));
            table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 72));
            for (int i = 0; i < 4; i++) table.RowStyles.Add(new RowStyle(SizeType.Absolute, 52));
            TextBox company = Ui.TextBox(NeedsCompanySetup() ? "" : _state.Settings.CompanyName);
            TextBox phone = Ui.TextBox(_state.Settings.Phone); phone.RightToLeft = RightToLeft.No;
            TextBox email = Ui.TextBox(_state.Settings.Email); email.RightToLeft = RightToLeft.No;
            TextBox currency = Ui.TextBox(_state.Settings.DefaultCurrency); currency.RightToLeft = RightToLeft.No;
            DialogRow(table, 0, "اسم الشركة *", company);
            DialogRow(table, 1, "الهاتف", phone);
            DialogRow(table, 2, "البريد", email);
            DialogRow(table, 3, "العملة الافتراضية", currency);
            form.Controls.Add(table);

            FlowLayoutPanel buttons = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 62, FlowDirection = FlowDirection.LeftToRight, Padding = new Padding(16, 9, 16, 9) };
            Button save = Ui.ActionButton("حفظ وبدء العمل", true); save.Width = 150;
            Button later = Ui.ActionButton("لاحقاً");
            buttons.Controls.Add(save); buttons.Controls.Add(later); form.Controls.Add(buttons); buttons.BringToFront();
            save.Click += delegate
            {
                if (string.IsNullOrWhiteSpace(company.Text))
                {
                    MessageBox.Show("اسم الشركة مطلوب لإصدار PDF والطباعة.", "بيانات الشركة", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
                _state.Settings.CompanyName = company.Text.Trim();
                _state.Settings.Phone = phone.Text.Trim();
                _state.Settings.Email = email.Text.Trim();
                _state.Settings.DefaultCurrency = string.IsNullOrWhiteSpace(currency.Text) ? "USD" : currency.Text.Trim();
                SaveState();
                form.DialogResult = DialogResult.OK;
                form.Close();
            };
            later.Click += delegate { form.DialogResult = DialogResult.Cancel; form.Close(); };
            form.ShowDialog(this);
        }

        private void ShowDashboard()
        {
            ClearView("الرئيسية");
            FlowLayoutPanel cards = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 145, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            cards.Controls.Add(Metric("عروض الأسعار", _state.Documents.Count(x => x.Type == "عرض سعر").ToString(), "QT"));
            cards.Controls.Add(Metric("الفواتير", _state.Documents.Count(x => x.Type == "فاتورة").ToString(), "INV"));
            cards.Controls.Add(Metric("العملاء", _state.Customers.Count.ToString(), "CRM"));
            cards.Controls.Add(Metric("المنتجات", _state.Products.Count.ToString(), "SKU"));
            _content.Controls.Add(cards);

            Panel recent = Ui.Card(); recent.Dock = DockStyle.Fill; recent.Padding = new Padding(14);
            Label heading = Ui.Label("آخر المستندات", 12, true); heading.Dock = DockStyle.Top; heading.Height = 34;
            DataGridView grid = DocumentGrid(); grid.ReadOnly = true; grid.Dock = DockStyle.Fill;
            foreach (DocumentModel d in _state.Documents.OrderByDescending(x => x.UpdatedAt).Take(20))
                grid.Rows.Add(d.Id, d.Number, d.Type, d.CustomerName, d.Date.ToString("yyyy-MM-dd"), d.GrandTotal.ToString("N2"), d.Currency);
            recent.Controls.Add(heading); recent.Controls.Add(grid); grid.BringToFront();
            _content.Controls.Add(recent); recent.BringToFront(); cards.BringToFront();
        }

        private Control Metric(string name, string value, string tag)
        {
            Panel panel = Ui.Card(); panel.Width = 235; panel.Height = 112; panel.Margin = new Padding(7);
            panel.Controls.Add(new Label { Text = tag, AutoSize = true, ForeColor = Ui.Orange, Font = Ui.Font(9, FontStyle.Bold), Location = new Point(14, 12) });
            panel.Controls.Add(new Label { Text = value, AutoSize = true, ForeColor = Ui.Navy, Font = Ui.Font(24, FontStyle.Bold), Location = new Point(14, 36) });
            panel.Controls.Add(new Label { Text = name, AutoSize = true, ForeColor = Ui.Muted, Location = new Point(14, 84) });
            return panel;
        }

        private DocumentModel NewDocument(string type)
        {
            DocumentModel document = new DocumentModel
            {
                Type = type,
                Number = NextNumber(type, null),
                Currency = string.IsNullOrWhiteSpace(_state.Settings.DefaultCurrency) ? "USD" : _state.Settings.DefaultCurrency
            };
            document.Items.Add(new LineItem { Carton = "10*2" });
            return document;
        }

        private string NextNumber(string type, string ignoreId)
        {
            string prefix = type == "فاتورة" ? "INV" : "QT";
            int year = DateTime.Today.Year;
            int number = 1;
            while (_state.Documents.Any(x => x.Id != ignoreId && string.Equals(x.Number, prefix + "-" + year + "-" + number.ToString("0000"), StringComparison.OrdinalIgnoreCase))) number++;
            return prefix + "-" + year + "-" + number.ToString("0000");
        }

        private bool NumberExists(string number, string ignoreId)
        {
            return _state.Documents.Any(x => x.Id != ignoreId && string.Equals(x.Number, number, StringComparison.OrdinalIgnoreCase));
        }

        private void ShowDocuments()
        {
            ClearView("المستندات");
            FlowLayoutPanel top = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 52, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            Button newQuote = Ui.ActionButton("عرض سعر جديد", true);
            Button newInvoice = Ui.ActionButton("فاتورة جديدة");
            TextBox search = Ui.TextBox(""); search.Width = 280; search.PlaceholderText = "بحث بالرقم أو العميل";
            top.Controls.Add(newQuote); top.Controls.Add(newInvoice); top.Controls.Add(search); _content.Controls.Add(top);

            DataGridView grid = DocumentGrid(); _content.Controls.Add(grid); grid.BringToFront(); top.BringToFront();
            Action reload = delegate
            {
                grid.Rows.Clear(); string query = search.Text.Trim();
                foreach (DocumentModel document in _state.Documents.OrderByDescending(x => x.UpdatedAt).Where(x => string.IsNullOrEmpty(query) || x.Number.Contains(query, StringComparison.OrdinalIgnoreCase) || (x.CustomerName ?? "").Contains(query, StringComparison.OrdinalIgnoreCase)))
                    grid.Rows.Add(document.Id, document.Number, document.Type, document.CustomerName, document.Date.ToString("yyyy-MM-dd"), document.GrandTotal.ToString("N2"), document.Currency);
            };
            reload(); search.TextChanged += delegate { reload(); };
            newQuote.Click += delegate { ShowEditor(NewDocument("عرض سعر")); };
            newInvoice.Click += delegate { ShowEditor(NewDocument("فاتورة")); };
            grid.CellDoubleClick += delegate(object s, DataGridViewCellEventArgs e) { if (e.RowIndex >= 0) { DocumentModel d = SelectedDocument(grid); if (d != null) ShowEditor(d); } };

            FlowLayoutPanel bottom = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 54, FlowDirection = FlowDirection.RightToLeft };
            Button open = Ui.ActionButton("فتح");
            Button clone = Ui.ActionButton("نسخ");
            Button convert = Ui.ActionButton("تحويل إلى فاتورة");
            Button delete = Ui.ActionButton("حذف");
            bottom.Controls.Add(open); bottom.Controls.Add(clone); bottom.Controls.Add(convert); bottom.Controls.Add(delete); _content.Controls.Add(bottom); bottom.BringToFront();
            open.Click += delegate { DocumentModel d = SelectedDocument(grid); if (d != null) ShowEditor(d); };
            clone.Click += delegate
            {
                DocumentModel d = SelectedDocument(grid); if (d == null) return;
                DocumentModel copy = Clone(d); copy.Id = Guid.NewGuid().ToString("N"); copy.Number = NextNumber(copy.Type, null); copy.CreatedAt = copy.UpdatedAt = DateTime.Now;
                _state.Documents.Add(copy); SaveState(); reload(); SetStatus("تم نسخ المستند");
            };
            convert.Click += delegate
            {
                DocumentModel d = SelectedDocument(grid); if (d == null) return;
                DocumentModel copy = Clone(d); copy.Id = Guid.NewGuid().ToString("N"); copy.Type = "فاتورة"; copy.Number = NextNumber("فاتورة", null); copy.CreatedAt = copy.UpdatedAt = DateTime.Now;
                _state.Documents.Add(copy); SaveState(); ShowEditor(copy);
            };
            delete.Click += delegate
            {
                DocumentModel d = SelectedDocument(grid);
                if (d != null && MessageBox.Show("حذف " + d.Number + "؟", "تأكيد", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes)
                { _state.Documents.Remove(d); SaveState(); reload(); }
            };
        }

        private DataGridView DocumentGrid()
        {
            DataGridView grid = Ui.Grid(); grid.Dock = DockStyle.Fill; grid.ReadOnly = true;
            grid.Columns.Add("Id", "Id"); grid.Columns[0].Visible = false;
            grid.Columns.Add("Number", "الرقم"); grid.Columns.Add("Type", "النوع"); grid.Columns.Add("Customer", "العميل"); grid.Columns.Add("Date", "التاريخ"); grid.Columns.Add("Total", "الإجمالي"); grid.Columns.Add("Currency", "العملة");
            return grid;
        }

        private DocumentModel SelectedDocument(DataGridView grid)
        {
            if (grid.CurrentRow == null) return null;
            string id = Convert.ToString(grid.CurrentRow.Cells[0].Value);
            return _state.Documents.FirstOrDefault(x => x.Id == id);
        }

        private static DocumentModel Clone(DocumentModel source)
        {
            DocumentModel copy = new DocumentModel
            {
                Id = source.Id,
                Number = source.Number,
                Type = source.Type,
                Date = source.Date,
                ValidUntil = source.ValidUntil,
                Currency = source.Currency,
                CustomerId = source.CustomerId,
                CustomerName = source.CustomerName,
                CustomerPhone = source.CustomerPhone,
                CustomerEmail = source.CustomerEmail,
                CustomerAddress = source.CustomerAddress,
                Notes = source.Notes,
                PaymentTerms = source.PaymentTerms,
                QrText = source.QrText,
                GlobalDiscountPercent = source.GlobalDiscountPercent,
                CreatedAt = source.CreatedAt,
                UpdatedAt = source.UpdatedAt
            };
            copy.Items = (source.Items ?? new List<LineItem>()).Select(x => new LineItem
            {
                Name = x.Name, Quantity = x.Quantity, Carton = x.Carton, UnitPrice = x.UnitPrice,
                DiscountPercent = x.DiscountPercent, TaxPercent = x.TaxPercent, Note = x.Note, Barcode = x.Barcode
            }).ToList();
            return copy;
        }

        private void ShowEditor(DocumentModel document)
        {
            ClearView(document.Type + " - " + document.Number);
            _doc = document;
            _items = new BindingList<LineItem>(document.Items ?? new List<LineItem>());
            _pageIndex = 0;

            FlowLayoutPanel toolbar = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 54, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            Button save = Ui.ActionButton("حفظ", true);
            Button pdf = Ui.ActionButton("حفظ PDF");
            Button print = Ui.ActionButton("طباعة");
            Button add = Ui.ActionButton("+ صف");
            Button remove = Ui.ActionButton("حذف الصف");
            toolbar.Controls.Add(save); toolbar.Controls.Add(pdf); toolbar.Controls.Add(print); toolbar.Controls.Add(add); toolbar.Controls.Add(remove); _content.Controls.Add(toolbar);
            save.Click += delegate { SaveCurrent(true); };
            pdf.Click += delegate { ExportPdf(); };
            print.Click += delegate { PrintCurrent(); };
            add.Click += delegate { _items.Add(new LineItem { Carton = "10*2" }); MarkDirty(); };
            remove.Click += delegate
            {
                if (_grid != null && _grid.CurrentRow != null && _grid.CurrentRow.Index >= 0 && _grid.CurrentRow.Index < _items.Count)
                { _items.RemoveAt(_grid.CurrentRow.Index); MarkDirty(); }
            };

            SplitContainer split = new SplitContainer { Dock = DockStyle.Fill, Orientation = Orientation.Vertical, SplitterWidth = 6, BackColor = Ui.Paper, SplitterDistance = 720 };
            split.Panel1.Padding = new Padding(0, 0, 8, 0); split.Panel2.Padding = new Padding(8, 0, 0, 0);
            _content.Controls.Add(split); split.BringToFront(); toolbar.BringToFront();
            BuildEditorPanel(split.Panel1, document);
            BuildPreview(split.Panel2);
            RefreshPreview();
        }

        private void BuildEditorPanel(Control host, DocumentModel d)
        {
            Panel editor = new Panel { Dock = DockStyle.Fill, AutoScroll = true, BackColor = Color.White, Padding = new Padding(12) };
            host.Controls.Add(editor);

            _validation = new Label { Dock = DockStyle.Top, Height = 42, BackColor = Color.FromArgb(245, 248, 250), ForeColor = Ui.Muted, Font = Ui.Font(9.5f, FontStyle.Bold), TextAlign = ContentAlignment.MiddleRight, Padding = new Padding(10) };
            editor.Controls.Add(_validation);

            TableLayoutPanel meta = FormTable(4, 4, 170);
            _type = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Font = Ui.Font(10) }; _type.Items.AddRange(new object[] { "عرض سعر", "فاتورة" }); _type.SelectedItem = d.Type;
            _number = Ui.TextBox(d.Number); _number.RightToLeft = RightToLeft.No;
            _date = DatePicker(d.Date); _valid = DatePicker(d.ValidUntil);
            _currency = Ui.TextBox(d.Currency); _currency.RightToLeft = RightToLeft.No;
            _globalDiscount = new NumericUpDown { Minimum = 0, Maximum = 100, DecimalPlaces = 2, Value = Math.Max(0, Math.Min(100, d.GlobalDiscountPercent)), Font = Ui.Font(10) };
            _customerPick = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Font = Ui.Font(10) }; _customerPick.Items.Add("-- اختيار عميل محفوظ --"); foreach (Customer c in _state.Customers) _customerPick.Items.Add(c); _customerPick.SelectedIndex = 0;
            Pair(meta, 0, "نوع المستند", _type); Pair(meta, 1, "رقم المستند", _number); Pair(meta, 2, "التاريخ", _date); Pair(meta, 3, "صالح حتى", _valid); Pair(meta, 4, "العملة", _currency); Pair(meta, 5, "خصم عام %", _globalDiscount); Pair(meta, 6, "عميل محفوظ", _customerPick);
            editor.Controls.Add(meta);

            TableLayoutPanel customer = FormTable(4, 2, 112);
            _customerName = Ui.TextBox(d.CustomerName);
            _customerPhone = Ui.TextBox(d.CustomerPhone); _customerPhone.RightToLeft = RightToLeft.No;
            _customerEmail = Ui.TextBox(d.CustomerEmail); _customerEmail.RightToLeft = RightToLeft.No;
            _customerAddress = Ui.TextBox(d.CustomerAddress);
            Pair(customer, 0, "اسم العميل", _customerName); Pair(customer, 1, "الهاتف", _customerPhone); Pair(customer, 2, "البريد", _customerEmail); Pair(customer, 3, "العنوان", _customerAddress);
            editor.Controls.Add(customer);

            FlowLayoutPanel products = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 44, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
            ComboBox saved = new ComboBox { Width = 275, DropDownStyle = ComboBoxStyle.DropDownList, Font = Ui.Font(10) }; saved.Items.Add("-- منتج محفوظ --"); foreach (Product p in _state.Products) saved.Items.Add(p); saved.SelectedIndex = 0;
            Button addProduct = Ui.ActionButton("إضافة المنتج"); addProduct.Width = 120;
            addProduct.Click += delegate
            {
                Product p = saved.SelectedItem as Product;
                if (p != null) { _items.Add(new LineItem { Name = p.Name, UnitPrice = p.DefaultPrice, Carton = p.CartonFormat, Barcode = p.Barcode, Note = p.Note }); MarkDirty(); }
            };
            products.Controls.Add(saved); products.Controls.Add(addProduct); editor.Controls.Add(products);

            _grid = Ui.Grid(); _grid.Dock = DockStyle.Top; _grid.Height = 292; _grid.AutoGenerateColumns = false; _grid.DataSource = _items;
            AddColumn("Name", "الصنف", 160);
            AddColumn("Quantity", "الكمية", 65, "0.##");
            AddColumn("Carton", "الكرتون مثل 10*2", 115);
            AddColumn("UnitPrice", "سعر الوحدة", 82, "N2");
            AddColumn("DiscountPercent", "خصم %", 65, "0.##");
            AddColumn("TaxPercent", "ضريبة %", 65, "0.##");
            AddColumn("Total", "الإجمالي", 88, "N2", true);
            AddColumn("Barcode", "الباركود", 100);
            AddColumn("Note", "ملاحظة", 130);
            _grid.CellEndEdit += delegate { MarkDirty(); };
            _grid.DataError += delegate(object s, DataGridViewDataErrorEventArgs e) { e.ThrowException = false; };
            _grid.CellFormatting += GridCellFormatting;
            _grid.CellParsing += GridCellParsing;
            editor.Controls.Add(_grid);

            TableLayoutPanel extra = FormTable(2, 3, 150);
            _notes = new TextBox { Text = d.Notes, Multiline = true, ScrollBars = ScrollBars.Vertical, Font = Ui.Font(9.5f) };
            _terms = Ui.TextBox(d.PaymentTerms);
            _qr = Ui.TextBox(d.QrText); _qr.RightToLeft = RightToLeft.No;
            Row(extra, 0, "ملاحظات", _notes); Row(extra, 1, "شروط الدفع", _terms); Row(extra, 2, "نص QR", _qr); editor.Controls.Add(extra);
            _totals = new Label { Dock = DockStyle.Top, Height = 76, ForeColor = Ui.Navy, Font = Ui.Font(10, FontStyle.Bold), TextAlign = ContentAlignment.MiddleRight, Padding = new Padding(8) }; editor.Controls.Add(_totals);

            _totals.BringToFront(); extra.BringToFront(); _grid.BringToFront(); products.BringToFront(); customer.BringToFront(); meta.BringToFront(); _validation.BringToFront();

            EventHandler changed = delegate { MarkDirty(); };
            _number.TextChanged += changed; _date.ValueChanged += changed; _valid.ValueChanged += changed; _currency.TextChanged += changed; _globalDiscount.ValueChanged += changed;
            _customerName.TextChanged += changed; _customerPhone.TextChanged += changed; _customerEmail.TextChanged += changed; _customerAddress.TextChanged += changed;
            _notes.TextChanged += changed; _terms.TextChanged += changed; _qr.TextChanged += changed;
            _type.SelectedIndexChanged += delegate
            {
                string selected = Convert.ToString(_type.SelectedItem);
                if (_doc != null && !string.IsNullOrEmpty(selected) && selected != _doc.Type) { _number.Text = NextNumber(selected, _doc.Id); MarkDirty(); }
            };
            _customerPick.SelectedIndexChanged += delegate
            {
                Customer c = _customerPick.SelectedItem as Customer;
                if (c != null)
                {
                    _doc.CustomerId = c.Id;
                    _customerName.Text = string.IsNullOrWhiteSpace(c.Company) ? c.Name : c.Company;
                    _customerPhone.Text = c.Phone; _customerEmail.Text = c.Email; _customerAddress.Text = c.Address;
                }
            };
        }

        private void GridCellFormatting(object sender, DataGridViewCellFormattingEventArgs e)
        {
            if (_grid == null || e.RowIndex < 0 || e.ColumnIndex < 0) return;
            string name = _grid.Columns[e.ColumnIndex].Name;
            if ((name == "Carton" || name == "Barcode") && e.Value != null)
            {
                string value = Convert.ToString(e.Value) ?? "";
                e.Value = "\u200E" + value + "\u200E";
                e.FormattingApplied = true;
                e.CellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            }
            else if (name == "Quantity" || name == "UnitPrice" || name == "DiscountPercent" || name == "TaxPercent" || name == "Total")
            {
                e.CellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            }
        }

        private void GridCellParsing(object sender, DataGridViewCellParsingEventArgs e)
        {
            if (_grid == null || e.RowIndex < 0 || e.ColumnIndex < 0 || e.Value == null) return;
            string name = _grid.Columns[e.ColumnIndex].Name;
            if (name == "Carton" || name == "Barcode") e.Value = Convert.ToString(e.Value).Replace("\u200E", "");
        }

        private void BuildPreview(Control host)
        {
            Panel wrap = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(8) }; host.Controls.Add(wrap);
            FlowLayoutPanel nav = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 44, FlowDirection = FlowDirection.LeftToRight };
            Button prev = Ui.ActionButton("السابق"); prev.Width = 80;
            Button next = Ui.ActionButton("التالي"); next.Width = 80;
            _pageInfo = new Label { Width = 120, Height = 36, TextAlign = ContentAlignment.MiddleCenter, Font = Ui.Font(9, FontStyle.Bold) };
            prev.Click += delegate { if (_pageIndex > 0) { _pageIndex--; RefreshPreview(); } };
            next.Click += delegate { CommitEditor(); if (_pageIndex + 1 < DocumentRenderer.GetPageCount(_doc)) { _pageIndex++; RefreshPreview(); } };
            nav.Controls.Add(prev); nav.Controls.Add(_pageInfo); nav.Controls.Add(next); wrap.Controls.Add(nav);
            _preview = new DocumentPreviewPanel { Dock = DockStyle.Fill, Document = _doc, Settings = _state.Settings };
            wrap.Controls.Add(_preview); _preview.BringToFront(); nav.BringToFront();
        }

        private TableLayoutPanel FormTable(int columns, int rows, int height)
        {
            TableLayoutPanel table = new TableLayoutPanel { Dock = DockStyle.Top, Height = height, ColumnCount = columns, RowCount = rows, Padding = new Padding(4) };
            for (int i = 0; i < columns; i++) table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, i % 2 == 0 ? 16 : 34));
            for (int i = 0; i < rows; i++) table.RowStyles.Add(new RowStyle(SizeType.Percent, 100f / rows));
            return table;
        }

        private void Pair(TableLayoutPanel table, int index, string label, Control field)
        {
            int row = index / 2; int col = (index % 2) * 2;
            Label l = Ui.Label(label, 9, true); l.Dock = DockStyle.Fill; l.TextAlign = ContentAlignment.MiddleRight;
            field.Dock = DockStyle.Fill; field.Margin = new Padding(4);
            table.Controls.Add(l, col, row); table.Controls.Add(field, col + 1, row);
        }

        private void Row(TableLayoutPanel table, int row, string label, Control field)
        {
            Label l = Ui.Label(label, 9, true); l.Dock = DockStyle.Fill; l.TextAlign = ContentAlignment.MiddleRight;
            field.Dock = DockStyle.Fill; field.Margin = new Padding(4);
            table.Controls.Add(l, 0, row); table.Controls.Add(field, 1, row);
        }

        private DateTimePicker DatePicker(DateTime value)
        {
            return new DateTimePicker { Value = value, Format = DateTimePickerFormat.Custom, CustomFormat = "yyyy-MM-dd", Font = Ui.Font(10) };
        }

        private void AddColumn(string property, string header, int weight, string format = null, bool readOnly = false)
        {
            DataGridViewTextBoxColumn column = new DataGridViewTextBoxColumn { DataPropertyName = property, HeaderText = header, Name = property, MinimumWidth = 55, FillWeight = weight, ReadOnly = readOnly };
            if (format != null) column.DefaultCellStyle.Format = format;
            _grid.Columns.Add(column);
        }

        private void MarkDirty()
        {
            if (_doc == null) return;
            _dirty = true;
            SetStatus("تغييرات غير محفوظة...");
            _autoSave.Stop(); _autoSave.Start();
            RefreshPreview();
        }

        private void CommitEditor()
        {
            if (_doc == null || _type == null) return;
            if (_grid != null) _grid.EndEdit();
            _doc.Type = Convert.ToString(_type.SelectedItem) ?? "عرض سعر";
            _doc.Number = (_number.Text ?? "").Trim();
            _doc.Date = _date.Value.Date;
            _doc.ValidUntil = _valid.Value.Date;
            _doc.Currency = string.IsNullOrWhiteSpace(_currency.Text) ? "USD" : _currency.Text.Trim();
            _doc.CustomerName = _customerName.Text.Trim();
            _doc.CustomerPhone = _customerPhone.Text.Trim();
            _doc.CustomerEmail = _customerEmail.Text.Trim();
            _doc.CustomerAddress = _customerAddress.Text.Trim();
            _doc.GlobalDiscountPercent = _globalDiscount.Value;
            _doc.Notes = _notes.Text;
            _doc.PaymentTerms = _terms.Text;
            _doc.QrText = _qr.Text.Trim();
            _doc.Items = _items.ToList();
            _doc.UpdatedAt = DateTime.Now;
        }

        private void SaveCurrent(bool announce)
        {
            if (_doc == null || _type == null) return;
            CommitEditor();
            if (string.IsNullOrWhiteSpace(_doc.Number) || NumberExists(_doc.Number, _doc.Id))
            {
                _doc.Number = NextNumber(_doc.Type, _doc.Id);
                _number.Text = _doc.Number;
                SetStatus("تم منع رقم مكرر وإنشاء " + _doc.Number);
            }
            if (!_state.Documents.Any(x => x.Id == _doc.Id)) _state.Documents.Add(_doc);
            SaveState();
            _dirty = false; _autoSave.Stop();
            if (announce) SetStatus("تم حفظ " + _doc.Number);
            else if (_status.Text.StartsWith("تغييرات")) SetStatus("حفظ تلقائي ✓");
            RefreshPreview();
        }

        private void RefreshPreview()
        {
            if (_doc == null || _preview == null) return;
            try
            {
                CommitEditor();
                int count = DocumentRenderer.GetPageCount(_doc);
                if (_pageIndex >= count) _pageIndex = count - 1;
                _preview.PageIndex = Math.Max(0, _pageIndex);
                _preview.Document = _doc;
                _preview.Settings = _state.Settings;
                _pageInfo.Text = "صفحة " + (_preview.PageIndex + 1) + " / " + count;
                _preview.Invalidate();
                if (_totals != null) _totals.Text = "المجموع: " + _doc.Subtotal.ToString("N2") + "  |  الخصومات: " + _doc.LineDiscounts.ToString("N2") + "  |  الضريبة: " + _doc.Taxes.ToString("N2") + "\r\nالإجمالي النهائي: " + _doc.GrandTotal.ToString("N2") + " " + _doc.Currency;
                UpdateValidationIndicator();
            }
            catch { }
        }

        private void UpdateValidationIndicator()
        {
            if (_validation == null || _doc == null) return;
            DocumentValidationResult result = DocumentRules.ValidateForOutput(_doc, _state.Settings);
            if (!result.IsValid)
            {
                _validation.Text = "غير جاهز للتصدير: " + result.Errors[0];
                _validation.ForeColor = Color.FromArgb(170, 55, 45);
                _validation.BackColor = Color.FromArgb(255, 244, 242);
            }
            else if (result.Warnings.Count > 0)
            {
                _validation.Text = "جاهز مع تنبيه: " + result.Warnings[0];
                _validation.ForeColor = Color.FromArgb(145, 95, 20);
                _validation.BackColor = Color.FromArgb(255, 249, 232);
            }
            else
            {
                _validation.Text = "جاهز للتصدير والطباعة ✓";
                _validation.ForeColor = Color.FromArgb(35, 120, 75);
                _validation.BackColor = Color.FromArgb(239, 250, 244);
            }
        }

        private bool EnsureOutputReady()
        {
            if (_doc == null) return false;
            CommitEditor();
            DocumentValidationResult result = DocumentRules.ValidateForOutput(_doc, _state.Settings);
            if (!result.IsValid)
            {
                MessageBox.Show("لا يمكن إصدار المستند قبل تصحيح التالي:\n\n• " + string.Join("\n• ", result.Errors), "فحص المستند", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }
            if (result.Warnings.Count > 0)
            {
                DialogResult answer = MessageBox.Show("تنبيهات قبل الإصدار:\n\n• " + string.Join("\n• ", result.Warnings) + "\n\nهل تريد المتابعة؟", "فحص المستند", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (answer != DialogResult.Yes) return false;
            }
            return true;
        }

        private void ExportPdf()
        {
            if (_doc == null) return;
            SaveCurrent(false);
            if (!EnsureOutputReady()) return;
            string printer = PrinterSettings.InstalledPrinters.Cast<string>().FirstOrDefault(x => x.Equals("Microsoft Print to PDF", StringComparison.OrdinalIgnoreCase));
            if (printer == null) { MessageBox.Show("Microsoft Print to PDF غير متوفر. استخدم زر الطباعة واختر طابعة PDF."); return; }
            using SaveFileDialog dialog = new SaveFileDialog { Filter = "PDF|*.pdf", FileName = SafeName(_doc.Number) + ".pdf" };
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            try
            {
                DocumentPrintSession session = new DocumentPrintSession(_doc, _state.Settings);
                session.PrintDocument.PrinterSettings.PrinterName = printer;
                session.PrintDocument.PrinterSettings.PrintToFile = true;
                session.PrintDocument.PrinterSettings.PrintFileName = dialog.FileName;
                session.PrintDocument.PrintController = new StandardPrintController();
                session.PrintDocument.Print();
                SetStatus("تم إنشاء PDF: " + dialog.FileName);
            }
            catch (Exception ex) { MessageBox.Show("تعذر إنشاء PDF:\n" + ex.Message, "PDF", MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        private void PrintCurrent()
        {
            if (_doc == null) return;
            SaveCurrent(false);
            if (!EnsureOutputReady()) return;
            DocumentPrintSession session = new DocumentPrintSession(_doc, _state.Settings);
            using PrintDialog dialog = new PrintDialog { Document = session.PrintDocument, UseEXDialog = true };
            if (dialog.ShowDialog(this) == DialogResult.OK)
            {
                try { session.PrintDocument.Print(); }
                catch (Exception ex) { MessageBox.Show(ex.Message, "الطباعة", MessageBoxButtons.OK, MessageBoxIcon.Error); }
            }
        }

        private void ShowCustomers()
        {
            ClearView("العملاء");
            FlowLayoutPanel top = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 50, FlowDirection = FlowDirection.RightToLeft };
            Button add = Ui.ActionButton("+ عميل", true); Button edit = Ui.ActionButton("تعديل"); Button del = Ui.ActionButton("حذف");
            top.Controls.Add(add); top.Controls.Add(edit); top.Controls.Add(del); _content.Controls.Add(top);
            DataGridView grid = Ui.Grid(); grid.ReadOnly = true;
            grid.Columns.Add("Id", "Id"); grid.Columns[0].Visible = false; grid.Columns.Add("Name", "الاسم"); grid.Columns.Add("Company", "الشركة"); grid.Columns.Add("Phone", "الهاتف"); grid.Columns.Add("Email", "البريد"); grid.Columns.Add("Address", "العنوان");
            _content.Controls.Add(grid); grid.BringToFront(); top.BringToFront();
            Action reload = delegate { grid.Rows.Clear(); foreach (Customer c in _state.Customers.OrderBy(x => x.Company).ThenBy(x => x.Name)) grid.Rows.Add(c.Id, c.Name, c.Company, c.Phone, c.Email, c.Address); };
            reload();
            add.Click += delegate { Customer c = new Customer(); if (EditCustomer(c)) { _state.Customers.Add(c); SaveState(); reload(); } };
            edit.Click += delegate { Customer c = SelectedCustomer(grid); if (c != null && EditCustomer(c)) { SaveState(); reload(); } };
            del.Click += delegate { Customer c = SelectedCustomer(grid); if (c != null && MessageBox.Show("حذف العميل؟", "تأكيد", MessageBoxButtons.YesNo) == DialogResult.Yes) { _state.Customers.Remove(c); SaveState(); reload(); } };
            grid.CellDoubleClick += delegate(object s, DataGridViewCellEventArgs e) { if (e.RowIndex >= 0) { Customer c = SelectedCustomer(grid); if (c != null && EditCustomer(c)) { SaveState(); reload(); } } };
        }

        private Customer SelectedCustomer(DataGridView grid)
        {
            if (grid.CurrentRow == null) return null; string id = Convert.ToString(grid.CurrentRow.Cells[0].Value); return _state.Customers.FirstOrDefault(x => x.Id == id);
        }

        private bool EditCustomer(Customer customer)
        {
            using Form form = Dialog("بيانات العميل", 520, 455); TableLayoutPanel table = DialogTable(); form.Controls.Add(table);
            TextBox name = Ui.TextBox(customer.Name); TextBox company = Ui.TextBox(customer.Company); TextBox phone = Ui.TextBox(customer.Phone); phone.RightToLeft = RightToLeft.No; TextBox email = Ui.TextBox(customer.Email); email.RightToLeft = RightToLeft.No; TextBox address = Ui.TextBox(customer.Address);
            DialogRow(table, 0, "الاسم", name); DialogRow(table, 1, "الشركة", company); DialogRow(table, 2, "الهاتف", phone); DialogRow(table, 3, "البريد", email); DialogRow(table, 4, "العنوان", address);
            DialogButtons(form, delegate { customer.Name = name.Text.Trim(); customer.Company = company.Text.Trim(); customer.Phone = phone.Text.Trim(); customer.Email = email.Text.Trim(); customer.Address = address.Text.Trim(); });
            return form.ShowDialog(this) == DialogResult.OK;
        }

        private void ShowProducts()
        {
            ClearView("المنتجات");
            FlowLayoutPanel top = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 50, FlowDirection = FlowDirection.RightToLeft };
            Button add = Ui.ActionButton("+ منتج", true); Button edit = Ui.ActionButton("تعديل"); Button del = Ui.ActionButton("حذف");
            top.Controls.Add(add); top.Controls.Add(edit); top.Controls.Add(del); _content.Controls.Add(top);
            DataGridView grid = Ui.Grid(); grid.ReadOnly = true;
            grid.Columns.Add("Id", "Id"); grid.Columns[0].Visible = false; grid.Columns.Add("Name", "المنتج"); grid.Columns.Add("Price", "السعر"); grid.Columns.Add("Carton", "الكرتون"); grid.Columns.Add("Barcode", "الباركود"); grid.Columns.Add("Note", "ملاحظة");
            _content.Controls.Add(grid); grid.BringToFront(); top.BringToFront();
            Action reload = delegate { grid.Rows.Clear(); foreach (Product p in _state.Products.OrderBy(x => x.Name)) grid.Rows.Add(p.Id, p.Name, p.DefaultPrice.ToString("N2"), "\u200E" + p.CartonFormat + "\u200E", p.Barcode, p.Note); };
            reload();
            add.Click += delegate { Product p = new Product(); if (EditProduct(p)) { _state.Products.Add(p); SaveState(); reload(); } };
            edit.Click += delegate { Product p = SelectedProduct(grid); if (p != null && EditProduct(p)) { SaveState(); reload(); } };
            del.Click += delegate { Product p = SelectedProduct(grid); if (p != null && MessageBox.Show("حذف المنتج؟", "تأكيد", MessageBoxButtons.YesNo) == DialogResult.Yes) { _state.Products.Remove(p); SaveState(); reload(); } };
            grid.CellDoubleClick += delegate(object s, DataGridViewCellEventArgs e) { if (e.RowIndex >= 0) { Product p = SelectedProduct(grid); if (p != null && EditProduct(p)) { SaveState(); reload(); } } };
        }

        private Product SelectedProduct(DataGridView grid)
        {
            if (grid.CurrentRow == null) return null; string id = Convert.ToString(grid.CurrentRow.Cells[0].Value); return _state.Products.FirstOrDefault(x => x.Id == id);
        }

        private bool EditProduct(Product product)
        {
            using Form form = Dialog("بيانات المنتج", 520, 455); TableLayoutPanel table = DialogTable(); form.Controls.Add(table);
            TextBox name = Ui.TextBox(product.Name); TextBox price = Ui.TextBox(product.DefaultPrice.ToString("0.##")); price.RightToLeft = RightToLeft.No; TextBox carton = Ui.TextBox(string.IsNullOrWhiteSpace(product.CartonFormat) ? "10*2" : product.CartonFormat); carton.RightToLeft = RightToLeft.No; TextBox barcode = Ui.TextBox(product.Barcode); barcode.RightToLeft = RightToLeft.No; TextBox note = Ui.TextBox(product.Note);
            DialogRow(table, 0, "اسم المنتج", name); DialogRow(table, 1, "السعر", price); DialogRow(table, 2, "الكرتون", carton); DialogRow(table, 3, "الباركود", barcode); DialogRow(table, 4, "ملاحظات", note);
            Label hint = new Label { Text = "الكرتون نص حر ويحفظ كما كتبته: 10*2 أو 12*6 أو 24*1", Dock = DockStyle.Bottom, Height = 30, ForeColor = Ui.Orange, TextAlign = ContentAlignment.MiddleCenter, Font = Ui.Font(9, FontStyle.Bold) }; form.Controls.Add(hint);
            DialogButtons(form, delegate { decimal value; decimal.TryParse(price.Text, out value); product.Name = name.Text.Trim(); product.DefaultPrice = value; product.CartonFormat = carton.Text.Trim().Replace("\u200E", ""); product.Barcode = barcode.Text.Trim(); product.Note = note.Text.Trim(); });
            return form.ShowDialog(this) == DialogResult.OK;
        }

        private void ShowSettings()
        {
            ClearView("الإعدادات والنسخ");
            Panel scroll = new Panel { Dock = DockStyle.Fill, AutoScroll = true, BackColor = Color.White, Padding = new Padding(22) }; _content.Controls.Add(scroll);
            TableLayoutPanel table = new TableLayoutPanel { Dock = DockStyle.Top, Height = 590, ColumnCount = 2, RowCount = 13, Padding = new Padding(10) };
            table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 24)); table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 76));
            CompanySettings s = _state.Settings;
            TextBox company = Ui.TextBox(s.CompanyName); TextBox a1 = Ui.TextBox(s.Address1); TextBox a2 = Ui.TextBox(s.Address2); TextBox phone = Ui.TextBox(s.Phone); TextBox email = Ui.TextBox(s.Email); TextBox web = Ui.TextBox(s.Website); TextBox tax = Ui.TextBox(s.TaxNumber); TextBox currency = Ui.TextBox(s.DefaultCurrency); TextBox primary = Ui.TextBox(s.PrimaryColorHex); TextBox accent = Ui.TextBox(s.AccentColorHex); TextBox footer = Ui.TextBox(s.FooterText); TextBox font = Ui.TextBox(s.FontName);
            phone.RightToLeft = email.RightToLeft = web.RightToLeft = currency.RightToLeft = primary.RightToLeft = accent.RightToLeft = font.RightToLeft = RightToLeft.No;
            ComboBox template = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Font = Ui.Font(10) }; template.Items.AddRange(new object[] { "Modern", "Corporate", "Minimal" }); template.SelectedItem = template.Items.Contains(s.TemplatePreset) ? s.TemplatePreset : "Modern";
            DialogRow(table, 0, "اسم الشركة *", company); DialogRow(table, 1, "العنوان 1", a1); DialogRow(table, 2, "العنوان 2", a2); DialogRow(table, 3, "الهاتف", phone); DialogRow(table, 4, "البريد", email); DialogRow(table, 5, "الموقع", web); DialogRow(table, 6, "الرقم الضريبي", tax); DialogRow(table, 7, "العملة الافتراضية", currency); DialogRow(table, 8, "اللون الرئيسي", primary); DialogRow(table, 9, "لون التمييز", accent); DialogRow(table, 10, "نص الفوتر", footer); DialogRow(table, 11, "الخط", font); DialogRow(table, 12, "القالب", template);
            scroll.Controls.Add(table);

            FlowLayoutPanel tools = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 190, FlowDirection = FlowDirection.RightToLeft, WrapContents = true, Padding = new Padding(8) };
            string[] names = { "حفظ الإعدادات", "اختيار الشعار", "نسخة احتياطية", "استعادة نسخة", "تصدير JSON", "استيراد JSON", "تصدير المنتجات CSV", "استيراد المنتجات CSV", "تصدير العملاء CSV", "استيراد العملاء CSV", "فتح مجلد البيانات" };
            Dictionary<string, Button> buttons = new Dictionary<string, Button>();
            foreach (string name in names) { Button button = Ui.ActionButton(name, name == "حفظ الإعدادات"); button.Width = Math.Max(120, name.Length * 9 + 32); buttons[name] = button; tools.Controls.Add(button); }
            scroll.Controls.Add(tools); tools.BringToFront(); table.BringToFront();

            buttons["حفظ الإعدادات"].Click += delegate
            {
                if (string.IsNullOrWhiteSpace(company.Text)) { MessageBox.Show("اسم الشركة مطلوب.", "الإعدادات", MessageBoxButtons.OK, MessageBoxIcon.Warning); return; }
                s.CompanyName = company.Text.Trim(); s.Address1 = a1.Text.Trim(); s.Address2 = a2.Text.Trim(); s.Phone = phone.Text.Trim(); s.Email = email.Text.Trim(); s.Website = web.Text.Trim(); s.TaxNumber = tax.Text.Trim(); s.DefaultCurrency = currency.Text.Trim(); s.PrimaryColorHex = primary.Text.Trim(); s.AccentColorHex = accent.Text.Trim(); s.FooterText = footer.Text.Trim(); s.FontName = font.Text.Trim(); s.TemplatePreset = Convert.ToString(template.SelectedItem) ?? "Modern";
                SaveState(); SetStatus("تم حفظ الإعدادات");
            };
            buttons["اختيار الشعار"].Click += delegate { using OpenFileDialog d = new OpenFileDialog { Filter = "صور|*.png;*.jpg;*.jpeg;*.bmp" }; if (d.ShowDialog(this) == DialogResult.OK) { s.LogoPath = _storage.ImportLogo(d.FileName); SaveState(); SetStatus("تم حفظ الشعار داخل بيانات البرنامج"); } };
            buttons["نسخة احتياطية"].Click += delegate { using SaveFileDialog d = new SaveFileDialog { Filter = "Quotation Studio Backup|*.qsbak", FileName = "QuotationStudio-" + DateTime.Now.ToString("yyyyMMdd-HHmm") + ".qsbak" }; if (d.ShowDialog(this) == DialogResult.OK) { _storage.Backup(d.FileName, _state); SetStatus("تم إنشاء النسخة الاحتياطية"); } };
            buttons["استعادة نسخة"].Click += delegate { using OpenFileDialog d = new OpenFileDialog { Filter = "Quotation Studio Backup|*.qsbak" }; if (d.ShowDialog(this) == DialogResult.OK && MessageBox.Show("استبدال البيانات الحالية؟", "استعادة", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes) { _state = _storage.Restore(d.FileName); ShowDashboard(); SetStatus("تمت الاستعادة"); } };
            buttons["تصدير JSON"].Click += delegate { using SaveFileDialog d = new SaveFileDialog { Filter = "JSON|*.json", FileName = "quotation-data.json" }; if (d.ShowDialog(this) == DialogResult.OK) _storage.ExportJson(d.FileName, _state); };
            buttons["استيراد JSON"].Click += delegate { using OpenFileDialog d = new OpenFileDialog { Filter = "JSON|*.json" }; if (d.ShowDialog(this) == DialogResult.OK && MessageBox.Show("سيتم استبدال البيانات الحالية. متابعة؟", "JSON", MessageBoxButtons.YesNo) == DialogResult.Yes) { _state = _storage.ImportJson(d.FileName); ShowDashboard(); } };
            buttons["تصدير المنتجات CSV"].Click += delegate { using SaveFileDialog d = new SaveFileDialog { Filter = "CSV|*.csv", FileName = "products.csv" }; if (d.ShowDialog(this) == DialogResult.OK) _storage.ExportProductsCsv(d.FileName, _state); };
            buttons["استيراد المنتجات CSV"].Click += delegate { using OpenFileDialog d = new OpenFileDialog { Filter = "CSV|*.csv" }; if (d.ShowDialog(this) == DialogResult.OK) { int count = _storage.ImportProductsCsv(d.FileName, _state); _state = _storage.Load(); SetStatus("تم استيراد " + count + " منتج"); } };
            buttons["تصدير العملاء CSV"].Click += delegate { using SaveFileDialog d = new SaveFileDialog { Filter = "CSV|*.csv", FileName = "customers.csv" }; if (d.ShowDialog(this) == DialogResult.OK) _storage.ExportCustomersCsv(d.FileName, _state); };
            buttons["استيراد العملاء CSV"].Click += delegate { using OpenFileDialog d = new OpenFileDialog { Filter = "CSV|*.csv" }; if (d.ShowDialog(this) == DialogResult.OK) { int count = _storage.ImportCustomersCsv(d.FileName, _state); _state = _storage.Load(); SetStatus("تم استيراد " + count + " عميل"); } };
            buttons["فتح مجلد البيانات"].Click += delegate { Process.Start(new ProcessStartInfo("explorer.exe", _storage.DataFolder) { UseShellExecute = true }); };
        }

        private Form Dialog(string title, int width, int height)
        {
            return new Form { Text = title, Width = width, Height = height, StartPosition = FormStartPosition.CenterParent, Font = Ui.Font(), RightToLeft = RightToLeft.Yes, RightToLeftLayout = true, BackColor = Color.White, MinimizeBox = false, MaximizeBox = false };
        }

        private TableLayoutPanel DialogTable()
        {
            TableLayoutPanel table = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 6, Padding = new Padding(18, 18, 18, 68) };
            table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 28)); table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 72));
            for (int i = 0; i < 6; i++) table.RowStyles.Add(new RowStyle(SizeType.Absolute, 50));
            return table;
        }

        private void DialogRow(TableLayoutPanel table, int row, string label, Control field)
        {
            Label l = Ui.Label(label, 9, true); l.Dock = DockStyle.Fill; l.TextAlign = ContentAlignment.MiddleRight;
            field.Dock = DockStyle.Fill; field.Margin = new Padding(3, 7, 3, 7);
            table.Controls.Add(l, 0, row); table.Controls.Add(field, 1, row);
        }

        private void DialogButtons(Form form, Action beforeOk)
        {
            FlowLayoutPanel bar = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 58, FlowDirection = FlowDirection.LeftToRight, Padding = new Padding(14, 8, 14, 8) };
            Button ok = Ui.ActionButton("حفظ", true); Button cancel = Ui.ActionButton("إلغاء");
            ok.DialogResult = DialogResult.OK; cancel.DialogResult = DialogResult.Cancel;
            ok.Click += delegate { beforeOk(); };
            bar.Controls.Add(ok); bar.Controls.Add(cancel); form.Controls.Add(bar); bar.BringToFront(); form.AcceptButton = ok; form.CancelButton = cancel;
        }

        private void SaveState()
        {
            try { _storage.Save(_state); }
            catch (Exception ex) { MessageBox.Show("تعذر حفظ البيانات:\n" + ex.Message, "الحفظ", MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        private void SetStatus(string text) { _status.Text = text; }

        private static string SafeName(string value)
        {
            string name = string.IsNullOrWhiteSpace(value) ? "document" : value;
            foreach (char c in Path.GetInvalidFileNameChars()) name = name.Replace(c, '-');
            return name;
        }
    }
}
