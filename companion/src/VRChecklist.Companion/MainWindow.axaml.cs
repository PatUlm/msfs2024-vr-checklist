using Avalonia.Controls;
using Avalonia.Interactivity;

namespace VRChecklist.Companion;

public sealed partial class MainWindow : Window
{
    private readonly ReleaseNotesDocument releaseNotes;
    private ReleaseNotesWindow? releaseNotesWindow;

    public MainWindow()
        : this(ReleaseNotesCatalog.Load())
    {
    }

    public MainWindow(ReleaseNotesDocument releaseNotes)
    {
        this.releaseNotes = releaseNotes;
        InitializeComponent();
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
}
