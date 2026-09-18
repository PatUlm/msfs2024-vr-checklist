using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed partial class App : Application
{
    private ChecklistConnectionService? connectionService;
    private CompletionSoundPlayer? completionSound;

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
                AnnounceGroupCompletion(connectionService, viewModel, audioSettings);
            }
            window.AudioSettings = new AudioSettingsViewModel(
                audioSettings,
                () => OperatingSystem.IsWindows() ? AudioOutputDevices.Enumerate() : [],
                () => Task.Run(() => OperatingSystem.IsWindows() && completionSound is { } player
                    ? player.PlayAsync()
                    : Task.FromException(new InvalidOperationException("Audio is unavailable."))));
            if (audioSettings.LoadError is { } loadError) viewModel.ReportAudioError(loadError);

            desktop.Exit += (_, _) =>
            {
                connectionService.Dispose();

                if (OperatingSystem.IsWindows())
                {
                    completionSound?.Dispose();
                }
            };
            connectionService.Start();
        }

        base.OnFrameworkInitializationCompleted();
    }

    /*
     * Every newly completed group plays the clip once. The tracker runs on
     * the connection worker thread, where both service events are raised in
     * order. Audio failures, including a clip that fails to decode at start,
     * only surface in the status line and never block the snapshot handling.
     */
    [System.Runtime.Versioning.SupportedOSPlatform("windows")]
    private void AnnounceGroupCompletion(
        ChecklistConnectionService service,
        MainWindowViewModel viewModel,
        AudioOutputSettings audioSettings)
    {
        CompletionSoundPlayer player;

        try
        {
            player = new CompletionSoundPlayer(
                OpusClip.LoadEmbeddedCompletion(), () => audioSettings.Current.DeviceId,
                () => audioSettings.Current.RadioEnabled);
        }
        catch (Exception error)
        {
            viewModel.ReportAudioError(error.Message);
            return;
        }

        completionSound = player;
        var tracker = new ChecklistGroupCompletionTracker();

        // A lost connection may have swallowed a group end; the reconnect
        // snapshot then only sets the baseline instead of announcing late.
        service.ConnectionChanged += (status, _) =>
        {
            if (status != SimulatorConnectionStatus.Connected)
            {
                tracker.ResetBaseline();
            }
        };

        service.SnapshotReceived += (snapshot, isRepeated) =>
        {
            if (tracker.Observe(snapshot, isRepeated).Count == 0)
            {
                return;
            }

            player.PlayAsync().ContinueWith(
                playback => viewModel.ReportAudioError(
                    playback.Exception?.InnerException?.Message ?? "Playback failed."),
                CancellationToken.None,
                TaskContinuationOptions.OnlyOnFaulted,
                TaskScheduler.Default);
        };
    }
}
