using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;

namespace VRChecklist.Companion;

public sealed partial class App : Application
{
    private ChecklistConnectionService? connectionService;

    public override void Initialize() => AvaloniaXamlLoader.Load(this);

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            connectionService = new ChecklistConnectionService();
            var viewModel = new MainWindowViewModel(connectionService);
            desktop.MainWindow = new MainWindow
            {
                DataContext = viewModel,
            };
            desktop.Exit += (_, _) => connectionService.Dispose();
            connectionService.Start();
        }

        base.OnFrameworkInitializationCompleted();
    }
}
