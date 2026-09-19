using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed partial class App : Application
{
    private ChecklistConnectionService? connectionService;
    private CompletionSoundPlayer? completionSound;
    private ChecklistSpeechController? speech;

    public override void Initialize() => AvaloniaXamlLoader.Load(this);

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            connectionService = new ChecklistConnectionService();
            var viewModel = new MainWindowViewModel(connectionService);
            var audioSettings = new AudioOutputSettings();
            var window = new MainWindow(
                ReleaseNotesCatalog.Load(),
                ChecklistCatalog.Load())
            {
                DataContext = viewModel,
            };
            desktop.MainWindow = window;

            if (OperatingSystem.IsWindows())
            {
                ConfigureSpeech(connectionService, viewModel, audioSettings);
            }
            window.AudioSettings = new AudioSettingsViewModel(
                audioSettings,
                () => OperatingSystem.IsWindows() ? AudioOutputDevices.Enumerate() : [],
                () => Task.Run(() => speech is { } controller
                    ? controller.TestAsync()
                    : Task.FromException(new InvalidOperationException("Audio is unavailable."))));
            window.AudioSettings.ReadItemsChanged += value => speech?.SetEnabled(value);
            if (audioSettings.LoadError is { } loadError) viewModel.ReportAudioError(loadError);

            desktop.Exit += (_, _) =>
            {
                connectionService.Dispose();
                speech?.Dispose();

                if (OperatingSystem.IsWindows())
                {
                    completionSound?.Dispose();
                }
            };
            connectionService.Start();
        }

        base.OnFrameworkInitializationCompleted();
    }

    [System.Runtime.Versioning.SupportedOSPlatform("windows")]
    private void ConfigureSpeech(
        ChecklistConnectionService service,
        MainWindowViewModel viewModel,
        AudioOutputSettings audioSettings)
    {
        try
        {
            var completion = OpusClip.LoadEmbeddedCompletion();
            var catalog = ItemAudioCatalog.Load();
            var player = new CompletionSoundPlayer(
                completion, () => audioSettings.Current.DeviceId,
                () => audioSettings.Current.RadioEnabled);
            completionSound = player;
            var controller = new ChecklistSpeechController(
                file => player.PlayAsync(file is null ? completion : catalog.GetClip(file)),
                player.Stop, catalog.Resolve, viewModel.ReportAudioError,
                audioSettings.Current.ReadItemsEnabled);
            speech = controller;
            service.ConnectionChanged += (status, _) =>
            {
                if (status != SimulatorConnectionStatus.Connected) controller.Disconnect();
            };
            service.ProtocolError += _ => controller.Disconnect();
            service.SnapshotReceived += controller.Observe;
        }
        catch (Exception error)
        {
            viewModel.ReportAudioError(error.Message);
        }
    }
}
