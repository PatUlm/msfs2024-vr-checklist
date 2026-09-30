using System.Collections.Concurrent;
using System.Text.Json;
using VRChecklist.Companion;
using VRChecklist.Transport;

namespace VRChecklist.TransportProbe;

internal static class SpeechSelfTests
{
    private static ChecklistStateSnapshot Snapshot(string? item, string group = "group", string session = "session",
        string[]? completed = null) => new(1, "stateSnapshot", null, session, 1, DateTimeOffset.UtcNow, "test", "instance",
        new("model", "type", "title", null), new("checklist", "revision", "Checklist"),
        new(group, group, 0), item is null ? null : new(item, item, "On"), 0, 10, false, completed ?? []);

    // A null title stands for the empty identity of a flight reset.
    private static ChecklistStateSnapshot Unmatched(string? title, string session = "session",
        string instance = "instance") =>
        Snapshot(null, session: session) with
        {
            InstanceId = instance,
            Aircraft = title is null ? new("", "", "", null) : new("model", "type", title, null),
            Checklist = null,
            ActiveGroup = null,
        };

    public static void Transitions()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(fake.Play, fake.Stop,
            snapshot => snapshot.NextOpenItem?.Id == "excluded" ? null : snapshot.NextOpenItem?.Id,
            fake.Errors.Enqueue, true);
        speech.Observe(Snapshot("a"), false);
        speech.Observe(Snapshot("a") with { Sequence = 2 }, false);
        speech.Observe(Snapshot("a"), true);
        Require(fake.Calls.SequenceEqual(["a"]), "Repeated current item was announced.");
        speech.Observe(Snapshot("b"), false);
        Require(fake.Calls.SequenceEqual(["a", "b"]) && fake.Stops == 1, "New item did not replace old playback.");
        speech.Disconnect();
        speech.Observe(Snapshot("b"), true);
        Require(fake.Calls.Count == 2, "Reconnect repeated the current item.");
        speech.Observe(Snapshot("a"), false);
        speech.Observe(Snapshot("a", group: "other"), false);
        speech.Observe(Snapshot("excluded"), false);
        Require(fake.Calls.SequenceEqual(["a", "b", "a", "a"]), "Reopened/group item or exclusion failed.");
        speech.Observe(Snapshot("a", session: "new"), false);
        Require(fake.Calls.Count == 5, "New session suppressed a legitimate announcement.");
    }

    public static void CompletionOrdering()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(fake.Play, fake.Stop,
            snapshot => snapshot.NextOpenItem?.Id, fake.Errors.Enqueue, true);
        speech.Observe(Snapshot("a"), false);
        speech.Observe(Snapshot(null, completed: ["group"]), false);
        speech.Observe(Snapshot("b", "next", completed: ["group"]), false);
        speech.Observe(Snapshot("c", "next", completed: ["group"]), false);
        Require(fake.Calls.SequenceEqual(["a", "<completion>"]), "Group end was interrupted or stale items queued.");
        fake.Finish();
        Require(SpinWait.SpinUntil(() => fake.Calls.Count == 3, 3000), "Latest item was not played after group end.");
        Require(fake.Calls.Last() == "c", "An obsolete pending item played.");
        speech.Observe(Snapshot(null, "next", completed: ["group", "next"]), false);
        speech.Observe(Snapshot("d", "last", completed: ["group", "next"]), false);
        speech.SetEnabled(false);
        fake.Finish();
        speech.Dispose();
        Require(!fake.Calls.Contains("d"), "Disabling left pending speech active.");
    }

    public static void PhaseSkip()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(fake.Play, fake.Stop,
            snapshot => snapshot.NextOpenItem?.Id, fake.Errors.Enqueue, true);
        speech.Observe(Snapshot("start-item", "start"), false);
        var skipped = Snapshot("taxi-item", "taxi", completed: ["preparation", "start", "after-start"]);
        speech.Observe(skipped, false);
        speech.Observe(skipped, true);
        Require(fake.Calls.SequenceEqual(["start-item", "<completion>"]),
            "Skipping multiple groups must produce only one completion announcement.");
        fake.Finish();
        Require(SpinWait.SpinUntil(() => fake.Calls.Count == 3, 3000),
            "The first item of the next phase was not announced.");
        Require(fake.Calls.Last() == "taxi-item", "A skipped item was announced.");
        speech.Observe(skipped, false);
        Require(fake.Calls.Count == 3, "Repeated phase state replayed speech.");
    }

    public static void ToggleAndReset()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(fake.Play, fake.Stop,
            snapshot => snapshot.NextOpenItem?.Id, fake.Errors.Enqueue, false);
        speech.Observe(Snapshot("a"), false);
        Require(fake.Calls.IsEmpty, "Disabled item speech played.");
        speech.SetEnabled(true);
        Require(fake.Calls.SequenceEqual(["a"]), "Enabling did not read current item.");
        speech.SetEnabled(false);
        speech.Observe(Snapshot("b"), false);
        speech.SetEnabled(true);
        Require(fake.Calls.SequenceEqual(["a", "b"]), "Toggle did not use latest item.");
        speech.Observe(Snapshot(null, completed: ["group"]), false);
        speech.Observe(Snapshot("c", "next", completed: ["group"]), false);
        speech.Observe(Snapshot("d", session: "new"), false);
        Require(fake.Calls.Last() == "d", "New session retained an old completion/pending item.");
        speech.Disconnect();
        speech.SetEnabled(false);
        speech.SetEnabled(true);
        Require(fake.Calls.Last() == "d" && fake.Calls.Count == 4, "Offline enable read stale snapshot.");
    }

    public static void NoChecklist()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(fake.Play, fake.Stop,
            snapshot => snapshot.Checklist is not null ? snapshot.NextOpenItem?.Id
                : snapshot.Aircraft.HasIdentity() ? "<none>" : null,
            fake.Errors.Enqueue, true);
        speech.Observe(Unmatched("unknown"), false);
        speech.Observe(Unmatched("unknown") with { Sequence = 2 }, false);
        speech.Disconnect();
        speech.Observe(Unmatched("unknown"), false);
        // A VR switch can create a new EFB context with a new session.
        speech.Observe(Unmatched("unknown", "vr", "vr"), false);
        Require(fake.Calls.SequenceEqual(["<none>"]), "Reconnect or VR switch repeated the missing checklist.");
        speech.Observe(Unmatched(null, "flight-2", "vr"), false);
        speech.Observe(Unmatched("unknown", "flight-2", "vr"), false);
        Require(fake.Calls.Count == 2, "A new flight after a reset snapshot was not announced.");
        // The same context reporting a new session means its reset snapshot was missed.
        speech.Observe(Unmatched("unknown", "flight-3", "vr"), false);
        Require(fake.Calls.Count == 3, "A new flight without a reset snapshot was not announced.");
        speech.Disconnect();
        speech.Observe(Unmatched("unknown", "restart", "restart"), false);
        Require(fake.Calls.Count == 4, "A simulator restart did not announce the missing checklist.");
        speech.Observe(Snapshot("a"), false);
        speech.Observe(Unmatched("other"), false);
        Require(fake.Calls.SequenceEqual(["<none>", "<none>", "<none>", "<none>", "a", "<none>"]),
            "An aircraft change without checklist was not announced.");
        speech.SetEnabled(false);
        speech.Observe(Unmatched("third"), false);
        Require(fake.Calls.Count == 6, "Disabled item speech announced a missing checklist.");
    }

    public static void TestSoundSurvivesConnectionEvents()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(fake.Play, fake.Stop,
            snapshot => snapshot.NextOpenItem?.Id, fake.Errors.Enqueue, false);
        // Retry notifications arrive even without a running simulator.
        for (var index = 0; index < 20; index++)
        {
            var test = speech.TestAsync();
            var stops = fake.Stops;
            speech.Disconnect();
            speech.Disconnect();
            speech.Observe(Snapshot("a", session: "session-" + index), false);
            speech.Observe(Snapshot(null, session: "session-" + index, completed: ["group"]), false);
            Require(!test.IsCompleted && fake.Stops == stops,
                "Simulator retry, initial snapshot or group completion interrupted Test sound.");
            fake.Finish();
            test.GetAwaiter().GetResult();
        }
        Require(fake.Calls.Count == 20, "Test sound was replaced by a simulator announcement.");
    }

    public static void Failures()
    {
        var fake = new Player();
        using var speech = new ChecklistSpeechController(
            file => file == "bad" ? Task.FromException(new IOException("device unavailable")) : fake.Play(file),
            fake.Stop, snapshot => snapshot.NextOpenItem?.Id == "mismatch"
                ? throw new InvalidDataException("revision mismatch") : snapshot.NextOpenItem?.Id,
            fake.Errors.Enqueue, true);
        speech.Observe(Snapshot("bad"), false);
        Require(SpinWait.SpinUntil(() => fake.Errors.Count == 1, 3000), "Device error was not reported.");
        speech.Observe(Snapshot("mismatch"), false);
        Require(fake.Errors.Count == 2, "Catalog error was not reported.");
        speech.Observe(Snapshot("good"), false);
        Require(fake.Calls.Last() == "good", "Audio error blocked later state changes.");
    }

    public static void Assets()
    {
        var catalog = ItemAudioCatalog.Load();
        using var resource = typeof(ItemAudioCatalog).Assembly.GetManifestResourceStream(
            "VRChecklist.Companion.audio.items-manifest.json")!;
        using var json = JsonDocument.Parse(resource);
        foreach (var asset in json.RootElement.GetProperty("assets").EnumerateArray())
        {
            var clip = catalog.GetClip(asset.GetProperty("file").GetString()!);
            Require(clip.Duration.TotalSeconds is > 0.2 and < 30, "Bundled item clip failed to decode.");
        }
        var revision = json.RootElement.GetProperty("checklists").EnumerateArray()
            .Single(entry => entry.GetProperty("id").GetString() == "airbus-a400m")
            .GetProperty("revision").GetString()!;
        var snapshot = Snapshot("apu", "electrical-power-up") with
        { Checklist = new("airbus-a400m", revision, "A400M") };
        Require(catalog.Resolve(snapshot) is not null, "Known item did not resolve.");
        Require(catalog.Resolve(snapshot with { ActiveGroup = new("fsm-init", "FMS Setup", 8),
            NextOpenItem = new("init", "[INIT] Route", "Set") }) is not null, "A400M FMS item did not resolve.");
        var unmatched = snapshot with { Checklist = null, ActiveGroup = null, NextOpenItem = null };
        Require(catalog.Resolve(unmatched) is { } none && catalog.GetClip(none).Duration.TotalSeconds is > 0.2 and < 30,
            "The no-checklist clip did not resolve or decode.");
        Require(catalog.Resolve(unmatched with { Aircraft = new("", "", "", null) }) is null,
            "A flight reset resolved an announcement.");
        Require(catalog.Resolve(unmatched with { Aircraft = new("-", " ", "--", null) }) is null,
            "A punctuation-only identity resolved an announcement.");
        try
        {
            catalog.Resolve(snapshot with { Checklist = new("airbus-a400m", "older", "A400M") });
            throw new InvalidOperationException("Mismatched revision was accepted.");
        }
        catch (InvalidDataException) { }
    }

    private sealed class Player
    {
        public ConcurrentQueue<string> Calls { get; } = new();
        public ConcurrentQueue<string> Errors { get; } = new();
        private TaskCompletionSource? completion;
        public int Stops { get; private set; }
        public Task Play(string? file)
        {
            completion = new(TaskCreationOptions.RunContinuationsAsynchronously);
            Calls.Enqueue(file ?? "<completion>");
            return completion.Task;
        }
        public void Stop() { Stops++; completion?.TrySetResult(); }
        public void Finish() => completion?.TrySetResult();
    }

    private static void Require(bool value, string message)
    {
        if (!value) throw new InvalidOperationException(message);
    }
}
