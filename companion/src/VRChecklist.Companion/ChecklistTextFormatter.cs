using System.Text;

namespace VRChecklist.Companion;

public enum ChecklistTextLineStyle
{
    Title,
    Subtitle,
    Heading,
    Item,
    Detail,
    Blank,
}

public sealed record ChecklistTextLine(string Text, ChecklistTextLineStyle Style);

/// <summary>
/// Renders a checklist as Markdown-like plain text. The same lines feed the
/// on-screen view and the clipboard, so a copied checklist can be pasted back
/// as a review template without reformatting.
/// </summary>
public static class ChecklistTextFormatter
{
    private const string DetailIndent = "  ";

    public static IReadOnlyList<ChecklistTextLine> Format(ChecklistDocument checklist)
    {
        var lines = new List<ChecklistTextLine>
        {
            new($"# {checklist.Title}", ChecklistTextLineStyle.Title),
            new($"Revision {checklist.Revision}", ChecklistTextLineStyle.Subtitle),
        };

        foreach (var section in checklist.Sections)
        {
            lines.Add(new(string.Empty, ChecklistTextLineStyle.Blank));
            lines.Add(new($"## {section.Title} [{section.Phase}]", ChecklistTextLineStyle.Heading));
            lines.Add(new(string.Empty, ChecklistTextLineStyle.Blank));

            foreach (var item in section.Items)
            {
                lines.Add(new(FormatItem(item), ChecklistTextLineStyle.Item));
                if (item.Condition is not null)
                {
                    lines.Add(Detail(item.Condition));
                }

                foreach (var alternative in item.Alternatives ?? [])
                {
                    lines.Add(Detail($"Alternative · {alternative.When}: {alternative.Response}"));
                }

                foreach (var note in item.Notes ?? [])
                {
                    lines.Add(Detail(note));
                }

                if (item.NeedsReview == true && item.ReviewNote is not null)
                {
                    lines.Add(Detail($"Review required: {item.ReviewNote}"));
                }
            }
        }

        return lines;
    }

    public static string ToPlainText(IEnumerable<ChecklistTextLine> lines)
    {
        var builder = new StringBuilder();
        foreach (var line in lines)
        {
            builder.Append(line.Text).Append('\n');
        }

        return builder.ToString();
    }

    private static string FormatItem(ChecklistItemDocument item)
    {
        var kindLabel = item.Kind switch
        {
            "verify" => "[Verify] ",
            "communication" => "[ATC] ",
            "optional" => "[Optional] ",
            _ => string.Empty,
        };
        return $"- {kindLabel}{item.Challenge}...{item.Response}";
    }

    private static ChecklistTextLine Detail(string text) =>
        new(DetailIndent + text, ChecklistTextLineStyle.Detail);
}
