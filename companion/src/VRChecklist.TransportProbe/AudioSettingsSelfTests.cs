using VRChecklist.Companion;

namespace VRChecklist.TransportProbe;

internal static class AudioSettingsSelfTests
{
    public static void PersistsEndpoint() => WithSettingsPath(path =>
    {
        var settings = new AudioOutputSettings(path);
        Require(settings.Current.DeviceId is null && settings.LoadError is null, "First launch must use default.");
        settings.Save(new("endpoint-1", "Headset"));
        Require(new AudioOutputSettings(path).Current is { DeviceId: "endpoint-1", DeviceName: "Headset" },
            "A fresh app instance must restore the stable endpoint ID.");
        settings.Save(new(null, null));
        Require(new AudioOutputSettings(path).Current.DeviceId is null, "Windows default must persist.");
    });

    public static void OrdersRecentOutputs() => WithSettingsPath(path =>
    {
        var settings = new AudioOutputSettings(path);
        IReadOnlyList<AudioOutputDevice> devices =
        [new("unused-z", "Z monitor"), new("speaker", "Speakers"), new("headset", "VR headset"),
            new("unused-a", "A monitor")];
        var vm = new AudioSettingsViewModel(settings, () => devices, () => Task.CompletedTask);
        vm.RefreshDevices();
        Require(vm.Devices.Select(device => device.Id)
            .SequenceEqual(new string?[] { null, "unused-a", "speaker", "headset", "unused-z" }),
            "Before first use, default must lead an alphabetical device list.");
        foreach (var id in new[] { "speaker", "headset", "speaker" })
        {
            vm.SelectedDevice = vm.Devices.Single(device => device.Id == id);
            vm.RefreshDevices(); // Reopen the dropdown after choosing.
        }
        Require(vm.Devices.Select(device => device.Id)
            .SequenceEqual(new string?[] { null, "speaker", "headset", "unused-a", "unused-z" }),
            "Alternating outputs must keep the last two choices directly after default, without duplicates.");
        vm.SelectedDevice = vm.Devices[0];
        var restored = new AudioOutputSettings(path);
        vm = new AudioSettingsViewModel(restored, () => devices, () => Task.CompletedTask);
        vm.RefreshDevices();
        Require(vm.SelectedDevice?.Id is null && vm.Devices[1].Id == "speaker" && vm.Devices[2].Id == "headset",
            "Selecting default and restarting must preserve the recent devices and their order.");
        devices = [new("headset", "Renamed VR headset"), new("unused-a", "A monitor")];
        vm.RefreshDevices();
        Require(vm.Devices[1].Id == "headset", "Missing devices must not push available recent outputs down.");
        devices = [new("speaker", "Renamed speakers"), .. devices];
        vm.RefreshDevices();
        Require(vm.Devices[1].Id == "speaker" && vm.Devices[2].Id == "headset",
            "A renamed or reconnected endpoint must retain its position by ID.");
    });

    public static void MigratesAudioHistory() => WithSettingsPath(path =>
    {
        File.WriteAllText(path, """{"DeviceId":"headset","DeviceName":"VR headset"}""");
        var settings = new AudioOutputSettings(path);
        Require(settings.LoadError is null && settings.Current.RecentDeviceIds!.SequenceEqual(["headset"]),
            "Existing settings without history must seed it from the selected device.");
        File.WriteAllText(path,
            """{"DeviceId":null,"RecentDeviceIds":["speaker",null,"","speaker","headset"]}""");
        settings = new AudioOutputSettings(path);
        Require(settings.LoadError is null && settings.Current.RecentDeviceIds!.SequenceEqual(["speaker", "headset"]),
            "Empty or repeated history entries must not break sorting or lose valid history.");
    });

