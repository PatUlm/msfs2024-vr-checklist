using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using VRChecklist.Transport;

namespace VRChecklist.TransportProbe;

internal static class TransportProbeSelfTests
{
    private const string ValidSnapshotPayload = """
        {
          "protocolVersion": 1,
          "type": "stateSnapshot",
          "sessionId": "session-1",
          "sequence": 7,
          "sentAt": "2026-08-29T12:00:00Z",
          "efbVersion": "0.2.4-dev.test",
          "instanceId": "instance-1",
          "aircraft": {
            "atcModel": "DA42",
            "atcType": "DA42",
            "title": "DA42 VI",
            "displayName": "DA42 VI"
          },
          "checklist": {
            "id": "diamond-da42",
            "revision": "1",
            "title": "Normal Procedures"
          },
          "activeGroup": { "id": "before-start", "title": "Before Start", "index": 0 },
          "nextOpenItem": { "id": "battery", "challenge": "Battery", "response": "On" },
          "completedRequiredItems": 2,
          "totalRequiredItems": 20,
          "isComplete": false
        }
        """;

    internal static int Run()
    {
        (string Name, Action Body)[] tests =
        [
            ("reassembles UTF-8 split across chunks", ReassemblesUtf8SplitAcrossChunks),
            ("rejects out-of-order chunks", RejectsOutOfOrderChunks),
            ("resets the assembler after a malformed sequence", ResetsAssemblerAfterMalformedSequence),
            ("accepts a new chunk sequence", AcceptsNewChunkSequence),
            ("rejects outOf zero", RejectsOutOfZero),
            ("parses a checklist state snapshot", ParsesChecklistStateSnapshot),
            ("rejects malformed snapshot JSON", RejectsMalformedSnapshotJson),
            ("rejects incompatible snapshot protocols", RejectsIncompatibleChecklistStateSnapshot),
            ("rejects non-positive snapshot sequences", RejectsNonPositiveSnapshotSequence),
            ("rejects impossible snapshot progress", RejectsImpossibleSnapshotProgress),
            ("rejects empty required snapshot fields", RejectsEmptyRequiredSnapshotFields),
            ("rejects malformed nested snapshot records", RejectsMalformedNestedSnapshotRecords),
            ("deduplicates snapshots by session and sequence", DeduplicatesSnapshotsBySessionAndSequence),
            ("formats zero-of-zero progress", FormatsZeroOfZeroProgress),
            ("creates a checklist state request", CreatesChecklistStateRequest),
        ];

        var failures = 0;

        foreach (var (name, body) in tests)
        {
            try
            {
                body();
                Console.WriteLine($"PASS: {name}");
            }
            catch (Exception error)
            {
                failures += 1;
                Console.Error.WriteLine($"FAIL: {name}: {error.Message}");
            }
        }

        if (failures > 0)
        {
            Console.Error.WriteLine(
                $"Transport probe self-tests failed: {failures} of {tests.Length} cases failed.");
            return 1;
        }

        Console.WriteLine($"Transport probe self-tests passed: {tests.Length} cases.");
        return 0;
    }

    private static void ParsesChecklistStateSnapshot()
    {
        var snapshot = ChecklistStateProtocol.ParseSnapshot(ValidSnapshotPayload);
        Assert(snapshot.Sequence == 7, "The snapshot sequence was not parsed.");
        Assert(snapshot.Checklist?.Id == "diamond-da42", "The checklist ID was not parsed.");
        Assert(snapshot.NextOpenItem?.Challenge == "Battery", "The next item was not parsed.");
    }

    private static void RejectsMalformedSnapshotJson()
    {
        ExpectThrows<JsonException>(
            () => ChecklistStateProtocol.ParseSnapshot("{not-json}"),
            "Malformed snapshot JSON was accepted.");
        ExpectThrows<InvalidDataException>(
            () => ChecklistStateProtocol.ParseSnapshot("{}"),
            "A snapshot without required data was accepted.");
    }

    private static void RejectsIncompatibleChecklistStateSnapshot()
    {
        var payload = SnapshotWith(snapshot => snapshot["protocolVersion"] = 2);

        ExpectThrows<ChecklistProtocolException>(
            () => ChecklistStateProtocol.ParseSnapshot(payload),
            "An incompatible protocol version was accepted.");
    }

