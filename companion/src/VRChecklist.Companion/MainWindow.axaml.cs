using Avalonia.Controls;
using Avalonia.Interactivity;

namespace VRChecklist.Companion;

public sealed partial class MainWindow : Window
{
    private readonly ReleaseNotesDocument releaseNotes;
    private readonly IReadOnlyList<ChecklistDocument> checklists;
    private ReleaseNotesWindow? releaseNotesWindow;
    private ChecklistsWindow? checklistsWindow;

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
