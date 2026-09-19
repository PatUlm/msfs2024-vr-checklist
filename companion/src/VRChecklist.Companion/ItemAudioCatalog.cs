using System.Text.Json;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed class ItemAudioCatalog
{
    private readonly Dictionary<string, string> revisions = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> items = new(StringComparer.Ordinal);
    private readonly Dictionary<string, OpusClip> decoded = new(StringComparer.Ordinal);

    public static ItemAudioCatalog Load()
    {
        using var stream = typeof(ItemAudioCatalog).Assembly.GetManifestResourceStream(
            "VRChecklist.Companion.audio.items-manifest.json")
            ?? throw new InvalidDataException("Item audio manifest is missing.");
        using var document = JsonDocument.Parse(stream);
        var catalog = new ItemAudioCatalog();
        foreach (var checklist in document.RootElement.GetProperty("checklists").EnumerateArray())
            catalog.revisions.Add(checklist.GetProperty("id").GetString()!, checklist.GetProperty("revision").GetString()!);
        foreach (var item in document.RootElement.GetProperty("items").EnumerateObject())
            catalog.items.Add(item.Name, item.Value.GetString()!);
        return catalog;
    }

    public string? Resolve(ChecklistStateSnapshot snapshot)
    {
        if (snapshot.Checklist is not { } checklist || snapshot.ActiveGroup is not { } group ||
            snapshot.NextOpenItem is not { } item) return null;
        if (!revisions.TryGetValue(checklist.Id, out var revision) || revision != checklist.Revision)
            throw new InvalidDataException("Checklist audio does not match the EFB checklist revision. Update both apps.");
        return items.GetValueOrDefault($"{checklist.Id}/{group.Id}/{item.Id}");
    }

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
