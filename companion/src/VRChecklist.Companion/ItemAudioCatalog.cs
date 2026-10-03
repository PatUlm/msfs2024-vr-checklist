using System.Text.Json;
using System.Text.RegularExpressions;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed class ItemAudioCatalog
{
    private readonly Dictionary<string, string> revisions = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> items = new(StringComparer.Ordinal);
    private readonly Dictionary<string, OpusClip> decoded = new(StringComparer.Ordinal);
    private readonly string noChecklistFile;

    private ItemAudioCatalog(string noChecklistFile) => this.noChecklistFile = noChecklistFile;

    public static ItemAudioCatalog Load()
    {
        using var stream = typeof(ItemAudioCatalog).Assembly.GetManifestResourceStream(
            "VRChecklist.Companion.audio.items-manifest.json")
            ?? throw new InvalidDataException("Item audio manifest is missing.");
        using var document = JsonDocument.Parse(stream);
        var catalog = new ItemAudioCatalog(OpusClip.ReadFixedFile("no-checklist"));
        foreach (var checklist in document.RootElement.GetProperty("checklists").EnumerateArray())
            catalog.revisions.Add(checklist.GetProperty("id").GetString()!, checklist.GetProperty("revision").GetString()!);
        foreach (var item in document.RootElement.GetProperty("items").EnumerateObject())
            catalog.items.Add(item.Name, item.Value.GetString()!);
        return catalog;
    }

    public string? Resolve(ChecklistStateSnapshot snapshot)
    {
        // A missing or ambiguous match; an empty identity is a flight reset.
        if (snapshot.Checklist is null)
            return snapshot.Aircraft.HasIdentity() ? noChecklistFile : null;
        if (snapshot.Checklist is not { } checklist || snapshot.ActiveGroup is not { } group ||
            snapshot.NextOpenItem is not { } item) return null;
        if (!revisions.TryGetValue(checklist.Id, out var revision) || revision != checklist.Revision)
            throw new InvalidDataException("Checklist audio does not match the EFB checklist revision. Update both apps.");
        return items.GetValueOrDefault($"{checklist.Id}/{group.Id}/{item.Id}");
    }

    // The clip names follow scripts/render-fixed-audio.mjs.
    public static string ResolvePhase(CompletedPhase phase) => OpusClip.ReadFixedFile(phase.Skipped
        ? "phase-skipped"
        : "phase-" + Regex.Replace(phase.Phase.ToLowerInvariant(), "[^a-z0-9]+", "-"));

    // Called by the serialized speech controller; decode each used file only once.
    public OpusClip GetClip(string file)
    {
        if (!decoded.TryGetValue(file, out var clip))
        {
            clip = OpusClip.LoadEmbedded("VRChecklist.Companion.audio." + file);
            decoded.Add(file, clip);
        }
        return clip;
    }
}
