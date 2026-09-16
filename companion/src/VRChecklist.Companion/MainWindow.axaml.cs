using Avalonia.Controls;
using Avalonia.Input.Platform;
using Avalonia.Interactivity;
using Avalonia.Threading;

namespace VRChecklist.Companion;

public sealed partial class MainWindow : Window
{
    private readonly ReleaseNotesDocument releaseNotes;
    private readonly IReadOnlyList<ChecklistDocument> checklists;
    private ReleaseNotesWindow? releaseNotesWindow;
    private ChecklistsWindow? checklistsWindow;
    private SettingsWindow? settingsWindow;
    public AudioSettingsViewModel? AudioSettings { get; set; }
    private readonly DispatcherTimer copyFeedbackTimer;

    public MainWindow()
        : this(ReleaseNotesCatalog.Load(), ChecklistCatalog.Load())
    {
    }

    public MainWindow(
        ReleaseNotesDocument releaseNotes,
        IReadOnlyList<ChecklistDocument> checklists)
    {
        this.releaseNotes = releaseNotes;
        this.checklists = checklists;
        InitializeComponent();
        copyFeedbackTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.5) };
        copyFeedbackTimer.Tick += (_, _) =>
        {
            copyFeedbackTimer.Stop();
            CopyAircraftIdentityLabel.Text = "Copy";
        };
    }

    protected override void OnClosed(EventArgs args)
    {
        copyFeedbackTimer.Stop();
        base.OnClosed(args);
    }

    private async void OnSettingsClick(object? sender, RoutedEventArgs args)
    {
        if (settingsWindow is not null)
        {
            settingsWindow.Activate();
            return;
        }
        if (AudioSettings is null) return;
        var window = new SettingsWindow(AudioSettings);
        settingsWindow = window;
        try
        {
            await window.ShowDialog(this);
        }
        finally
        {
            if (ReferenceEquals(settingsWindow, window)) settingsWindow = null;
        }
    }

    private async void OnCopyAircraftIdentityClick(object? sender, RoutedEventArgs args)
    {
        if (DataContext is not MainWindowViewModel { CanCopyAircraftIdentity: true } viewModel)
        {
            return;
        }

        var text = viewModel.AircraftIdentityClipboardText;
        var clipboard = Clipboard;
        if (clipboard is null)
        {
            ShowCopyFeedback("Clipboard unavailable");
            return;
        }

        try
        {
            await clipboard.SetTextAsync(text);
            ShowCopyFeedback("Copied");
        }
        catch (Exception)
        {
            ShowCopyFeedback("Copy failed");
        }
    }

    private void ShowCopyFeedback(string text)
    {
        CopyAircraftIdentityLabel.Text = text;
        copyFeedbackTimer.Stop();
        copyFeedbackTimer.Start();
    }

    private async void OnReleaseNotesClick(object? sender, RoutedEventArgs args)
    {
        if (releaseNotesWindow is not null)
        {
            releaseNotesWindow.Activate();
            return;
        }

        var window = new ReleaseNotesWindow(releaseNotes);
        releaseNotesWindow = window;
        try
        {
            await window.ShowDialog(this);
        }
        finally
        {
            if (ReferenceEquals(releaseNotesWindow, window))
            {
                releaseNotesWindow = null;
            }
        }
    }

    private void OnChecklistsClick(object? sender, RoutedEventArgs args)
    {
        if (checklistsWindow is not null)
        {
            checklistsWindow.Activate();
            return;
        }

        var preferredChecklistId = (DataContext as MainWindowViewModel)?.ChecklistId;
        var window = new ChecklistsWindow(checklists, preferredChecklistId);
        checklistsWindow = window;
        window.Closed += (_, _) =>
        {
            if (ReferenceEquals(checklistsWindow, window))
            {
                checklistsWindow = null;
            }
        };
        window.Show(this);
    }
}
