using System;
using System.Threading;
using System.Windows.Forms;

namespace QuotationStudio
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            bool created;
            using (var mutex = new Mutex(true, "QuotationStudio.Singleton", out created))
            {
                if (!created)
                {
                    MessageBox.Show("البرنامج يعمل بالفعل.", "Quotation Studio", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.ThreadException += (s, e) => MessageBox.Show(e.Exception.Message, "خطأ غير متوقع", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Application.Run(new MainForm());
            }
        }
    }
}
