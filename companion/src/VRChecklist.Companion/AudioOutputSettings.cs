using System.Text.Json;

namespace VRChecklist.Companion;

public sealed record AudioOutputPreference(
    string? DeviceId,
    string? DeviceName,
    IReadOnlyList<string>? RecentDeviceIds = null);

public sealed class AudioOutputSettings
{
    private readonly string path;
    private AudioOutputPreference current = new(null, null);

    public AudioOutputSettings(string? path = null)
    {
        this.path = path ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "VRChecklist", "audio-output.json");
        try
        {
            var saved = JsonSerializer.Deserialize<AudioOutputPreference>(File.ReadAllText(this.path))
                ?? throw new JsonException("Empty audio settings.");
            current = WithHistory(saved, saved.RecentDeviceIds ?? []);
        }
        catch (Exception error) when (error is FileNotFoundException or DirectoryNotFoundException)
        {
            // First launch uses the Windows default output.
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or JsonException)
        {
            LoadError = "Could not load audio settings. Using Windows default.";
        }
    }

    public AudioOutputPreference Current => Volatile.Read(ref current);
    public string? LoadError { get; private set; }

    public void Save(AudioOutputPreference preference)
    {
        var updated = WithHistory(preference, Current.RecentDeviceIds ?? []);
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        var temporaryPath = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllText(temporaryPath, JsonSerializer.Serialize(updated));
            File.Move(temporaryPath, path, overwrite: true);
            Volatile.Write(ref current, updated);
            LoadError = null;
        }
        finally
        {
            if (File.Exists(temporaryPath))
            {
                File.Delete(temporaryPath);
            }
        }
    }

    private static AudioOutputPreference WithHistory(
        AudioOutputPreference preference, IEnumerable<string> history)
    {
        var deviceId = string.IsNullOrWhiteSpace(preference.DeviceId) ? null : preference.DeviceId;
        var recentIds = history.Prepend(deviceId ?? string.Empty)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        return new(deviceId, deviceId is null ? null : preference.DeviceName, recentIds);
    }
}
