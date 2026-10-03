namespace VRChecklist.Transport;

/* Groups and phase blocks that one snapshot newly completed. */
public sealed record CompletionChange(
    IReadOnlyList<string> Groups,
    IReadOnlyList<CompletedPhase> Phases)
{
    public static readonly CompletionChange None = new([], []);

    public bool IsEmpty => Groups.Count == 0 && Phases.Count == 0;
}

/*
 * Decides which groups and phases a snapshot newly completed. Every group of
 * a checklist is a closed unit of work for the pilot, so the companion
 * announces each group end once; the last group of a phase gets the phase
 * announcement instead. The first snapshot of a session or checklist only
 * sets the baseline: a companion started mid-flight, a reconnect or a
 * restored EFB state must not replay announcements for groups completed
 * earlier. Repeated snapshots (same session and sequence) never announce.
 * After a lost connection the next snapshot is a baseline as well: a group
 * completed while the companion was disconnected has missed its moment, and a
 * late announcement would be misleading.
 */
public sealed class ChecklistGroupCompletionTracker
{
    private string? sessionId;
    private string? checklistKey;
    private HashSet<string> completedGroupIds = new(StringComparer.Ordinal);
    private HashSet<string> completedPhaseIds = new(StringComparer.Ordinal);

    /* Forgets the session so the next snapshot only sets the baseline. */
    public void ResetBaseline()
    {
        sessionId = null;
        checklistKey = null;
        completedGroupIds = new HashSet<string>(StringComparer.Ordinal);
        completedPhaseIds = new HashSet<string>(StringComparer.Ordinal);
    }

    public CompletionChange Observe(ChecklistStateSnapshot snapshot, bool isRepeated)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        var key = snapshot.Checklist is null
            ? null
            : $"{snapshot.Checklist.Id}@{snapshot.Checklist.Revision}";
        var reported = snapshot.CompletedGroupIds ?? [];
        var reportedPhases = snapshot.CompletedPhases ?? [];
        var isBaseline =
            snapshot.SessionId != sessionId ||
            key != checklistKey ||
            snapshot.CompletedGroupIds is null;
        var previousGroupIds = completedGroupIds;
        var previousPhaseIds = completedPhaseIds;

        sessionId = snapshot.SessionId;
        checklistKey = key;
        completedGroupIds = new HashSet<string>(reported, StringComparer.Ordinal);
        completedPhaseIds = new HashSet<string>(
            reportedPhases.Select(phase => phase.FirstGroupId), StringComparer.Ordinal);

        if (isBaseline || isRepeated)
        {
            return CompletionChange.None;
        }

        return new CompletionChange(
            reported.Where(id => !previousGroupIds.Contains(id)).ToArray(),
            reportedPhases.Where(phase => !previousPhaseIds.Contains(phase.FirstGroupId)).ToArray());
    }
}
