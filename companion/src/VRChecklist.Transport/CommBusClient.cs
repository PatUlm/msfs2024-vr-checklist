using System.Runtime.InteropServices;
using System.Text;

namespace VRChecklist.Transport;

public sealed class CommBusClient : IDisposable
{
    private readonly EventWaitHandle simConnectSignal =
        new(false, EventResetMode.AutoReset);
    private readonly Dictionary<uint, Subscription> subscriptions = [];
    private readonly SimConnectNative.DispatchProc dispatch;
    private readonly CommBusDispatchGuard dispatchGuard = new();
    private readonly CommBusThreadAffinityGuard threadAffinity = new();
    private nint connection;
    private bool disconnected;

    public CommBusClient(string clientName)
    {
        ClientName = clientName;
        dispatch = Dispatch;
    }

    public string ClientName { get; }

    public void Connect()
    {
        threadAffinity.Enter();
        ObjectDisposedException.ThrowIf(simConnectSignal.SafeWaitHandle.IsClosed, this);

        if (connection != nint.Zero)
        {
            throw new InvalidOperationException("The SimConnect client is already connected.");
        }

        SimConnectNative.EnsureResolverRegistered();
        var safeHandle = simConnectSignal.SafeWaitHandle;
        var addedReference = false;

        try
        {
            safeHandle.DangerousAddRef(ref addedReference);
            ThrowIfFailed(
                SimConnectNative.Open(
                    out connection,
                    ClientName,
                    nint.Zero,
                    0,
                    safeHandle.DangerousGetHandle(),
                    0),
                "connect to MSFS 2024");
        }
        finally
        {
            if (addedReference)
            {
                safeHandle.DangerousRelease();
            }
        }
    }

    public void Subscribe(uint eventId, string eventName, Action<string> handler)
    {
        threadAffinity.Enter();
        EnsureConnected();

        if (subscriptions.ContainsKey(eventId))
        {
            throw new InvalidOperationException($"CommBus event ID {eventId} is already used.");
        }

        ThrowIfFailed(
            SimConnectNative.SubscribeToCommBusEvent(connection, eventId, eventName),
            $"subscribe to {eventName}");
        subscriptions.Add(eventId, new Subscription(handler));
    }

    public void Send(string eventName, string payload)
    {
        threadAffinity.Enter();
        EnsureConnected();
        var bytes = Encoding.UTF8.GetBytes(payload + '\0');
        ThrowIfFailed(
            SimConnectNative.CallCommBusEvent(
                connection,
                eventName,
                SimConnectNative.BroadcastToJs,
                checked((uint)bytes.Length),
                bytes),
            $"send {eventName}");
    }

    public void Pump(CancellationToken cancellationToken)
    {
        _ = Pump(cancellationToken, Timeout.InfiniteTimeSpan);
    }

    public bool Pump(CancellationToken cancellationToken, TimeSpan timeout, WaitHandle? outgoingSignal = null)
    {
        threadAffinity.Enter();
        EnsureConnected();

        var signaled = WaitHandle.WaitAny(
            outgoingSignal is null
                ? [simConnectSignal, cancellationToken.WaitHandle]
                : [simConnectSignal, cancellationToken.WaitHandle, outgoingSignal],
            timeout);
        cancellationToken.ThrowIfCancellationRequested();

        if (signaled == WaitHandle.WaitTimeout)
        {
            return false;
        }

        if (signaled != 0)
        {
            return false;
        }

        int dispatchResult;
        Exception? dispatchError;

        try
        {
            dispatchResult = SimConnectNative.CallDispatch(connection, dispatch, nint.Zero);
        }
        finally
        {
            dispatchError = dispatchGuard.TakeFatalError();
        }

        ThrowIfFailed(dispatchResult, "dispatch SimConnect messages");

        if (dispatchError is not null)
        {
            throw new InvalidDataException(
                "Unable to process a SimConnect message.",
                dispatchError);
        }

        if (disconnected)
        {
            throw new SimConnectDisconnectedException();
        }

        return true;
    }

    private void Dispatch(nint data, uint dataSize, nint context)
    {
        dispatchGuard.Invoke(() => DispatchCore(data, dataSize));
    }

    private void DispatchCore(nint data, uint dataSize)
    {
        if (dataSize < Marshal.SizeOf<SimConnectReceiveHeader>())
        {
            throw new InvalidDataException("Truncated SimConnect response header.");
        }

        var header = Marshal.PtrToStructure<SimConnectReceiveHeader>(data);

        if (header.Id == SimConnectNative.ReceiveIdQuit)
        {
            disconnected = true;
            return;
        }

        if (header.Id != SimConnectNative.ReceiveIdCommBus)
        {
            return;
        }

        if (dataSize < Marshal.SizeOf<SimConnectCommBusHeader>())
        {
            throw new InvalidDataException("Truncated CommBus response header.");
        }

        var commBus = Marshal.PtrToStructure<SimConnectCommBusHeader>(data);

        if (!subscriptions.TryGetValue(commBus.EventId, out var subscription))
        {
            return;
        }

        var payloadOffset = Marshal.SizeOf<SimConnectCommBusHeader>();
        var packetSize = Math.Min(dataSize, commBus.Size);

        if (packetSize < payloadOffset)
        {
            throw new InvalidDataException("Truncated CommBus response header.");
        }

        var payloadLength = checked((int)packetSize - payloadOffset);
        var payload = new byte[payloadLength];
        Marshal.Copy(data + payloadOffset, payload, 0, payloadLength);
        var message = subscription.Assembler.Append(
            commBus.EntryNumber,
            commBus.OutOf,
            payload);

        if (message is not null)
        {
            subscription.Handler(message);
        }
    }

    private void EnsureConnected()
    {
        if (connection == nint.Zero)
        {
            throw new InvalidOperationException("The SimConnect client is not connected.");
        }
    }

    private static void ThrowIfFailed(int result, string operation)
    {
        if (result < 0)
        {
            Marshal.ThrowExceptionForHR(result);
            throw new InvalidOperationException($"Unable to {operation}.");
        }
    }

    public void Dispose()
    {
        threadAffinity.Enter();

        foreach (var eventId in subscriptions.Keys)
        {
            if (connection != nint.Zero)
            {
                _ = SimConnectNative.UnsubscribeToCommBusEvent(connection, eventId);
            }
        }

        subscriptions.Clear();

        if (connection != nint.Zero)
        {
            _ = SimConnectNative.Close(connection);
            connection = nint.Zero;
        }

        simConnectSignal.Dispose();
    }

    private sealed record Subscription(Action<string> Handler)
    {
        internal CommBusMessageAssembler Assembler { get; } = new();
    }
}

public sealed class SimConnectDisconnectedException()
    : IOException("MSFS 2024 closed the SimConnect connection.");
