using System.Text;

namespace VRChecklist.TransportProbe;

internal static class TransportProbeSelfTests
{
    internal static int Run()
    {
        try
        {
            ReassemblesUtf8SplitAcrossChunks();
            RejectsOutOfOrderChunks();
            Console.WriteLine("Transport probe self-tests passed.");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error);
            return 1;
        }
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
