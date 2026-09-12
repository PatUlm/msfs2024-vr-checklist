namespace VRChecklist.Transport;

/*
 * Decides which groups a snapshot newly completed. Every group of a checklist
 * is a closed unit of work for the pilot, so the companion announces each
 * group end once. The first snapshot of a session or checklist only sets the
 * baseline: a companion started mid-flight, a reconnect or a restored EFB
 * state must not replay announcements for groups completed earlier. Repeated
 * snapshots (same session and sequence) never announce.
 */
public sealed class ChecklistGroupCompletionTracker
{
    private string? sessionId;
    private string? checklistKey;
    private HashSet<string> completedGroupIds = new(StringComparer.Ordinal);

    public IReadOnlyList<string> Observe(ChecklistStateSnapshot snapshot, bool isRepeated)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        var key = snapshot.Checklist is null
            ? null
            : $"{snapshot.Checklist.Id}@{snapshot.Checklist.Revision}";
        var reported = snapshot.CompletedGroupIds ?? [];
        var isBaseline =
            snapshot.SessionId != sessionId ||
            key != checklistKey ||
            snapshot.CompletedGroupIds is null;

        sessionId = snapshot.SessionId;
        checklistKey = key;

        if (isBaseline || isRepeated)
        {
            completedGroupIds = new HashSet<string>(reported, StringComparer.Ordinal);
            return [];
        }

        var newlyCompleted = reported
            .Where(id => !completedGroupIds.Contains(id))
            .ToArray();
        completedGroupIds = new HashSet<string>(reported, StringComparer.Ordinal);
        return newlyCompleted;
    }
}
