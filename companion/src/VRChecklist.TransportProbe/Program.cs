using System.Diagnostics;
using VRChecklist.Companion;
using VRChecklist.Transport;

namespace VRChecklist.TransportProbe;

/*
 * Console probe for the bidirectional CommBus channel. It sends one checklist
 * state request and waits for the snapshot that answers it; the request ID in
 * the snapshot proves the round trip without a dedicated ping message.
 * "--play-completion-sound" plays the companion's embedded clip once on the
 * Windows default output device, without MSFS, to prove the audio path.
 */
internal static class Program
{
    private static readonly TimeSpan ResponseTimeout = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan PlaybackTimeout = TimeSpan.FromSeconds(15);

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

        if (args is ["--play-completion-sound"])
        {
            return PlayCompletionSound();
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
            var snapshotReceived = false;

            client.Connect();
            Console.WriteLine("Connected to MSFS 2024 through SimConnect.");
            client.Subscribe(
                ChecklistStateProtocol.SnapshotEventId,
                ChecklistStateProtocol.SnapshotEvent,
                message =>
                {
                    if (TryDescribeMatchingSnapshot(message, requestId, out var result))
                    {
                        Console.WriteLine(result);
                        snapshotReceived = true;
                    }
                    else
                    {
                        Console.Error.WriteLine(
                            "Ignored an unsolicited, unrelated or invalid EFB snapshot.");
                    }
                });

            client.Send(
                ChecklistStateProtocol.RequestEvent,
                ChecklistStateProtocol.CreateRequest(requestId));

            Console.WriteLine(
                $"State request {requestId} sent; waiting for the EFB snapshot...");
            var stopwatch = Stopwatch.StartNew();

            while (!snapshotReceived)
            {
                if (stopwatch.Elapsed >= ResponseTimeout)
                {
                    Console.Error.WriteLine(
                        "No matching EFB snapshot arrived within 30 seconds.");
                    return 4;
                }

                var remaining = ResponseTimeout - stopwatch.Elapsed;

                if (!client.Pump(cancellation.Token, remaining))
                {
                    Console.Error.WriteLine(
                        "No matching EFB snapshot arrived within 30 seconds.");
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

    [System.Runtime.Versioning.SupportedOSPlatform("windows")]
    private static int PlayCompletionSound()
    {
        try
        {
            using var player = new CompletionSoundPlayer();
            var playback = player.PlayAsync();
            Console.WriteLine("Playing the completion clip on the default output device...");

            if (!playback.Wait(PlaybackTimeout))
            {
                Console.Error.WriteLine("Playback did not finish within 15 seconds.");
                return 5;
            }

            Console.WriteLine("Completion clip played.");
            return 0;
        }
        catch (AggregateException error)
        {
            Console.Error.WriteLine($"Playback failed: {error.InnerException?.Message ?? error.Message}");
            return 5;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Playback failed: {error.Message}");
            return 5;
        }
    }

    private static bool TryDescribeMatchingSnapshot(
        string message,
        string requestId,
        out string result)
    {
        result = string.Empty;

        try
        {
            var snapshot = ChecklistStateProtocol.ParseSnapshot(message);

            if (snapshot.RequestId != requestId)
            {
                return false;
            }

            var checklist = snapshot.Checklist is null
                ? "no checklist selected"
                : $"checklist {snapshot.Checklist.Id} ({snapshot.Checklist.Revision})";
            result =
                $"Bidirectional CommBus probe succeeded. " +
                $"EFB version: {snapshot.EfbVersion}; " +
                $"instance: {snapshot.InstanceId}; " +
                $"{checklist}; " +
                $"progress: {snapshot.CompletedRequiredItems}/{snapshot.TotalRequiredItems}.";
            return true;
        }
        catch (Exception error) when (
            error is InvalidDataException or ChecklistProtocolException or System.Text.Json.JsonException)
        {
            return false;
        }
    }
}
