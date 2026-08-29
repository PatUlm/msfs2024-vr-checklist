using System.Runtime.InteropServices;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

public enum SimulatorConnectionStatus
{
    Connecting,
    Connected,
}

public sealed class ChecklistConnectionService : IDisposable
{
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(3);
    private const string ConnectingDetail = "Waiting for MSFS 2024.";
    private readonly CancellationTokenSource cancellation = new();
    private Task? worker;
    private string? currentSessionId;
    private long currentSequence;

    public event Action<SimulatorConnectionStatus, string?>? ConnectionChanged;
    public event Action<ChecklistStateSnapshot, bool>? SnapshotReceived;
    public event Action<string>? ProtocolError;

    public void Start()
    {
        worker ??= Task.Run(() => RunAsync(cancellation.Token));
    }

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        if (!OperatingSystem.IsWindows())
        {
            ConnectionChanged?.Invoke(
                SimulatorConnectionStatus.Connecting,
                ConnectingDetail);
            return;
        }

        while (!cancellationToken.IsCancellationRequested)
        {
            ConnectionChanged?.Invoke(
                SimulatorConnectionStatus.Connecting,
                ConnectingDetail);

            try
            {
                using var client = new CommBusClient("VR Checklist companion");
                client.Connect();
                client.Subscribe(
                    ChecklistStateProtocol.SnapshotEventId,
                    ChecklistStateProtocol.SnapshotEvent,
                    HandleSnapshot);

                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connected,
                    "SimConnect is available.");

                var requestId = Guid.NewGuid().ToString("N");
                client.Send(
                    ChecklistStateProtocol.RequestEvent,
                    ChecklistStateProtocol.CreateRequest(requestId));

                while (!cancellationToken.IsCancellationRequested)
                {
                    client.Pump(cancellationToken);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (DllNotFoundException)
            {
                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connecting,
                    ConnectingDetail);
            }
            catch (Exception error) when (
                error is SimConnectDisconnectedException or
                    InvalidOperationException or
                    COMException)
            {
                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connecting,
                    ConnectingDetail);
            }
            catch (Exception)
            {
                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connecting,
                    ConnectingDetail);
            }

            try
            {
                await Task.Delay(RetryDelay, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

    }

    private void HandleSnapshot(string payload)
    {
        ChecklistStateSnapshot snapshot;

        try
        {
            snapshot = ChecklistStateProtocol.ParseSnapshot(payload);
        }
        catch (Exception error) when (
            error is ChecklistProtocolException or InvalidDataException or System.Text.Json.JsonException)
        {
            ProtocolError?.Invoke(error.Message);
            return;
        }

        if (snapshot.SessionId == currentSessionId && snapshot.Sequence < currentSequence)
        {
            return;
        }

        var isRepeated =
            snapshot.SessionId == currentSessionId &&
            snapshot.Sequence == currentSequence;
        currentSessionId = snapshot.SessionId;
        currentSequence = snapshot.Sequence;
        SnapshotReceived?.Invoke(snapshot, isRepeated);
    }

    public void Dispose()
    {
        cancellation.Cancel();

        try
        {
            worker?.Wait(TimeSpan.FromSeconds(2));
        }
        catch (AggregateException error) when (
            error.InnerExceptions.All(inner => inner is OperationCanceledException))
        {
            // Normal shutdown.
        }

        cancellation.Dispose();
    }
}
