using System.Diagnostics;
using System.Text.Json;
using VRChecklist.Transport;

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
            return RunProbe();
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

    private static int RunProbe()
    {
        using var cancellation = new CancellationTokenSource();
        ConsoleCancelEventHandler? cancelHandler = null;
        cancelHandler = (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            cancellation.Cancel();
        };
        Console.CancelKeyPress += cancelHandler;

        try
        {
            using var client = new CommBusClient("VR Checklist transport probe");
            var requestId = Guid.NewGuid().ToString("N");
            var pongReceived = false;

            client.Connect();
            Console.WriteLine("Connected to MSFS 2024 through SimConnect.");
            client.Subscribe(PongEventId, PongEvent, message =>
            {
                if (IsMatchingPong(message, requestId, out var result))
                {
                    Console.WriteLine(result);
                    pongReceived = true;
                }
                else
                {
                    Console.Error.WriteLine("Ignored an unrelated or invalid EFB response.");
                }
            });

            client.Send(
                PingEvent,
                JsonSerializer.Serialize(new
                {
                    protocolVersion = 1,
                    type = "ping",
                    requestId,
                    sentAt = DateTimeOffset.UtcNow.ToString("O"),
                }));

            Console.WriteLine($"Ping {requestId} sent; waiting for the EFB response...");
            var stopwatch = Stopwatch.StartNew();

            while (!pongReceived)
            {
                if (stopwatch.Elapsed >= ResponseTimeout)
                {
                    Console.Error.WriteLine(
                        "No matching EFB response arrived within 30 seconds.");
                    return 4;
                }

                var remaining = ResponseTimeout - stopwatch.Elapsed;

                if (!client.Pump(cancellation.Token, remaining))
                {
                    Console.Error.WriteLine(
                        "No matching EFB response arrived within 30 seconds.");
                    return 4;
                }
            }

            return 0;
        }
        catch (OperationCanceledException)
        {
            Console.Error.WriteLine("Cancelled.");
            return 130;
        }
        finally
        {
            Console.CancelKeyPress -= cancelHandler;
        }
    }

    private static bool IsMatchingPong(
        string message,
        string requestId,
        out string result)
    {
        result = string.Empty;

        try
        {
            using var document = JsonDocument.Parse(message);
            var root = document.RootElement;

            if (root.GetProperty("protocolVersion").GetInt32() != 1 ||
                root.GetProperty("type").GetString() != "pong" ||
                root.GetProperty("requestId").GetString() != requestId)
            {
                return false;
            }

            result =
                $"Bidirectional CommBus probe succeeded. " +
                $"EFB version: {root.GetProperty("efbVersion").GetString()}; " +
                $"instance: {root.GetProperty("instanceId").GetString()}.";
            return true;
        }
        catch (Exception error) when (
            error is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            return false;
        }
    }
}
