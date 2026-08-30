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

        while (!cancellationToken.IsCancellationRequested)
        {
            ConnectionChanged?.Invoke(
                SimulatorConnectionStatus.Connecting,
                ConnectingDetail);

            try
            {
                using var client = clientFactory();
                client.Connect();
                cancellationToken.ThrowIfCancellationRequested();
                client.Subscribe(
                    ChecklistStateProtocol.SnapshotEventId,
                    ChecklistStateProtocol.SnapshotEvent,
                    HandleSnapshot);
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
            cancellation.Dispose();
            return;
        }

        try
        {
            if (activeWorker.Wait(shutdownWait))
            {
                cancellation.Dispose();
                return;
            }
        }
        catch (AggregateException error) when (
            error.InnerExceptions.All(inner => inner is OperationCanceledException))
        {
            // Normal shutdown.
            cancellation.Dispose();
            return;
        }

        _ = activeWorker.ContinueWith(
            static (_, state) => ((CancellationTokenSource)state!).Dispose(),
            cancellation,
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
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
    void Pump(CancellationToken cancellationToken);
}

internal sealed class ChecklistCommBusClient : IChecklistCommBusClient
{
    private readonly CommBusClient client = new("VR Checklist companion");

    public void Connect() => client.Connect();

    public void Subscribe(uint eventId, string eventName, Action<string> handler) =>
        client.Subscribe(eventId, eventName, handler);

    public void Send(string eventName, string payload) => client.Send(eventName, payload);

    public void Pump(CancellationToken cancellationToken) => client.Pump(cancellationToken);

    public void Dispose() => client.Dispose();
}
