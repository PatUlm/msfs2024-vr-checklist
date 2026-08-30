namespace VRChecklist.Transport;

internal sealed class CommBusThreadAffinityGuard
{
    private int workerThreadId;

    internal void Enter()
    {
        var currentThreadId = Environment.CurrentManagedThreadId;
        var expectedThreadId = Volatile.Read(ref workerThreadId);

        if (expectedThreadId == 0)
        {
            expectedThreadId = Interlocked.CompareExchange(
                ref workerThreadId,
                currentThreadId,
                0);

            if (expectedThreadId == 0)
            {
                return;
            }
        }

        if (expectedThreadId != currentThreadId)
        {
            throw new InvalidOperationException(
                "CommBusClient must be used and disposed by a single worker thread.");
        }
    }
}
