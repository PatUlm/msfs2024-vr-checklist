using Avalonia.Controls;
using Avalonia.Interactivity;

namespace VRChecklist.Companion;

public sealed partial class ReleaseNotesWindow : Window
{
    public ReleaseNotesWindow()
        : this(ReleaseNotesCatalog.Load())
    {
    }

    public ReleaseNotesWindow(ReleaseNotesDocument document)
    {
        InitializeComponent();
        DataContext = new ReleaseNotesViewModel(document);
    }

    private void OnCloseClick(object? sender, RoutedEventArgs args) => Close();
}
