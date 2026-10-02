using System.Text.Json;

namespace VRChecklist.Companion;

/* Consent to the online update check; null until the player has decided. */
public sealed class UpdateCheckSettings
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string path;
    public bool? Enabled { get; private set; }
    public string? LoadError { get; private set; }

    public UpdateCheckSettings(string? path = null)
    {
        this.path = path ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "VRChecklist", "update-check.json");
        try
        {
            using var saved = JsonDocument.Parse(File.ReadAllText(this.path));
            if (saved.RootElement.ValueKind != JsonValueKind.Object ||
                !saved.RootElement.TryGetProperty("enabled", out var enabled) ||
                enabled.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                throw new JsonException("Invalid update check setting.");
            Enabled = enabled.GetBoolean();
        }
        catch (Exception error) when (error is FileNotFoundException or DirectoryNotFoundException) { }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or JsonException)
        {
            LoadError = "Could not load the update setting. Choose again to save it.";
        }
    }

    public void Save(bool enabled)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        var temporaryPath = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllText(temporaryPath, JsonSerializer.Serialize(new { enabled }, JsonOptions));
            File.Move(temporaryPath, path, overwrite: true);
            Enabled = enabled;
            LoadError = null;
        }
        finally
        {
            if (File.Exists(temporaryPath)) File.Delete(temporaryPath);
        }
    }
}
