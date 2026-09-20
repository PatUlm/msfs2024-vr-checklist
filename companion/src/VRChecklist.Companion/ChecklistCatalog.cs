using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace VRChecklist.Companion;

public sealed record ChecklistDocument(
    [property: JsonRequired] string Id,
    [property: JsonRequired] string Title,
    [property: JsonRequired] string Revision,
    [property: JsonRequired] IReadOnlyList<ChecklistSectionDocument> Sections);

public sealed record ChecklistSectionDocument(
    [property: JsonRequired] string Id,
    [property: JsonRequired] string Title,
    [property: JsonRequired] string Phase,
    [property: JsonRequired] IReadOnlyList<ChecklistItemDocument> Items);

public sealed record ChecklistItemDocument(
    [property: JsonRequired] string Id,
    [property: JsonRequired] string Challenge,
    [property: JsonRequired] string Response,
    [property: JsonRequired] string Kind,
    string? Condition,
    IReadOnlyList<ChecklistAlternativeDocument>? Alternatives,
    IReadOnlyList<string>? Notes,
    bool? NeedsReview,
    string? ReviewNote);

public sealed record ChecklistAlternativeDocument(
    [property: JsonRequired] string When,
    [property: JsonRequired] string Response);

/// <summary>
/// Loads the checklist JSON files embedded from <c>checklists/data/</c>. The
/// JSON files remain the only source of checklist content; the companion only
/// renders them.
/// </summary>
public static class ChecklistCatalog
{
    public const string ResourcePrefix = "VRChecklist.Companion.checklists.";

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static IReadOnlyList<ChecklistDocument> Load() =>
        Load(typeof(ChecklistCatalog).Assembly);

    public static IReadOnlyList<ChecklistDocument> Load(Assembly assembly)
    {
        var documents = new List<ChecklistDocument>();
        foreach (var resourceName in assembly.GetManifestResourceNames())
        {
            if (!resourceName.StartsWith(ResourcePrefix, StringComparison.Ordinal))
            {
                continue;
            }

            using var stream = assembly.GetManifestResourceStream(resourceName)
                ?? throw new InvalidDataException(
                    $"Embedded checklist is missing: {resourceName}");
            documents.Add(Parse(stream, resourceName));
        }

        if (documents.Count == 0)
        {
            throw new InvalidDataException("No embedded checklists were found.");
        }

        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var document in documents)
        {
            if (!ids.Add(document.Id))
            {
                throw new InvalidDataException(
                    $"Embedded checklists contain the duplicate id '{document.Id}'.");
            }
        }

        return Sort(documents);
    }

    public static ChecklistDocument Parse(Stream stream, string sourceName)
    {
        ChecklistDocument? document;
        try
        {
            document = JsonSerializer.Deserialize<ChecklistDocument>(stream, SerializerOptions);
        }
        catch (JsonException error)
        {
            throw new InvalidDataException(
                $"Embedded checklist '{sourceName}' is not valid: {error.Message}",
                error);
        }

        if (document is null)
        {
            throw new InvalidDataException($"Embedded checklist '{sourceName}' is empty.");
        }

        Validate(document, sourceName);
        return document;
    }

    public static IReadOnlyList<ChecklistDocument> Sort(
        IEnumerable<ChecklistDocument> documents) =>
        documents
            .OrderBy(document => document.Title, StringComparer.OrdinalIgnoreCase)
            .ThenBy(document => document.Id, StringComparer.Ordinal)
            .ToArray();

    private static void Validate(ChecklistDocument document, string sourceName)
    {
        if (
            string.IsNullOrWhiteSpace(document.Id) ||
            string.IsNullOrWhiteSpace(document.Title) ||
            string.IsNullOrWhiteSpace(document.Revision) ||
            document.Sections.Count == 0 ||
            document.Sections.Any(section =>
                string.IsNullOrWhiteSpace(section.Title) ||
                string.IsNullOrWhiteSpace(section.Phase) ||
                section.Items.Count == 0 ||
                section.Items.Any(item =>
                    string.IsNullOrWhiteSpace(item.Challenge) ||
                    string.IsNullOrWhiteSpace(item.Response) ||
                    string.IsNullOrWhiteSpace(item.Kind))))
        {
            throw new InvalidDataException(
                $"Embedded checklist '{sourceName}' is missing required content.");
        }
    }
}
