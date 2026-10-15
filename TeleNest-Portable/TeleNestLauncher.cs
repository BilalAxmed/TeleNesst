// ===============================================================================
// TeleNest Native Windows Desktop Launcher
// Developed by: Bilal Ahmed (TeleNest ICT Logistics & Telecom Engineering)
// Certified for Windows 10 & Windows 11 Offline Environments
// ===============================================================================
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

[assembly: AssemblyTitle("TeleNest ICT Enterprise")]
[assembly: AssemblyDescription("Warehouse & ICT Activity Inventory Management System")]
[assembly: AssemblyCompany("TeleNest ICT Logistics")]
[assembly: AssemblyProduct("TeleNest")]
[assembly: AssemblyCopyright("Copyright © Bilal Ahmed")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace TeleNest
{
    static class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                SetProcessDPIAware();
            }
            catch { }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string currentDir = AppDomain.CurrentDomain.BaseDirectory;
            string appFile = Path.Combine(currentDir, "TeleNest.html");
            if (!File.Exists(appFile)) appFile = Path.Combine(currentDir, "app.html");
            if (!File.Exists(appFile)) appFile = Path.Combine(currentDir, "TeleNest-Offline-SingleFile.html");

            if (!File.Exists(appFile))
            {
                MessageBox.Show(
                    "Cannot locate application files in:\n" + currentDir + "\n\nPlease ensure all files from TeleNest-Portable-Windows11 are kept together in this folder.",
                    "TeleNest - File Not Found",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Prefer launching in Microsoft Edge App Mode (--app)
            string edgePath64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft\\Edge\\Application\\msedge.exe");
            string edgePath86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft\\Edge\\Application\\msedge.exe");
            string chromePath64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google\\Chrome\\Application\\chrome.exe");
            string chromePath86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google\\Chrome\\Application\\chrome.exe");

            string selectedBrowser = null;
            if (File.Exists(edgePath86)) selectedBrowser = edgePath86;
            else if (File.Exists(edgePath64)) selectedBrowser = edgePath64;
            else if (File.Exists(chromePath64)) selectedBrowser = chromePath64;
            else if (File.Exists(chromePath86)) selectedBrowser = chromePath86;

            string appProfile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TeleNest", "AppProfile");
            try { Directory.CreateDirectory(appProfile); } catch { }
            string appUri = new Uri(appFile).AbsoluteUri;

            try
            {
                if (selectedBrowser != null)
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = selectedBrowser,
                        Arguments = string.Format("--app="{0}" --user-data-dir="{1}" --allow-file-access-from-files --test-type --window-size=1440,900", appUri, appProfile),
                        UseShellExecute = false
                    };
                    Process.Start(psi);
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(new ProcessStartInfo(appFile) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error launching TeleNest application:\n" + ex.Message,
                    "TeleNest Launcher Exception",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
        }
    }
}
