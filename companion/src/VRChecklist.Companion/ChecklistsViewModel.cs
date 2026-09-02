using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace VRChecklist.Companion;

public sealed record ChecklistDetailLine(string? Label, string Text)
{
    public bool HasLabel => Label is not null;
}

public sealed class ChecklistItemViewModel
{
    public ChecklistItemViewModel(ChecklistItemDocument item)
    {
        Challenge = item.Challenge;
        Response = item.Response;
        KindLabel = item.Kind switch
        {
            "verify" => "Verify",
            "communication" => "ATC",
            "optional" => "Optional",
            _ => null,
        };

        var details = new List<ChecklistDetailLine>();
        if (item.Condition is not null)
        {
            details.Add(new("Condition:", item.Condition));
        }

        foreach (var alternative in item.Alternatives ?? [])
        {
            details.Add(new($"Alternative · {alternative.When}:", alternative.Response));
        }

        foreach (var note in item.Notes ?? [])
        {
            details.Add(new("Note:", note));
        }

        if (item.NeedsReview == true && item.ReviewNote is not null)
        {
            details.Add(new("Review required:", item.ReviewNote));
        }

        Details = details;
    }

    public string Challenge { get; }

    public string Response { get; }

    public string? KindLabel { get; }

    public bool HasKind => KindLabel is not null;

    public IReadOnlyList<ChecklistDetailLine> Details { get; }

    public bool HasDetails => Details.Count > 0;
}

public sealed class ChecklistSectionViewModel
{
    public ChecklistSectionViewModel(ChecklistSectionDocument section)
    {
        Title = section.Title;
        Items = section.Items.Select(item => new ChecklistItemViewModel(item)).ToArray();
    }

    public string Title { get; }

    public IReadOnlyList<ChecklistItemViewModel> Items { get; }
}

public sealed class ChecklistsViewModel : INotifyPropertyChanged
{
    private ChecklistDocument selectedChecklist;
    private IReadOnlyList<ChecklistSectionViewModel> sections;
    private string revision;

    public ChecklistsViewModel(
        IReadOnlyList<ChecklistDocument> checklists,
        string? preferredChecklistId)
    {
        if (checklists.Count == 0)
        {
            throw new ArgumentException("At least one checklist is required.", nameof(checklists));
        }

        Checklists = checklists;
        selectedChecklist = checklists.FirstOrDefault(checklist =>
            string.Equals(checklist.Id, preferredChecklistId, StringComparison.Ordinal))
            ?? checklists[0];
        sections = BuildSections(selectedChecklist);
        revision = FormatRevision(selectedChecklist);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    public IReadOnlyList<ChecklistDocument> Checklists { get; }

    public ChecklistDocument SelectedChecklist
    {
        get => selectedChecklist;
        set
        {
            if (value is null || ReferenceEquals(selectedChecklist, value))
            {
                return;
            }

            selectedChecklist = value;
            OnPropertyChanged();
            Sections = BuildSections(value);
            Revision = FormatRevision(value);
        }
    }

    public IReadOnlyList<ChecklistSectionViewModel> Sections
    {
        get => sections;
        private set
        {
            sections = value;
            OnPropertyChanged();
        }
    }

    public string Revision
    {
        get => revision;
        private set
        {
            if (revision == value)
            {
                return;
            }

            revision = value;
            OnPropertyChanged();
        }
    }

    /// <summary>
    /// Markdown-like text of the selected checklist for the clipboard.
    /// </summary>
    public string ClipboardText =>
        ChecklistTextFormatter.ToPlainText(ChecklistTextFormatter.Format(selectedChecklist));

    private static IReadOnlyList<ChecklistSectionViewModel> BuildSections(
        ChecklistDocument checklist) =>
        checklist.Sections.Select(section => new ChecklistSectionViewModel(section)).ToArray();

    private static string FormatRevision(ChecklistDocument checklist) =>
        $"Revision {checklist.Revision}";

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
