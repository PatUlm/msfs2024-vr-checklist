namespace VRChecklist.Transport;

public enum ChecklistSnapshotDisposition
{
    New,
    Repeated,
    Stale,
}

public sealed class ChecklistSnapshotSequenceTracker
{
    private string? currentSessionId;
    private long currentSequence;

    public ChecklistSnapshotDisposition Observe(ChecklistStateSnapshot snapshot)
    {
        if (snapshot.SessionId == currentSessionId)
        {
            if (snapshot.Sequence < currentSequence)
            {
                return ChecklistSnapshotDisposition.Stale;
            }

            if (snapshot.Sequence == currentSequence)
            {
                return ChecklistSnapshotDisposition.Repeated;
            }
        }

        currentSessionId = snapshot.SessionId;
        currentSequence = snapshot.Sequence;
        return ChecklistSnapshotDisposition.New;
    }
}

public readonly record struct ChecklistProgress(string Label, double Percent)
{
    public static ChecklistProgress FromSnapshot(ChecklistStateSnapshot snapshot) =>
        new(
            $"{snapshot.CompletedRequiredItems} / {snapshot.TotalRequiredItems}",
            snapshot.TotalRequiredItems == 0
                ? 0
                : 100d * snapshot.CompletedRequiredItems / snapshot.TotalRequiredItems);
}