    public static void RecoversMissingEndpoint() => WithSettingsPath(path =>
    {
        var settings = new AudioOutputSettings(path);
        settings.Save(new("headset", "Headphones"));
        IReadOnlyList<AudioOutputDevice> devices = [new("speakers", "Headphones")];
        var vm = new AudioSettingsViewModel(settings, () => devices, () => Task.CompletedTask);
        vm.RefreshDevices();
        Require(vm.SelectedDevice is { Id: "headset", IsAvailable: false } && !vm.CanTest,
            "A different endpoint with the same label must not replace the missing headset.");
        vm.SelectedDevice = null; // ComboBox clears during an ItemsSource replacement.
        Require(settings.Current.DeviceId == "headset", "Clearing the view must not clear the saved choice.");
        devices = [new("headset", "Renamed headset"), new("speakers", "Headphones")];
        vm.RefreshDevices();
        Require(vm.SelectedDevice is { Id: "headset", Name: "Renamed headset", IsAvailable: true } && vm.CanTest,
            "A reconnected or renamed endpoint must be selected by ID.");
        vm.SelectedDevice = vm.Devices[0];
        Require(settings.Current.DeviceId is null, "Default selection must clear the endpoint ID.");
        vm.SelectedDevice = vm.Devices.Single(device => device.Id == "speakers");
        Require(new AudioOutputSettings(path).Current.DeviceId == "speakers", "A deliberate selection must persist.");
    });

    public static void HandlesSettingsFailures() => WithSettingsPath(path =>
    {
        File.WriteAllText(path, "{broken");
        var settings = new AudioOutputSettings(path);
        Require(settings.Current.DeviceId is null && settings.LoadError is not null,
            "Corrupt settings must leave audio usable and report the fallback.");
        settings.Save(new("old", "Original"));
        Require(settings.LoadError is null, "A successful save must clear the load error.");
        File.Delete(path);
        Directory.CreateDirectory(path); // Deterministically make the destination unwritable as a file.
        var vm = new AudioSettingsViewModel(settings, () => [new("old", "Original"), new("new", "New")],
            () => Task.CompletedTask);
        vm.RefreshDevices();
        vm.SelectedDevice = vm.Devices.Single(device => device.Id == "new");
        Require(settings.Current.DeviceId == "old" && vm.SelectedDevice?.Id == "old",
            "A failed save must retain both the effective and displayed selection.");
        Require(settings.Current.RecentDeviceIds!.SequenceEqual(["old"]),
            "A failed save must not change the recent device order.");
        Require(vm.Status.Contains("Could not save", StringComparison.Ordinal), "Save errors must be visible.");
        var unavailable = new AudioSettingsViewModel(settings,
            () => throw new InvalidOperationException("Audio service stopped"), () => Task.CompletedTask);
        unavailable.RefreshDevices();
        Require(!unavailable.CanTest && settings.Current.DeviceId == "old",
            "Enumeration failure must not overwrite the saved output or enable a test without a selection.");
    });

    public static void TestsSelectedOutput() => WithSettingsPath(path =>
    {
        var settings = new AudioOutputSettings(path);
        var completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        string? playedDevice = null;
        var calls = 0;
        var vm = new AudioSettingsViewModel(settings, () => [new("headset", "Headset")], () =>
        {
            playedDevice = settings.Current.DeviceId;
            calls++;
            return completion.Task;
        });
        vm.RefreshDevices();
        vm.SelectedDevice = vm.Devices[1];
        var pending = vm.TestAsync();
        vm.TestAsync().GetAwaiter().GetResult();
        Require(playedDevice == "headset" && calls == 1 && !vm.CanTest && !vm.CanSelect,
            "Test playback must use the effective endpoint and reject overlapping test requests.");
        completion.SetException(new IOException("Device unplugged"));
        pending.GetAwaiter().GetResult();
        Require(vm.CanTest && vm.CanSelect && vm.Status.Contains("Could not play", StringComparison.Ordinal),
            "Playback failure must be visible and allow retrying.");
    });

    private static void WithSettingsPath(Action<string> test)
    {
        var directory = Path.Combine(Path.GetTempPath(), "vr-checklist-audio-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try { test(Path.Combine(directory, "audio-output.json")); }
        finally { Directory.Delete(directory, recursive: true); }
    }

    private static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
