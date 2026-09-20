using System.ComponentModel;
using System.Reflection;
using System.Runtime.CompilerServices;
using Avalonia.Threading;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public sealed class MainWindowViewModel : INotifyPropertyChanged
{
    private string simulatorStatus = "Connecting";
    private string simulatorStatusColor = "#E5B94B";
    private string simulatorDetail = "Waiting for MSFS 2024.";
    private string checklistStatus = "Waiting for EFB";
    private string checklistDetail = "Open VR Checklist in the simulator.";
    private string aircraft = "—";
    private string aircraftIdentityClipboardText = string.Empty;
    private string checklist = "—";
    private string activeGroup = "—";
    private string activeGroupPhase = string.Empty;
    private bool isChecklistCompleted;
    private bool isActiveGroupCompleted;
    private string nextItem = "—";
    private string progress = "0 / 0";
    private double progressPercent;
    private string efbVersion = "—";

    public MainWindowViewModel(ChecklistConnectionService connectionService)
    {
        // The informational version carries the "-dev.<timestamp>" marker of
        // development builds; releases show the plain project version.
        var assembly = Assembly.GetExecutingAssembly();
        CompanionVersion =
            assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
            ?? assembly.GetName().Version?.ToString(3)
            ?? "unknown";
        connectionService.ConnectionChanged += (status, detail) =>
            Dispatcher.UIThread.Post(() => ApplyConnectionStatus(status, detail));
        connectionService.SnapshotReceived += (snapshot, isRepeated) =>
            Dispatcher.UIThread.Post(() => ApplySnapshot(snapshot, isRepeated));
        connectionService.ProtocolError += message =>
            Dispatcher.UIThread.Post(() =>
            {
                ChecklistStatus = "Error";
                ChecklistDetail = message;
                AircraftIdentityClipboardText = string.Empty;
            });
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    public string CompanionVersion { get; }

    public string SimulatorStatus
    {
        get => simulatorStatus;
        private set => SetField(ref simulatorStatus, value);
    }

    public string SimulatorDetail
    {
        get => simulatorDetail;
        private set => SetField(ref simulatorDetail, value);
    }

    public string SimulatorStatusColor
    {
        get => simulatorStatusColor;
        private set => SetField(ref simulatorStatusColor, value);
    }

    public string ChecklistStatus
    {
        get => checklistStatus;
        private set => SetField(ref checklistStatus, value);
    }

    public string ChecklistDetail
    {
        get => checklistDetail;
        private set => SetField(ref checklistDetail, value);
    }

    public string Aircraft
    {
        get => aircraft;
        private set => SetField(ref aircraft, value);
    }

    public string Checklist
    {
        get => checklist;
        private set => SetField(ref checklist, value);
    }

    public string AircraftIdentityClipboardText
    {
        get => aircraftIdentityClipboardText;
        private set
        {
            SetField(ref aircraftIdentityClipboardText, value);
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(CanCopyAircraftIdentity)));
        }
    }

    public bool CanCopyAircraftIdentity => AircraftIdentityClipboardText.Length > 0;

    /// <summary>
    /// Id of the checklist shown on the dashboard, or <c>null</c> while no
    /// snapshot with a matching checklist has been received.
    /// </summary>
    public string? ChecklistId { get; private set; }

    public string ActiveGroup
    {
        get => activeGroup;
        private set => SetField(ref activeGroup, value);
    }

    public string ActiveGroupPhase
    {
        get => activeGroupPhase;
        private set
        {
            if (activeGroupPhase == value) return;
            SetField(ref activeGroupPhase, value);
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(HasActiveGroupPhase)));
        }
    }

    public bool HasActiveGroupPhase => ActiveGroupPhase.Length > 0;

    /* Both mirror the green group mark of the EFB: every item ticked. */
    public bool IsChecklistCompleted
    {
        get => isChecklistCompleted;
        private set => SetField(ref isChecklistCompleted, value);
    }

    public bool IsActiveGroupCompleted
    {
        get => isActiveGroupCompleted;
        private set => SetField(ref isActiveGroupCompleted, value);
    }

    public string NextItem
    {
        get => nextItem;
        private set => SetField(ref nextItem, value);
    }

    public string Progress
    {
        get => progress;
        private set => SetField(ref progress, value);
    }

    public double ProgressPercent
    {
        get => progressPercent;
        private set => SetField(ref progressPercent, value);
    }

    public string EfbVersion
    {
        get => efbVersion;
        private set => SetField(ref efbVersion, value);
    }

    private void ApplyConnectionStatus(
        SimulatorConnectionStatus status,
        string? detail)
    {
        var isConnected = status == SimulatorConnectionStatus.Connected;
        SimulatorStatus = isConnected ? "Connected" : "Connecting";
        SimulatorStatusColor = isConnected ? "#4FCB83" : "#E5B94B";
        SimulatorDetail = detail ?? string.Empty;
        AircraftIdentityClipboardText = string.Empty;

        if (isConnected)
        {
            ChecklistStatus = "Waiting for EFB";
            ChecklistDetail = "Connected to MSFS; waiting for a checklist snapshot.";
        }
    }

    private void ApplySnapshot(ChecklistStateSnapshot snapshot, bool isRepeated)
    {
        ChecklistStatus = "State received";
        ChecklistDetail = snapshot.Checklist is null
            ? "The EFB is running; no checklist matches the current aircraft."
            : isRepeated
                ? $"Snapshot {snapshot.Sequence} confirmed after reconnect."
                : $"Snapshot {snapshot.Sequence} received.";
        Aircraft = snapshot.Aircraft.DisplayName
            ?? FirstNonEmpty(
                snapshot.Aircraft.AtcModel,
                snapshot.Aircraft.AtcType,
                snapshot.Aircraft.Title)
            ?? "Unknown aircraft";
        Checklist = snapshot.Checklist?.Title ?? "No checklist available";
        ChecklistId = snapshot.Checklist?.Id;
        AircraftIdentityClipboardText = snapshot.Checklist is null &&
            FirstNonEmpty(snapshot.Aircraft.AtcModel, snapshot.Aircraft.AtcType, snapshot.Aircraft.Title) is not null
                ? $"ATC MODEL: {snapshot.Aircraft.AtcModel}\nATC TYPE: {snapshot.Aircraft.AtcType}\nTITLE: {snapshot.Aircraft.Title}"
                : string.Empty;
        ActiveGroup = snapshot.ActiveGroup?.Title ?? "—";
        ActiveGroupPhase = snapshot.Checklist is null
            ? string.Empty
            : snapshot.ActiveGroup?.Phase ?? string.Empty;
        IsChecklistCompleted = snapshot.Checklist is not null && snapshot.IsComplete;
        IsActiveGroupCompleted = snapshot.ActiveGroup is not null &&
            (snapshot.CompletedGroupIds?.Contains(snapshot.ActiveGroup.Id, StringComparer.Ordinal) ?? false);
        NextItem = snapshot.NextOpenItem is null
            ? snapshot.IsComplete ? "Checklist completed" : "—"
            : $"{snapshot.NextOpenItem.Challenge}: {snapshot.NextOpenItem.Response}";
        var checklistProgress = ChecklistProgress.FromSnapshot(snapshot);
        Progress = checklistProgress.Label;
        ProgressPercent = checklistProgress.Percent;
        EfbVersion = snapshot.EfbVersion;
    }

    /* Audio problems are shown where transport errors appear; the state itself stays valid. */
    public void ReportAudioError(string message) =>
        Dispatcher.UIThread.Post(() => ChecklistDetail = $"Audio: {message}");

    private static string? FirstNonEmpty(params string[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    private void SetField<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
        {
            return;
        }

        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}