    private static void RejectsNonPositiveSnapshotSequence()
    {
        foreach (var sequence in new[] { 0, -1 })
        {
            var payload = SnapshotWith(snapshot => snapshot["sequence"] = sequence);
            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"Snapshot sequence {sequence} was accepted.");
        }
    }

    private static void RejectsImpossibleSnapshotProgress()
    {
        var completedOverTotal = SnapshotWith(snapshot =>
        {
            snapshot["completedRequiredItems"] = 21;
            snapshot["totalRequiredItems"] = 20;
        });
        ExpectThrows<InvalidDataException>(
            () => ChecklistStateProtocol.ParseSnapshot(completedOverTotal),
            "Progress above the total was accepted.");

        foreach (var field in new[] { "completedRequiredItems", "totalRequiredItems" })
        {
            var negativeProgress = SnapshotWith(snapshot => snapshot[field] = -1);
            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(negativeProgress),
                $"Negative {field} was accepted.");
        }
    }

    private static void RejectsEmptyRequiredSnapshotFields()
    {
        foreach (var field in new[] { "type", "sessionId", "efbVersion", "instanceId" })
        {
            var payload = SnapshotWith(snapshot => snapshot[field] = " ");
            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"An empty required field '{field}' was accepted.");
        }
    }

    private static void RejectsMalformedNestedSnapshotRecords()
    {
        (string Field, Action<JsonObject> Mutate)[] cases =
        [
            ("checklist.id", snapshot => Nested(snapshot, "checklist")["id"] = " "),
            ("checklist.revision", snapshot => Nested(snapshot, "checklist")["revision"] = " "),
            ("checklist.title", snapshot => Nested(snapshot, "checklist")["title"] = " "),
            ("activeGroup.id", snapshot => Nested(snapshot, "activeGroup")["id"] = " "),
            ("activeGroup.title", snapshot => Nested(snapshot, "activeGroup")["title"] = " "),
            ("activeGroup.index", snapshot => Nested(snapshot, "activeGroup")["index"] = -1),
            ("nextOpenItem.id", snapshot => Nested(snapshot, "nextOpenItem")["id"] = " "),
            ("nextOpenItem.challenge", snapshot => Nested(snapshot, "nextOpenItem")["challenge"] = " "),
            ("nextOpenItem.response", snapshot => Nested(snapshot, "nextOpenItem")["response"] = " "),
            ("activeGroup.index missing", snapshot => Nested(snapshot, "activeGroup").Remove("index")),
        ];

        foreach (var (field, mutate) in cases)
        {
            var payload = SnapshotWith(mutate);
            ExpectThrows<JsonException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"A malformed nested field '{field}' was accepted.",
                allowInvalidDataException: true);
        }
    }

    private static void DeduplicatesSnapshotsBySessionAndSequence()
    {
        var tracker = new ChecklistSnapshotSequenceTracker();

        Assert(
            tracker.Observe(ParseSnapshot("session-1", 7)) == ChecklistSnapshotDisposition.New,
            "The first snapshot was not treated as new.");
        Assert(
            tracker.Observe(ParseSnapshot("session-1", 7)) == ChecklistSnapshotDisposition.Repeated,
            "An identical session and sequence was not treated as repeated.");
        Assert(
            tracker.Observe(ParseSnapshot("session-1", 6)) == ChecklistSnapshotDisposition.Stale,
            "An older sequence in the same session was not rejected as stale.");
        Assert(
            tracker.Observe(ParseSnapshot("session-1", 8)) == ChecklistSnapshotDisposition.New,
            "A newer sequence in the same session was not treated as new.");
        Assert(
            tracker.Observe(ParseSnapshot("session-2", 1)) == ChecklistSnapshotDisposition.New,
            "The first sequence of a new session was not treated as new.");
        Assert(
            tracker.Observe(ParseSnapshot("session-2", 1)) == ChecklistSnapshotDisposition.Repeated,
            "A repeated sequence in the new session was not deduplicated.");
    }

    private static void FormatsZeroOfZeroProgress()
    {
        var payload = SnapshotWith(snapshot =>
        {
            snapshot["checklist"] = null;
            snapshot["activeGroup"] = null;
            snapshot["nextOpenItem"] = null;
            snapshot["completedRequiredItems"] = 0;
            snapshot["totalRequiredItems"] = 0;
        });
        var progress = ChecklistProgress.FromSnapshot(
            ChecklistStateProtocol.ParseSnapshot(payload));

        Assert(progress.Label == "0 / 0", "Zero progress has the wrong label.");
        Assert(progress.Percent == 0, "Zero progress has a non-zero percentage.");
    }

    private static void CreatesChecklistStateRequest()
    {
        var request = ChecklistStateProtocol.CreateRequest("request-1");

        Assert(
            request.Contains("\"protocolVersion\":1", StringComparison.Ordinal) &&
            request.Contains("\"type\":\"stateRequest\"", StringComparison.Ordinal) &&
            request.Contains("\"requestId\":\"request-1\"", StringComparison.Ordinal),
            "The checklist state request does not follow protocol v1.");
    }

    private static void ReassemblesUtf8SplitAcrossChunks()
    {
        const string expected = "{\"message\":\"Grüße\"}";
        var bytes = Encoding.UTF8.GetBytes(expected + '\0');
        var split = Array.IndexOf(bytes, (byte)0xC3) + 1;
        var assembler = new CommBusMessageAssembler();

        Assert(
            assembler.Append(0, 2, bytes.AsSpan(0, split)) is null,
            "The first chunk completed the message too early.");
        Assert(
            assembler.Append(1, 2, bytes.AsSpan(split)) == expected,
            "A UTF-8 sequence split across chunks was not preserved.");
    }

    private static void RejectsOutOfOrderChunks()
    {
        var assembler = new CommBusMessageAssembler();

        ExpectThrows<InvalidDataException>(
            () => assembler.Append(1, 2, "late"u8),
            "An out-of-order chunk was accepted.");
    }

    private static void ResetsAssemblerAfterMalformedSequence()
    {
        var assembler = new CommBusMessageAssembler();
        Assert(
            assembler.Append(0, 2, "partial"u8) is null,
            "A partial message completed too early.");
        ExpectThrows<InvalidDataException>(
            () => assembler.Append(1, 3, "invalid"u8),
            "A mismatched chunk count was accepted.");
        Assert(
            assembler.Append(0, 1, "fresh\0"u8) == "fresh",
            "The assembler did not recover after a malformed sequence.");
    }

    private static void AcceptsNewChunkSequence()
    {
        var assembler = new CommBusMessageAssembler();
        Assert(
            assembler.Append(0, 1, "first\0"u8) == "first",
            "The first single-chunk sequence was not assembled.");
        Assert(
            assembler.Append(0, 1, "second\0"u8) == "second",
            "A new chunk sequence was not assembled.");
    }

    private static void RejectsOutOfZero()
    {
        var assembler = new CommBusMessageAssembler();
        ExpectThrows<InvalidDataException>(
            () => assembler.Append(0, 0, "invalid"u8),
            "A CommBus chunk with outOf zero was accepted.");
        Assert(
            assembler.Append(0, 1, "recovered\0"u8) == "recovered",
            "The assembler did not recover after outOf zero.");
    }

    private static ChecklistStateSnapshot ParseSnapshot(string sessionId, long sequence) =>
        ChecklistStateProtocol.ParseSnapshot(SnapshotWith(snapshot =>
        {
            snapshot["sessionId"] = sessionId;
            snapshot["sequence"] = sequence;
        }));

    private static string SnapshotWith(Action<JsonObject> mutate)
    {
        var snapshot = JsonNode.Parse(ValidSnapshotPayload)?.AsObject()
            ?? throw new InvalidOperationException("The valid snapshot fixture is empty.");
        mutate(snapshot);
        return snapshot.ToJsonString();
    }

    private static JsonObject Nested(JsonObject snapshot, string propertyName) =>
        snapshot[propertyName]?.AsObject()
        ?? throw new InvalidOperationException($"Snapshot fixture '{propertyName}' is missing.");

    private static void ExpectThrows<TException>(
        Action action,
        string failureMessage,
        bool allowInvalidDataException = false)
        where TException : Exception
    {
        try
        {
            action();
        }
        catch (TException)
        {
            return;
        }
        catch (InvalidDataException) when (allowInvalidDataException)
        {
            return;
        }
        catch (Exception error)
        {
            throw new InvalidOperationException(
                $"{failureMessage} Received {error.GetType().Name} instead.",
                error);
        }

        throw new InvalidOperationException(failureMessage);
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }
}
