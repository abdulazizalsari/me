using System;
using System.Linq;
using System.Threading;
using System.Windows.Forms;

namespace QuotationStudio
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            if (args.Any(x => x.Equals("--self-test", StringComparison.OrdinalIgnoreCase)))
            {
                Environment.ExitCode = SelfTest.Run();
                return;
            }

            using var mutex = new Mutex(true, "QuotationStudio.Singleton.v3", out var created);
            if (!created)
            {
                MessageBox.Show("البرنامج يعمل بالفعل.", "Quotation Studio", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            ApplicationConfiguration.Initialize();
            Application.ThreadException += (s, e) => MessageBox.Show(e.Exception.Message, "خطأ غير متوقع", MessageBoxButtons.OK, MessageBoxIcon.Error);
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                try { MessageBox.Show((e.ExceptionObject as Exception)?.Message ?? "خطأ غير متوقع", "Quotation Studio", MessageBoxButtons.OK, MessageBoxIcon.Error); } catch { }
            };
            Application.Run(new MainFormV4());
        }
    }
}
