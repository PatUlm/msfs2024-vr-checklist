using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Avalonia.Threading;
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
            var updates = new UpdateViewModel(
                new UpdateCheckSettings(),
                VelopackCompanionUpdater.CreateForInstallation(() => desktop.Shutdown()),
                MainWindowViewModel.ReadCompanionVersion());
            var viewModel = new MainWindowViewModel(connectionService, updates);
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
            var audioViewModel = new AudioSettingsViewModel(
                audioSettings,
                () => OperatingSystem.IsWindows() ? AudioOutputDevices.Enumerate() : [],
                () => Task.Run(() => speech is { } controller
                    ? controller.TestAsync()
                    : Task.FromException(new InvalidOperationException("Audio is unavailable."))));
            audioViewModel.ReadItemsChanged += value => speech?.SetEnabled(value);
            var efbViewModel = new EfbSettingsViewModel(new EfbInputSettings(), connectionService.ApplyEfbSettingsAsync);
            window.Settings = new SettingsViewModel(audioViewModel, efbViewModel, updates);
            connectionService.ConnectionChanged += (_, _) => Dispatcher.UIThread.Post(efbViewModel.Disconnect);
            connectionService.ProtocolError += _ => Dispatcher.UIThread.Post(efbViewModel.Disconnect);
            connectionService.SnapshotReceived += (snapshot, _) =>
                Dispatcher.UIThread.Post(() => efbViewModel.ObserveInstance(snapshot.InstanceId));
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
            _ = updates.CheckAsync();
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
                audioSettings.Current.ReadItemsEnabled, ItemAudioCatalog.ResolvePhase);
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
