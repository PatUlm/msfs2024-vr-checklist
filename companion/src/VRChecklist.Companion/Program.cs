using Avalonia;
using Velopack;

namespace VRChecklist.Companion;

internal static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        // Must run first to handle installer hooks. Downloaded updates are
        // only applied after the user confirmed them (ADR 0012).
        VelopackApp.Build()
            .SetAutoApplyOnStartup(false)
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
