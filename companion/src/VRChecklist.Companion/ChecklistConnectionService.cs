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
    private static readonly TimeSpan ShutdownWait = TimeSpan.FromSeconds(2);
    private const string ConnectingDetail = "Waiting for MSFS 2024.";
    internal const string SimConnectMissingDetail =
        "SimConnect.dll not found. Set VR_CHECKLIST_SIMCONNECT_DIR or add " +
        "simconnect-path.txt next to the EXE.";
    private readonly EfbSettingsExchange settingsExchange = new();
    private readonly CancellationTokenSource cancellation = new();
    private readonly ChecklistSnapshotSequenceTracker snapshotSequence = new();
    private readonly Func<IChecklistCommBusClient> clientFactory;
    private readonly Func<bool> isWindows;
    private readonly TimeSpan shutdownWait;
    private readonly object lifecycleLock = new();
    private Task? worker;
    private bool disposed;

    public ChecklistConnectionService()
        : this(
            () => new ChecklistCommBusClient(),
            OperatingSystem.IsWindows,
            ShutdownWait)
    {
    }

    internal ChecklistConnectionService(
        Func<IChecklistCommBusClient> clientFactory,
        Func<bool> isWindows,
        TimeSpan shutdownWait)
    {
        ArgumentNullException.ThrowIfNull(clientFactory);
        ArgumentNullException.ThrowIfNull(isWindows);

        if (shutdownWait < TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(shutdownWait));
        }

        this.clientFactory = clientFactory;
        this.isWindows = isWindows;
        this.shutdownWait = shutdownWait;
    }

    public event Action<SimulatorConnectionStatus, string?>? ConnectionChanged;
    public event Action<ChecklistStateSnapshot, bool>? SnapshotReceived;
    public event Action<string>? ProtocolError;

    public Task<EfbSettingsResponse> ApplyEfbSettingsAsync(string instanceId, IReadOnlyDictionary<string, bool> actions) =>
        settingsExchange.ApplyAsync(instanceId, actions);

    public void Start()
    {
        lock (lifecycleLock)
        {
            ObjectDisposedException.ThrowIf(disposed, this);
            worker ??= Task.Run(() => RunAsync(cancellation.Token));
        }
    }

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        if (!isWindows())
        {
            ConnectionChanged?.Invoke(
                SimulatorConnectionStatus.Connecting,
                ConnectingDetail);
            return;
        }

        // Each failed attempt reports its own detail below; a missing
        // SimConnect.dll must not be masked by the generic waiting message.
        ConnectionChanged?.Invoke(
            SimulatorConnectionStatus.Connecting,
            ConnectingDetail);

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                using var client = clientFactory();
                client.Connect();
                cancellationToken.ThrowIfCancellationRequested();
                client.Subscribe(
                    ChecklistStateProtocol.SnapshotEventId,
                    ChecklistStateProtocol.SnapshotEvent,
                    HandleSnapshot);
                client.Subscribe(EfbSettingsProtocol.ResponseEventId, EfbSettingsProtocol.ResponseEvent, settingsExchange.Receive);
                settingsExchange.SetConnected(true);
                cancellationToken.ThrowIfCancellationRequested();

                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connected,
                    "SimConnect is available.");

                var requestId = Guid.NewGuid().ToString("N");
                client.Send(
                    ChecklistStateProtocol.RequestEvent,
                    ChecklistStateProtocol.CreateRequest(requestId));
                cancellationToken.ThrowIfCancellationRequested();

                while (!cancellationToken.IsCancellationRequested)
                {
                    settingsExchange.SendPending((name, payload) => {
                        cancellationToken.ThrowIfCancellationRequested();
                        client.Send(name, payload);
                    });
                    client.Pump(cancellationToken, settingsExchange.Signal);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (DllNotFoundException)
            {
                settingsExchange.SetConnected(false);
                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connecting,
                    SimConnectMissingDetail);
            }
            catch (Exception error) when (
                error is SimConnectDisconnectedException or
                    InvalidOperationException or
                    COMException)
            {
                settingsExchange.SetConnected(false);
                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connecting,
                    ConnectingDetail);
            }
            catch (Exception)
            {
                settingsExchange.SetConnected(false);
                ConnectionChanged?.Invoke(
                    SimulatorConnectionStatus.Connecting,
                    ConnectingDetail);
            }

            finally
            {
                settingsExchange.SetConnected(false);
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

        var disposition = snapshotSequence.Observe(snapshot);

        if (disposition == ChecklistSnapshotDisposition.Stale)
        {
            return;
        }

        SnapshotReceived?.Invoke(
            snapshot,
            disposition == ChecklistSnapshotDisposition.Repeated);
    }

    public void Dispose()
    {
        Task? activeWorker;

        lock (lifecycleLock)
        {
            if (disposed)
            {
                return;
            }

            disposed = true;
            cancellation.Cancel();
            activeWorker = worker;
        }

        if (activeWorker is null)
        {
            DisposeResources();
            return;
        }

        try
        {
            if (activeWorker.Wait(shutdownWait))
            {
                DisposeResources();
                return;
            }
        }
        catch (AggregateException error) when (
            error.InnerExceptions.All(inner => inner is OperationCanceledException))
        {
            // Normal shutdown.
            DisposeResources();
            return;
        }

        _ = activeWorker.ContinueWith(
            static (_, state) => ((ChecklistConnectionService)state!).DisposeResources(),
            this,
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
    }

    private void DisposeResources()
    {
        settingsExchange.Dispose();
        cancellation.Dispose();
    }

    internal Task WorkerCompletion
    {
        get
        {
            lock (lifecycleLock)
            {
                return worker ?? Task.CompletedTask;
            }
        }
    }
}

internal interface IChecklistCommBusClient : IDisposable
{
    void Connect();
    void Subscribe(uint eventId, string eventName, Action<string> handler);
    void Send(string eventName, string payload);
    void Pump(CancellationToken cancellationToken, WaitHandle outgoingSignal);
}

internal sealed class ChecklistCommBusClient : IChecklistCommBusClient
{
    private readonly CommBusClient client = new("VR Checklist companion");

    public void Connect() => client.Connect();

    public void Subscribe(uint eventId, string eventName, Action<string> handler) =>
        client.Subscribe(eventId, eventName, handler);

    public void Send(string eventName, string payload) => client.Send(eventName, payload);

    public void Pump(CancellationToken cancellationToken, WaitHandle outgoingSignal) =>
        client.Pump(cancellationToken, Timeout.InfiniteTimeSpan, outgoingSignal);

    public void Dispose() => client.Dispose();
}
