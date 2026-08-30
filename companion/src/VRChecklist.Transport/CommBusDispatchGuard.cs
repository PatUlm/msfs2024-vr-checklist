namespace VRChecklist.Transport;

internal sealed class CommBusDispatchGuard
{
    private Exception? fatalError;

    internal void Invoke(Action dispatch)
    {
        try
        {
            dispatch();
        }
        catch (InvalidDataException)
        {
            // A malformed packet is local to its chunk sequence. The assembler
            // resets itself on sequence errors, and the next packet must still
            // be allowed through this dispatch run.
        }
        catch (Exception error)
        {
            fatalError ??= error;
        }
    }

    internal Exception? TakeFatalError()
    {
        var error = fatalError;
        fatalError = null;
        return error;
    }
}
