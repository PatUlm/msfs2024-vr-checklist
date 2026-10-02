using Avalonia;
using Velopack;

namespace VRChecklist.Companion;

internal static class Program
{
    /// <summary>Version just installed by a confirmed update, for the EFB reminder.</summary>
    public static string? UpdatedVersion { get; private set; }

    [STAThread]
    public static void Main(string[] args)
    {
        // Must run first to handle installer hooks. Downloaded updates are
        // only applied after the user confirmed them (ADR 0012).
        VelopackApp.Build()
            .SetAutoApplyOnStartup(false)
            .OnRestarted(version => UpdatedVersion = version.ToString())
            .Run();
        BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
    }

    public static AppBuilder BuildAvaloniaApp() =>
        AppBuilder.Configure<App>()
            .UseWin32()
            .UseSkia()
            .UseHarfBuzz()
            .LogToTrace();
}
