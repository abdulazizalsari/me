using System;
using System.Drawing;
using System.Windows.Forms;

namespace QuotationStudio
{
    internal static class Ui
    {
        public static readonly Color Navy = Color.FromArgb(20, 35, 55);
        public static readonly Color Teal = Color.FromArgb(15, 61, 70);
        public static readonly Color Orange = Color.FromArgb(242, 106, 46);
        public static readonly Color Paper = Color.FromArgb(247, 249, 251);
        public static readonly Color Border = Color.FromArgb(222, 227, 232);
        public static readonly Color Muted = Color.FromArgb(102, 112, 122);

        public static Font Font(float size = 10f, FontStyle style = FontStyle.Regular) => new Font("Segoe UI", size, style);

        public static Button NavButton(string text)
        {
            var b = new Button
            {
                Text = text,
                Height = 48,
                Dock = DockStyle.Top,
                FlatStyle = FlatStyle.Flat,
                BackColor = Teal,
                ForeColor = Color.White,
                TextAlign = ContentAlignment.MiddleRight,
                Font = Font(10.5f, FontStyle.Regular),
                Cursor = Cursors.Hand,
                Padding = new Padding(12, 0, 12, 0),
                TabStop = false
            };
            b.FlatAppearance.BorderSize = 0;
            b.FlatAppearance.MouseOverBackColor = Color.FromArgb(22, 78, 88);
            return b;
        }

        public static Button ActionButton(string text, bool primary = false)
        {
            var b = new Button
            {
                Text = text,
                AutoSize = false,
                Height = 38,
                Width = 120,
                FlatStyle = FlatStyle.Flat,
                BackColor = primary ? Orange : Color.White,
                ForeColor = primary ? Color.White : Navy,
                Font = Font(9.5f, FontStyle.Bold),
                Cursor = Cursors.Hand,
                Margin = new Padding(6)
            };
            b.FlatAppearance.BorderColor = primary ? Orange : Border;
            b.FlatAppearance.BorderSize = 1;
            return b;
        }

        public static Label Label(string text, float size = 9.5f, bool bold = false)
        {
            return new Label
            {
                Text = text,
                AutoSize = true,
                ForeColor = Navy,
                Font = Font(size, bold ? FontStyle.Bold : FontStyle.Regular),
                Margin = new Padding(3, 7, 3, 3)
            };
        }

        public static TextBox TextBox(string text = "")
        {
            return new TextBox
            {
                Text = text,
                Font = Font(10f),
                BorderStyle = BorderStyle.FixedSingle,
                RightToLeft = RightToLeft.Yes,
                Margin = new Padding(3, 3, 3, 8),
                Width = 230
            };
        }

        public static Panel Card()
        {
            return new Panel
            {
                BackColor = Color.White,
                Padding = new Padding(16),
                Margin = new Padding(8)
            };
        }

        public static DataGridView Grid()
        {
            var g = new DataGridView
            {
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.None,
                GridColor = Border,
                RowHeadersVisible = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                ColumnHeadersHeight = 42,
                RowTemplate = { Height = 36 },
                Font = Font(9.5f),
                RightToLeft = RightToLeft.Yes,
                Dock = DockStyle.Fill
            };
            g.EnableHeadersVisualStyles = false;
            g.ColumnHeadersDefaultCellStyle.BackColor = Teal;
            g.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
            g.ColumnHeadersDefaultCellStyle.Font = Font(9.5f, FontStyle.Bold);
            g.ColumnHeadersDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            g.DefaultCellStyle.SelectionBackColor = Color.FromArgb(232, 243, 245);
            g.DefaultCellStyle.SelectionForeColor = Navy;
            g.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            return g;
        }

        public static Color ParseColor(string hex, Color fallback)
        {
            try { return ColorTranslator.FromHtml(hex); }
            catch { return fallback; }
        }
    }
}
