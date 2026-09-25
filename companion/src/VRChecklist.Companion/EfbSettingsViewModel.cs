using System.ComponentModel;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed class EfbSettingsViewModel : INotifyPropertyChanged
{
    private readonly EfbInputSettings settings;
    private readonly Func<string, IReadOnlyDictionary<string, bool>, Task<EfbSettingsResponse>> apply;
    private string? instanceId;
    private int generation;
    private bool synchronizing;
    private string status;
    public IReadOnlyList<ConfirmationActionSetting> Actions => settings.Actions;
    public bool KeybindingsEnabled
    {
        get => settings.Enabled;
        set { if (value != settings.Enabled) Save(value, settings.SelectedEvent); }
    }
    public ConfirmationActionSetting SelectedAction
    {
        get => Actions.Single(action => action.Event == settings.SelectedEvent);
        set
        {
            if (value is not null && value.Event != settings.SelectedEvent)
                Save(settings.Enabled, value.Event);
        }
    }
    public string Status => status;
    public bool HasStatus => !string.IsNullOrEmpty(status);
    public event PropertyChangedEventHandler? PropertyChanged;

    public EfbSettingsViewModel(EfbInputSettings settings,
        Func<string, IReadOnlyDictionary<string, bool>, Task<EfbSettingsResponse>> apply)
    {
        this.settings = settings;
        this.apply = apply;
        status = settings.LoadError ?? "Waiting for EFB. Settings will be applied when it connects.";
    }

    // Called on the UI thread, as are setting changes and async continuations.
    public void ObserveInstance(string id)
    {
        if (instanceId == id) return;
        instanceId = id;
        generation++;
        _ = SynchronizeAsync();
    }

    public void Disconnect()
    {
        instanceId = null;
        generation++;
        SetStatus(settings.LoadError ?? "Waiting for EFB. Settings will be applied when it connects.");
    }

    private void Save(bool enabled, string eventName)
    {
        try
        {
            settings.Save(enabled, eventName);
            generation++;
            if (instanceId is null) SetStatus("Saved locally. Waiting for EFB to apply the settings.");
            else _ = SynchronizeAsync();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            SetStatus("Could not save the setting. The previous selection is still saved.");
        }
        finally
        {
            PropertyChanged?.Invoke(this, new(nameof(KeybindingsEnabled)));
            PropertyChanged?.Invoke(this, new(nameof(SelectedAction)));
        }
    }

    public async Task SynchronizeAsync()
    {
        if (synchronizing || instanceId is null || settings.LoadError is not null) return;
        synchronizing = true;
        try
        {
            while (instanceId is { } target)
            {
                var sentGeneration = generation;
                var desired = settings.Actions.ToDictionary(action => action.Event,
                    action => settings.Enabled && action.Event == settings.SelectedEvent);
                SetStatus("Applying settings to EFB…");
                try
                {
                    var response = await apply(target, desired);
                    if (sentGeneration != generation) continue;
                    if (response.Error is not null) SetStatus("Saved locally. " + response.Error);
                    else if (response.InstanceId != target || response.Actions is null || response.Actions.Count != desired.Count ||
                        !response.Actions.All(action => desired.TryGetValue(action.Event, out var enabled) && enabled == action.Enabled))
                        SetStatus("Saved locally. EFB did not confirm these settings. Reopen Settings to retry.");
                    else SetStatus(string.Empty);
                }
                catch (Exception error) when (error is IOException or TimeoutException or OperationCanceledException)
                {
                    if (sentGeneration != generation) continue;
                    SetStatus("Saved locally. No EFB confirmation. Open VR Checklist and reopen Settings to retry.");
                }
                break;
            }
        }
        finally { synchronizing = false; }
    }

    private void SetStatus(string value)
    {
        status = value;
        PropertyChanged?.Invoke(this, new(nameof(Status)));
        PropertyChanged?.Invoke(this, new(nameof(HasStatus)));
    }
}
