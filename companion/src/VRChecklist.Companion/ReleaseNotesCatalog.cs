using System.Globalization;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace VRChecklist.Companion;

public sealed record ReleaseNotesDocument(
    int SchemaVersion,
    string CompanionSince,
    IReadOnlyList<ReleaseNotesRelease> Releases);

public sealed record ReleaseNotesRelease(
    string Version,
    string Date,
    string Highlight,
    IReadOnlyList<string> Features,
    IReadOnlyList<string> Fixes);

public static partial class ReleaseNotesCatalog
{
    private const string ResourceName = "VRChecklist.Companion.release-notes.json";

    public static ReleaseNotesDocument Load()
    {
        using var stream = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream(ResourceName)
            ?? throw new InvalidDataException(
                $"Embedded release notes are missing: {ResourceName}");
        var document = JsonSerializer.Deserialize<ReleaseNotesDocument>(
            stream,
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            }) ?? throw new InvalidDataException("Embedded release notes are empty.");

        Validate(document);
        return document;
    }

    private static void Validate(ReleaseNotesDocument document)
    {
        if (document.SchemaVersion != 1 || document.Releases.Count == 0)
        {
            throw new InvalidDataException("Embedded release notes use an unsupported format.");
        }

        var versions = new HashSet<string>(StringComparer.Ordinal);
        foreach (var release in document.Releases)
        {
            if (
                !SemanticVersion().IsMatch(release.Version) ||
                !DateOnly.TryParseExact(
                    release.Date,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out _) ||
                string.IsNullOrWhiteSpace(release.Highlight) ||
                release.Features is null ||
                release.Fixes is null ||
                release.Features.Count + release.Fixes.Count == 0 ||
                release.Features.Concat(release.Fixes).Any(string.IsNullOrWhiteSpace) ||
                !versions.Add(release.Version))
            {
                throw new InvalidDataException(
                    $"Embedded release notes contain an invalid entry for {release.Version}.");
            }
        }
    }

    [GeneratedRegex(@"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")]
    private static partial Regex SemanticVersion();
}
