using System.Globalization;
using Avalonia.Controls;
using Avalonia.Data.Converters;
using Avalonia.Input.Platform;
using Avalonia.Interactivity;
using Avalonia.Threading;

namespace VRChecklist.Companion;

public static class TextConverters
{
    public static readonly IValueConverter Uppercase = new FuncValueConverter<string?, string?>(
        text => text?.ToUpper(CultureInfo.InvariantCulture));
}

public sealed partial class ChecklistsWindow : Window
{
    private static readonly TimeSpan CopyFeedbackDuration = TimeSpan.FromSeconds(1.5);

    private readonly ChecklistsViewModel viewModel;
    private readonly DispatcherTimer copyFeedbackTimer;

    public ChecklistsWindow()
        : this(ChecklistCatalog.Load(), preferredChecklistId: null)
    {
    }

    public ChecklistsWindow(
        IReadOnlyList<ChecklistDocument> checklists,
        string? preferredChecklistId)
    {
        viewModel = new ChecklistsViewModel(checklists, preferredChecklistId);
        InitializeComponent();
        DataContext = viewModel;
        copyFeedbackTimer = new DispatcherTimer { Interval = CopyFeedbackDuration };
        copyFeedbackTimer.Tick += (_, _) =>
        {
            copyFeedbackTimer.Stop();
            CopyLabel.Text = "Copy";
        };
    }

    protected override void OnClosed(EventArgs args)
    {
        copyFeedbackTimer.Stop();
        base.OnClosed(args);
    }

    private async void OnCopyClick(object? sender, RoutedEventArgs args)
    {
        var clipboard = Clipboard;
        if (clipboard is null)
        {
            CopyLabel.Text = "Clipboard unavailable";
            copyFeedbackTimer.Start();
            return;
        }

        try
        {
            await clipboard.SetTextAsync(viewModel.ClipboardText);
            CopyLabel.Text = "Copied";
        }
        catch (Exception)
        {
            CopyLabel.Text = "Copy failed";
        }

        copyFeedbackTimer.Stop();
        copyFeedbackTimer.Start();
    }

    private void OnCloseClick(object? sender, RoutedEventArgs args) => Close();
}
