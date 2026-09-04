using System.Diagnostics;
using System.Globalization;
using Avalonia.Controls;
using Avalonia.Data.Converters;
using Avalonia.Input.Platform;
using Avalonia.Interactivity;
using Avalonia.Platform.Storage;
using Avalonia.Threading;

namespace VRChecklist.Companion;

public static class TextConverters
{
    public static readonly IValueConverter Uppercase = new FuncValueConverter<string?, string?>(
        text => text?.ToUpper(CultureInfo.InvariantCulture));
}

public sealed partial class ChecklistsWindow : Window
{
    private const string CopyIdleLabel = "Copy";
    private const string PdfIdleLabel = "PDF";
    private static readonly TimeSpan FeedbackDuration = TimeSpan.FromSeconds(1.5);

    private readonly ChecklistsViewModel viewModel;
    private readonly DispatcherTimer feedbackTimer;

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
        feedbackTimer = new DispatcherTimer { Interval = FeedbackDuration };
        feedbackTimer.Tick += (_, _) =>
        {
            feedbackTimer.Stop();
            CopyLabel.Text = CopyIdleLabel;
            PdfLabel.Text = PdfIdleLabel;
        };
    }

    protected override void OnClosed(EventArgs args)
    {
        feedbackTimer.Stop();
        base.OnClosed(args);
    }

    private async void OnCopyClick(object? sender, RoutedEventArgs args)
    {
        var clipboard = Clipboard;
        if (clipboard is null)
        {
            ShowFeedback(CopyLabel, "Clipboard unavailable");
            return;
        }

        try
        {
            await clipboard.SetTextAsync(viewModel.ClipboardText);
            ShowFeedback(CopyLabel, "Copied");
        }
        catch (Exception)
        {
            ShowFeedback(CopyLabel, "Copy failed");
        }
    }

    private async void OnPdfClick(object? sender, RoutedEventArgs args)
    {
        var checklist = viewModel.SelectedChecklist;
        var file = await StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions
        {
            Title = "Save checklist as PDF",
            SuggestedFileName = ChecklistPdfRenderer.SuggestFileName(checklist),
            DefaultExtension = "pdf",
            ShowOverwritePrompt = true,
            FileTypeChoices = [FilePickerFileTypes.Pdf],
        });
        if (file is null)
        {
            return;
        }

        try
        {
            using var buffer = new MemoryStream();
            ChecklistPdfRenderer.Render(checklist, buffer);
            buffer.Position = 0;
            await using var output = await file.OpenWriteAsync();
            await buffer.CopyToAsync(output);
        }
        catch (Exception)
        {
            ShowFeedback(PdfLabel, "PDF failed");
            return;
        }

        ShowFeedback(PdfLabel, OpenWithDefaultHandler(file) ? "Saved" : "Saved, open failed");
    }

    private static bool OpenWithDefaultHandler(IStorageFile file)
    {
        var path = file.TryGetLocalPath();
        if (path is null)
        {
            return false;
        }

        try
        {
            using var process = Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private void ShowFeedback(TextBlock label, string text)
    {
        label.Text = text;
        feedbackTimer.Stop();
        feedbackTimer.Start();
    }

    private void OnCloseClick(object? sender, RoutedEventArgs args) => Close();
}
