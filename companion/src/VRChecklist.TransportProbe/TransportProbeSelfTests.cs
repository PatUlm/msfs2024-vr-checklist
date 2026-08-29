using System.Text;
using VRChecklist.Transport;

namespace VRChecklist.TransportProbe;

internal static class TransportProbeSelfTests
{
    internal static int Run()
    {
        try
        {
            ReassemblesUtf8SplitAcrossChunks();
            RejectsOutOfOrderChunks();
            ParsesChecklistStateSnapshot();
            RejectsIncompatibleChecklistStateSnapshot();
            CreatesChecklistStateRequest();
            Console.WriteLine("Transport probe self-tests passed.");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error);
            return 1;
        }
    }

    private static void ParsesChecklistStateSnapshot()
    {
        const string payload = """
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

        var snapshot = ChecklistStateProtocol.ParseSnapshot(payload);
        Assert(snapshot.Sequence == 7, "The snapshot sequence was not parsed.");
        Assert(snapshot.Checklist?.Id == "diamond-da42", "The checklist ID was not parsed.");
        Assert(snapshot.NextOpenItem?.Challenge == "Battery", "The next item was not parsed.");
    }

    private static void RejectsIncompatibleChecklistStateSnapshot()
    {
        const string payload = """
            {
              "protocolVersion": 2,
              "type": "stateSnapshot",
              "sessionId": "session-1",
              "sequence": 1,
              "sentAt": "2026-08-29T12:00:00Z",
              "efbVersion": "0.2.4",
              "instanceId": "instance-1",
              "aircraft": { "atcModel": "", "atcType": "", "title": "", "displayName": null },
              "completedRequiredItems": 0,
              "totalRequiredItems": 0,
              "isComplete": false
            }
            """;

        try
        {
            _ = ChecklistStateProtocol.ParseSnapshot(payload);
        }
        catch (ChecklistProtocolException)
        {
            return;
        }

        throw new InvalidOperationException("An incompatible protocol version was accepted.");
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

        try
        {
            _ = assembler.Append(1, 2, "late"u8);
        }
        catch (InvalidDataException)
        {
            return;
        }

        throw new InvalidOperationException("An out-of-order chunk was accepted.");
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }
}
