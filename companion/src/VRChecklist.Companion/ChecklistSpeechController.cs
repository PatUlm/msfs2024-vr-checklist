using VRChecklist.Transport;

namespace VRChecklist.Companion;

// Serializes device operations and retains at most one pending item while a
// completion/test clip is playing. No timers, polling, or unbounded speech queue.
// `play(null)` is the group completion clip; `resolvePhase` names the clip
// that replaces it when the group also ends its phase.
public sealed class ChecklistSpeechController(
    Func<string?, Task> play,
    Action stop,
    Func<ChecklistStateSnapshot, string?> resolve,
    Action<string> reportError,
    bool enabled,
    Func<CompletedPhase, string?>? resolvePhase = null) : IDisposable
{
    private readonly object gate = new();
    private readonly ChecklistGroupCompletionTracker groups = new();
    private ChecklistStateSnapshot? current;
    private string? lastKey;
    private string? lastScope;
    private string? lastSession;
    private string? lastInstance;
    private bool reconnected;
    private long flight;
    private string? pendingItem;
    private bool itemEnabled = enabled;
    private bool playing;
    private bool completionPlaying;
    private bool testPlaying;
    private bool disposed;
    private long generation;

    public void Observe(ChecklistStateSnapshot snapshot, bool repeated)
    {
        lock (gate)
        {
            if (disposed) return;
            current = snapshot;
            // A new session from the same EFB context or after a reconnect is a new
            // flight. A new context with its own session is treated as a VR switch.
            if (lastSession is not null && snapshot.SessionId != lastSession &&
                (reconnected || snapshot.InstanceId == lastInstance)) flight++;
            lastSession = snapshot.SessionId;
            lastInstance = snapshot.InstanceId;
            reconnected = false;
            var scope = snapshot.Checklist is { } checklist
                ? $"{snapshot.SessionId}/{snapshot.Aircraft.AtcModel}/{snapshot.Aircraft.AtcType}/{snapshot.Aircraft.Title}/{checklist.Id}@{checklist.Revision}"
                : null;
            if (scope != lastScope)
            {
                pendingItem = null;
                if (!testPlaying) CancelPlayback();
                lastScope = scope;
            }
            var aircraft = snapshot.Aircraft;
            // Without a checklist, key by flight instead of session, since a VR
            // switch without a checklist to restore starts a new EFB session.
            var key = scope is not null ? $"{scope}/{snapshot.ActiveGroup?.Id}/{snapshot.NextOpenItem?.Id}"
                : aircraft.HasIdentity() ? $"no-checklist/{flight}/{aircraft.AtcModel}/{aircraft.AtcType}/{aircraft.Title}"
                : null;
            var changed = key != lastKey;
            lastKey = key;
            var completion = groups.Observe(snapshot, repeated);
            // A settings test is local, not a simulator announcement. Continue
            // tracking state, but never replace it with a group or flight event.
            if (testPlaying)
            {
                if (changed) pendingItem = itemEnabled ? ResolveCurrent() : null;
                return;
            }
            if (!completion.IsEmpty)
            {
                pendingItem = itemEnabled ? ResolveCurrent() : null;
                Start(completion.Phases.Count > 0 ? ResolvePhase(completion.Phases[^1]) : null, announcement: true);
            }
            else if (changed && !repeated)
            {
                var file = itemEnabled ? ResolveCurrent() : null;
                if (completionPlaying) pendingItem = file;
                else
                {
                    CancelPlayback();
                    if (file is not null) Start(file);
                }
            }
        }
    }

    public void SetEnabled(bool value)
    {
        lock (gate)
        {
            if (disposed || value == itemEnabled) return;
            itemEnabled = value;
            pendingItem = null;
            if (!completionPlaying) CancelPlayback();
            if (value)
            {
                var file = ResolveCurrent();
                if (completionPlaying) pendingItem = file;
                else if (file is not null) Start(file);
            }
        }
    }

    public void Disconnect()
    {
        lock (gate)
        {
            if (disposed) return;
            current = null;
            pendingItem = null;
            reconnected = true;
            groups.ResetBaseline();
            // Keep the last item identity: a reconnect must not repeat it.
            // Connection retries must not interrupt a local Settings test.
            if (!testPlaying) CancelPlayback();
        }
    }

    public Task TestAsync()
    {
        lock (gate)
        {
            if (disposed) return Task.FromException(new ObjectDisposedException(nameof(ChecklistSpeechController)));
            pendingItem = null;
            return Start(null, announcement: true, isTest: true);
        }
    }

    private string? ResolveCurrent()
    {
        if (current is null) return null;
        try { return resolve(current); }
        catch (Exception error) { reportError(error.Message); return null; }
    }

    private string? ResolvePhase(CompletedPhase phase)
    {
        if (resolvePhase is null) return null;
        try { return resolvePhase(phase); }
        catch (Exception error) { reportError(error.Message); return null; }
    }

    private Task Start(string? file, bool announcement = false, bool isTest = false)
    {
        CancelPlayback();
        playing = true;
        completionPlaying = announcement;
        testPlaying = isTest;
        var token = generation;
        Task task;
        try { task = play(file); }
        catch (Exception error) { task = Task.FromException(error); }
        _ = task.ContinueWith(finished =>
        {
            lock (gate)
            {
                if (disposed || token != generation) return;
                playing = false;
                completionPlaying = false;
                testPlaying = false;
                if (finished.IsFaulted)
                    reportError(finished.Exception?.GetBaseException().Message ?? "Playback failed.");
                var next = pendingItem;
                pendingItem = null;
                if (itemEnabled && next is not null) Start(next);
            }
        }, CancellationToken.None, TaskContinuationOptions.None, TaskScheduler.Default);
        return task;
    }

    private void CancelPlayback()
    {
        generation++;
        if (playing) stop();
        playing = false;
        completionPlaying = false;
        testPlaying = false;
    }

    public void Dispose()
    {
        lock (gate)
        {
            if (disposed) return;
            disposed = true;
            pendingItem = null;
            CancelPlayback();
        }
    }
}
