using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

namespace VRChecklist.TransportProbe;

internal static class Program
{
    private const string PingEvent = "VRChecklist.Transport.Ping.v1";
    private const string PongEvent = "VRChecklist.Transport.Pong.v1";
    private const uint PongEventId = 1;
    private static readonly TimeSpan ResponseTimeout = TimeSpan.FromSeconds(30);

    private static int Main(string[] args)
    {
        if (args is ["--self-test"])
        {
            return TransportProbeSelfTests.Run();
        }

        if (!OperatingSystem.IsWindows())
        {
            Console.Error.WriteLine(
                "The transport probe must run on Windows next to MSFS 2024.");
            return 2;
        }

        try
        {
            using var probe = new TransportProbe();
            return probe.Run();
        }
        catch (DllNotFoundException error)
        {
            Console.Error.WriteLine($"SimConnect.dll could not be loaded: {error.Message}");
            Console.Error.WriteLine(
                "Set VR_CHECKLIST_SIMCONNECT_DIR to a directory containing " +
                "the MSFS 2024 SimConnect.dll.");
            return 3;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error);
            return 1;
        }
    }

    private sealed class TransportProbe : IDisposable
    {
        private readonly EventWaitHandle simConnectSignal =
            new(false, EventResetMode.AutoReset);
        private readonly ManualResetEvent cancelSignal = new(false);
        private readonly CommBusMessageAssembler assembler = new();
        private readonly SimConnectNative.DispatchProc dispatch;
        private readonly string requestId = Guid.NewGuid().ToString("N");
        private nint connection;
        private bool pongReceived;
        private Exception? dispatchError;

        internal TransportProbe()
        {
            dispatch = Dispatch;
            Console.CancelKeyPress += HandleCancelKeyPress;
        }

        internal int Run()
        {
            SimConnectNative.EnsureResolverRegistered();
            Open();

            ThrowIfFailed(
                SimConnectNative.SubscribeToCommBusEvent(
                    connection,
                    PongEventId,
                    PongEvent),
                "subscribe to the EFB response event");

            var payload = JsonSerializer.Serialize(new
            {
                protocolVersion = 1,
                type = "ping",
                requestId,
                sentAt = DateTimeOffset.UtcNow.ToString("O"),
            });
            var bytes = Encoding.UTF8.GetBytes(payload + '\0');

            ThrowIfFailed(
                SimConnectNative.CallCommBusEvent(
                    connection,
                    PingEvent,
                    SimConnectNative.BroadcastToJs,
                    checked((uint)bytes.Length),
                    bytes),
                "send the EFB ping event");

            Console.WriteLine($"Ping {requestId} sent; waiting for the EFB response...");
            var stopwatch = Stopwatch.StartNew();

            while (!pongReceived)
            {
                var remaining = ResponseTimeout - stopwatch.Elapsed;

                if (remaining <= TimeSpan.Zero)
                {
                    Console.Error.WriteLine(
                        "No matching EFB response arrived within 30 seconds.");
                    return 4;
                }

                var signaled = WaitHandle.WaitAny(
                    [simConnectSignal, cancelSignal],
                    remaining);

                if (signaled == 1)
                {
                    Console.Error.WriteLine("Cancelled.");
                    return 130;
                }

                if (signaled == WaitHandle.WaitTimeout)
                {
                    continue;
                }

                ThrowIfFailed(
                    SimConnectNative.CallDispatch(connection, dispatch, nint.Zero),
                    "dispatch SimConnect messages");

                if (dispatchError is not null)
                {
                    throw new InvalidDataException(
                        "Unable to process a SimConnect message.",
                        dispatchError);
                }
            }

            return 0;
        }

        private void Open()
        {
            var safeHandle = simConnectSignal.SafeWaitHandle;
            var addedReference = false;

            try
            {
                safeHandle.DangerousAddRef(ref addedReference);
                ThrowIfFailed(
                    SimConnectNative.Open(
                        out connection,
                        "VR Checklist transport probe",
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

            Console.WriteLine("Connected to MSFS 2024 through SimConnect.");
        }

        private void Dispatch(nint data, uint dataSize, nint context)
        {
            try
            {
                DispatchCore(data, dataSize);
            }
            catch (Exception error)
            {
                dispatchError = error;
            }
        }

        private void DispatchCore(nint data, uint dataSize)
        {
            var header = Marshal.PtrToStructure<SimConnectReceiveHeader>(data);

            if (header.Id == SimConnectNative.ReceiveIdQuit)
            {
                Console.Error.WriteLine("MSFS 2024 closed the SimConnect connection.");
                cancelSignal.Set();
                return;
            }

            if (header.Id != SimConnectNative.ReceiveIdCommBus)
            {
                return;
            }

            var commBus = Marshal.PtrToStructure<SimConnectCommBusHeader>(data);

            if (commBus.EventId != PongEventId)
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
            var message = assembler.Append(
                commBus.EntryNumber,
                commBus.OutOf,
                payload);

            if (message is not null)
            {
                HandlePong(message);
            }
        }

        private void HandlePong(string message)
        {
            using var document = JsonDocument.Parse(message);
            var root = document.RootElement;

            if (
                !root.TryGetProperty("protocolVersion", out var version) ||
                version.GetInt32() != 1 ||
                !root.TryGetProperty("type", out var type) ||
                type.GetString() != "pong" ||
                !root.TryGetProperty("requestId", out var receivedRequestId) ||
                receivedRequestId.GetString() != requestId)
            {
                Console.Error.WriteLine("Ignored an unrelated or invalid EFB response.");
                return;
            }

            var efbVersion = root.GetProperty("efbVersion").GetString();
            var instanceId = root.GetProperty("instanceId").GetString();
            Console.WriteLine(
                $"Bidirectional CommBus probe succeeded. " +
                $"EFB version: {efbVersion}; instance: {instanceId}.");
            pongReceived = true;
        }

        private static void ThrowIfFailed(int result, string operation)
        {
            if (result < 0)
            {
                Marshal.ThrowExceptionForHR(result);
                throw new InvalidOperationException($"Unable to {operation}.");
            }
        }

        private void HandleCancelKeyPress(object? sender, ConsoleCancelEventArgs eventArgs)
        {
            eventArgs.Cancel = true;
            cancelSignal.Set();
        }

        public void Dispose()
        {
            Console.CancelKeyPress -= HandleCancelKeyPress;

            if (connection != nint.Zero)
            {
                _ = SimConnectNative.UnsubscribeToCommBusEvent(
                    connection,
                    PongEventId);
                _ = SimConnectNative.Close(connection);
                connection = nint.Zero;
            }

            cancelSignal.Dispose();
            simConnectSignal.Dispose();
        }
    }
}
