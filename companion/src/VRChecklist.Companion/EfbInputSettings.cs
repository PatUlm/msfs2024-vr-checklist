using System.Text.Json;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed class EfbInputSettings
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string path;
    public IReadOnlyList<ConfirmationActionSetting> Actions { get; }
    public bool Enabled { get; private set; }
    public string SelectedEvent { get; private set; }
    public string? LoadError { get; private set; }

    public EfbInputSettings(string? path = null)
    {
        this.path = path ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "VRChecklist", "efb-input.json");
        using var catalog = typeof(EfbInputSettings).Assembly.GetManifestResourceStream("VRChecklist.confirmation-actions.json")
            ?? throw new InvalidDataException("Confirmation action catalog is missing.");
        Actions = JsonSerializer.Deserialize<ConfirmationActionSetting[]>(catalog, JsonOptions)
            ?? throw new InvalidDataException("Confirmation action catalog is empty.");
        SelectedEvent = (Actions.FirstOrDefault(action => action.Enabled) ?? Actions.First()).Event;
        Enabled = Actions.Any(action => action.Enabled);
        try
        {
            using var saved = JsonDocument.Parse(File.ReadAllText(this.path));
            if (saved.RootElement.ValueKind != JsonValueKind.Object) throw new JsonException("Invalid EFB input settings.");
            if (saved.RootElement.TryGetProperty("selectedEvent", out var selected))
            {
                if (selected.ValueKind != JsonValueKind.String ||
                    !Actions.Any(action => action.Event == selected.GetString()) ||
                    !saved.RootElement.TryGetProperty("enabled", out var enabled) ||
                    enabled.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                    throw new JsonException("Invalid EFB keybinding selection.");
                SelectedEvent = selected.GetString()!;
                Enabled = enabled.GetBoolean();
            }
            else
            {
                // Preserve the choice made in the initial per-action development build.
                var previous = saved.RootElement.Deserialize<Dictionary<string, bool>>(JsonOptions)!;
                var enabledAction = Actions.FirstOrDefault(action => previous.GetValueOrDefault(action.Event, action.Enabled));
                SelectedEvent = (enabledAction ?? Actions.First()).Event;
                Enabled = enabledAction is not null;
            }
        }
        catch (Exception error) when (error is FileNotFoundException or DirectoryNotFoundException) { }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or JsonException)
        {
            LoadError = "Could not load EFB input settings. Select the desired setting again to save and apply it.";
        }
    }

    public void Save(bool enabled, string eventName)
    {
        if (!Actions.Any(action => action.Event == eventName)) throw new ArgumentException("Unknown confirmation action.");
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        var temporaryPath = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllText(temporaryPath, JsonSerializer.Serialize(new { enabled, selectedEvent = eventName }, JsonOptions));
            File.Move(temporaryPath, path, overwrite: true);
            Enabled = enabled;
            SelectedEvent = eventName;
            LoadError = null;
        }
        finally
        {
            if (File.Exists(temporaryPath)) File.Delete(temporaryPath);
        }
    }
}
