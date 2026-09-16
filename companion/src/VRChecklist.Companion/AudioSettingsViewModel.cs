using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace VRChecklist.Companion;

public sealed class AudioSettingsViewModel : INotifyPropertyChanged
{
    private readonly AudioOutputSettings settings;
    private readonly Func<IReadOnlyList<AudioOutputDevice>> enumerate;
    private readonly Func<Task> play;
    private AudioOutputDevice? selectedDevice;
    private string status = string.Empty;
    private bool isTesting;
    private bool refreshing;

    public AudioSettingsViewModel(
        AudioOutputSettings settings,
        Func<IReadOnlyList<AudioOutputDevice>> enumerate,
        Func<Task> play)
    {
        this.settings = settings;
        this.enumerate = enumerate;
        this.play = play;
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    public IReadOnlyList<AudioOutputDevice> Devices { get; private set; } = [];
    public bool CanTest => selectedDevice is { IsAvailable: true } && !isTesting;
    public bool CanSelect => !isTesting;
    public bool HasStatus => !string.IsNullOrEmpty(status);

    public string Status
    {
        get => status;
        private set
        {
            status = value;
            Notify();
            Notify(nameof(HasStatus));
        }
    }

    public AudioOutputDevice? SelectedDevice
    {
        get => selectedDevice;
        set
        {
            if (refreshing || value is null || value == selectedDevice)
            {
                return;
            }
            try
            {
                settings.Save(new(value.Id, value.Id is null ? null : value.Name));
                selectedDevice = value;
                Status = SelectionStatus;
            }
            catch (Exception error) when (error is IOException or UnauthorizedAccessException)
            {
                Status = "Could not save audio settings. The previous output is still selected.";
            }
            Notify();
            Notify(nameof(CanTest));
        }
    }

    public void RefreshDevices()
    {
        if (isTesting) return;
        try
        {
            var devices = new List<AudioOutputDevice> { new(null, "Windows default") };
            devices.AddRange(enumerate());
            var saved = settings.Current;
            var selected = devices.FirstOrDefault(device => device.Id == saved.DeviceId);
            if (selected is null)
            {
                selected = new(saved.DeviceId, saved.DeviceName ?? "Saved output device", false);
                devices.Add(selected);
            }
            // Replacing ItemsSource can briefly clear a bound ComboBox selection.
            refreshing = true;
            var recency = (saved.RecentDeviceIds ?? [])
                .Select((id, index) => (id, index))
                .ToDictionary(entry => entry.id, entry => entry.index, StringComparer.Ordinal);
            Devices = devices
                .OrderBy(device => device.Id is null ? -1 : recency.GetValueOrDefault(device.Id, int.MaxValue))
                .ThenBy(device => device.Name, StringComparer.CurrentCultureIgnoreCase)
                .ToArray();
            selectedDevice = selected;
            Notify(nameof(Devices));
            Notify(nameof(SelectedDevice));
            Status = settings.LoadError ?? SelectionStatus;
        }
        catch (Exception)
        {
            Status = "Could not list audio outputs. Reopen the list to try again.";
        }
        finally
        {
            refreshing = false;
            Notify(nameof(CanTest));
        }
    }

    public async Task TestAsync()
    {
        if (!CanTest) return;
        isTesting = true;
        Notify(nameof(CanTest));
        Notify(nameof(CanSelect));
        Status = "Playing test sound…";
        try
        {
            await play();
            Status = "Test sound finished.";
        }
        catch (Exception)
        {
            Status = "Could not play audio. Check the selected output and try again.";
        }
        finally
        {
            isTesting = false;
            Notify(nameof(CanTest));
            Notify(nameof(CanSelect));
        }
    }

    private string SelectionStatus => selectedDevice is { IsAvailable: false }
        ? "This output is unavailable. Reconnect it or select another output."
        : string.Empty;

    private void Notify([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
