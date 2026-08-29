using System.Text;

namespace VRChecklist.TransportProbe;

internal sealed class CommBusMessageAssembler
{
    private readonly MemoryStream buffer = new();
    private uint expectedParts;
    private uint nextPart;

    internal string? Append(uint entryNumber, uint outOf, ReadOnlySpan<byte> data)
    {
        if (outOf == 0 || entryNumber >= outOf)
        {
            Reset();
            throw new InvalidDataException(
                $"Invalid CommBus chunk {entryNumber + 1}/{outOf}.");
        }

        if (entryNumber == 0)
        {
            Reset();
            expectedParts = outOf;
        }

        if (expectedParts != outOf || entryNumber != nextPart)
        {
            Reset();
            throw new InvalidDataException(
                $"Unexpected CommBus chunk {entryNumber + 1}/{outOf}.");
        }

        var nullIndex = data.IndexOf((byte)0);
        var content = nullIndex >= 0 ? data[..nullIndex] : data;
        buffer.Write(content);
        nextPart += 1;

        if (nextPart != expectedParts)
        {
            return null;
        }

        var message = Encoding.UTF8.GetString(buffer.ToArray());
        Reset();
        return message;
    }

    private void Reset()
    {
        buffer.SetLength(0);
        expectedParts = 0;
        nextPart = 0;
    }
}
