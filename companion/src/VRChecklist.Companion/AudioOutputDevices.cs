using System.Runtime.Versioning;
using NAudio.CoreAudioApi;

namespace VRChecklist.Companion;

public sealed record AudioOutputDevice(string? Id, string Name, bool IsAvailable = true)
{
    public string DisplayName => IsAvailable ? Name : $"{Name} (unavailable)";
}

public static class AudioOutputDevices
{
    [SupportedOSPlatform("windows")]
    public static IReadOnlyList<AudioOutputDevice> Enumerate()
    {
        using var enumerator = new MMDeviceEnumerator();
        using var endpoints = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);
        var devices = new List<AudioOutputDevice>();
        foreach (var endpoint in endpoints)
        {
            using (endpoint)
            {
                devices.Add(new(endpoint.ID, endpoint.FriendlyName));
            }
        }
        return devices.OrderBy(device => device.Name, StringComparer.CurrentCultureIgnoreCase).ToArray();
    }
}
