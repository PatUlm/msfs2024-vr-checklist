using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using VRChecklist.Companion;
using VRChecklist.Transport;

namespace VRChecklist.TransportProbe;

internal static class TransportProbeSelfTests
{
    private const string ValidSnapshotPayload = """
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
          "activeGroup": { "id": "before-start", "title": "Before Start", "index": 0, "phase": "Engine Start" },
          "nextOpenItem": { "id": "battery", "challenge": "Battery", "response": "On" },
          "completedRequiredItems": 2,
          "totalRequiredItems": 20,
          "isComplete": false,
          "completedGroupIds": []
        }
        """;

    internal static int Run()
    {
        (string Name, Action Body)[] tests =
        [
            ("edits EFB actions offline and persists them", EfbSettingsSelfTests.OfflineAndPersistence),
            ("synchronizes EFB settings with acknowledgements and reconnects", EfbSettingsSelfTests.AcknowledgementAndReconnect),
            ("correlates EFB replies and expires queued requests", EfbSettingsSelfTests.Exchange),
            ("reassembles UTF-8 split across chunks", ReassemblesUtf8SplitAcrossChunks),
            ("rejects out-of-order chunks", RejectsOutOfOrderChunks),
            ("resets the assembler after a malformed sequence", ResetsAssemblerAfterMalformedSequence),
            ("accepts a new chunk sequence", AcceptsNewChunkSequence),
            ("rejects outOf zero", RejectsOutOfZero),
            ("skips a malformed dispatch and processes the next message", SkipsMalformedDispatch),
            ("consumes a fatal dispatch error once", ConsumesFatalDispatchErrorOnce),
            ("enforces CommBus single-worker affinity", EnforcesCommBusSingleWorkerAffinity),
            ("reports a missing SimConnect.dll", ReportsMissingSimConnectLibrary),
            ("stops the companion worker normally", StopsCompanionWorkerNormally),
            ("stops after a delayed connection attempt", StopsAfterDelayedConnectionAttempt),
            ("stops after a delayed pump", StopsAfterDelayedPump),
            ("parses a checklist state snapshot", ParsesChecklistStateSnapshot),
            ("accepts snapshots from before flight phases", AcceptsSnapshotWithoutPhase),
            ("rejects malformed snapshot JSON", RejectsMalformedSnapshotJson),
            ("rejects incompatible snapshot protocols", RejectsIncompatibleChecklistStateSnapshot),
            ("rejects non-positive snapshot sequences", RejectsNonPositiveSnapshotSequence),
            ("rejects impossible snapshot progress", RejectsImpossibleSnapshotProgress),
            ("rejects empty required snapshot fields", RejectsEmptyRequiredSnapshotFields),
            ("rejects malformed nested snapshot records", RejectsMalformedNestedSnapshotRecords),
            ("deduplicates snapshots by session and sequence", DeduplicatesSnapshotsBySessionAndSequence),
            ("accepts a snapshot without completed group IDs", AcceptsSnapshotWithoutCompletedGroupIds),
            ("rejects malformed completed group IDs", RejectsMalformedCompletedGroupIds),
            ("announces each newly completed group once", AnnouncesEachNewlyCompletedGroupOnce),
            ("baselines group completion per session and checklist", BaselinesGroupCompletionPerSessionAndChecklist),
            ("rebaselines group completion after a lost connection", RebaselinesGroupCompletionAfterLostConnection),
            ("formats zero-of-zero progress", FormatsZeroOfZeroProgress),
            ("creates a checklist state request", CreatesChecklistStateRequest),
            ("loads the embedded checklists sorted by title", LoadsEmbeddedChecklistsSortedByTitle),
            ("rejects an embedded checklist without sections", RejectsChecklistWithoutSections),
            ("formats a checklist as Markdown-like text", FormatsChecklistAsMarkdownLikeText),
            ("deduplicates and replaces spoken items", SpeechSelfTests.Transitions),
            ("finishes group announcements before the latest item", SpeechSelfTests.CompletionOrdering),
            ("announces the next phase after one bulk completion", SpeechSelfTests.PhaseSkip),
            ("handles speech toggles, resets and offline state", SpeechSelfTests.ToggleAndReset),
            ("reports interrupted test sounds honestly", AudioSettingsSelfTests.ReportsInterruptedTest),
            ("keeps test audio independent of simulator retries", SpeechSelfTests.TestSoundSurvivesConnectionEvents),
            ("recovers speech after device and revision errors", SpeechSelfTests.Failures),
            ("decodes all bundled item clips and enforces exclusions", SpeechSelfTests.Assets),
            ("persists item speech independently", AudioSettingsSelfTests.PersistsItemSpeech),
            ("decodes the embedded completion clip", DecodesEmbeddedCompletionClip),
            ("preserves clean samples and buffer boundaries", RadioSelfTests.CleanBypass),
            ("filters radio into the speech band", RadioSelfTests.SpeechBand),
            ("switches radio live with continuous streaming state", RadioSelfTests.StreamingAndSwitching),
            ("filters the shipped Brian announcement without clipping", RadioSelfTests.ShippedClip),
            ("persists the radio effect independently of the output", AudioSettingsSelfTests.PersistsRadioIndependently),
            ("persists audio endpoint IDs and restores Windows default", AudioSettingsSelfTests.PersistsEndpoint),
            ("sorts audio outputs by recent selection with default first", AudioSettingsSelfTests.OrdersRecentOutputs),
            ("loads older audio settings and normalizes device history", AudioSettingsSelfTests.MigratesAudioHistory),
            ("keeps missing audio outputs selected and recovers by ID", AudioSettingsSelfTests.RecoversMissingEndpoint),
            ("handles unreadable settings and failed saves", AudioSettingsSelfTests.HandlesSettingsFailures),
            ("uses the saved output for test playback and handles failures", AudioSettingsSelfTests.TestsSelectedOutput),
        ];

        var failures = 0;

        foreach (var (name, body) in tests)
        {
            try
            {
                body();
                Console.WriteLine($"PASS: {name}");
            }
            catch (Exception error)
            {
                failures += 1;
                Console.Error.WriteLine($"FAIL: {name}: {error.Message}");
            }
        }

        if (failures > 0)
        {
            Console.Error.WriteLine(
                $"Transport probe self-tests failed: {failures} of {tests.Length} cases failed.");
            return 1;
        }

        Console.WriteLine($"Transport probe self-tests passed: {tests.Length} cases.");
        return 0;
    }

    private static void ParsesChecklistStateSnapshot()
    {
        var snapshot = ChecklistStateProtocol.ParseSnapshot(ValidSnapshotPayload);
        Assert(snapshot.Sequence == 7, "The snapshot sequence was not parsed.");
        Assert(snapshot.Checklist?.Id == "diamond-da42", "The checklist ID was not parsed.");
        Assert(snapshot.NextOpenItem?.Challenge == "Battery", "The next item was not parsed.");
        Assert(snapshot.CompletedGroupIds is { Count: 0 }, "The completed group IDs were not parsed.");
        Assert(snapshot.ActiveGroup?.Phase == "Engine Start", "The active group's phase was not parsed.");
    }

    private static void AcceptsSnapshotWithoutPhase()
    {
        var payload = SnapshotWith(snapshot => Nested(snapshot, "activeGroup").Remove("phase"));
        var snapshot = ChecklistStateProtocol.ParseSnapshot(payload);
        Assert(snapshot.ActiveGroup is { Phase: null }, "A missing phase was not kept as null.");
    }

    private static void AcceptsSnapshotWithoutCompletedGroupIds()
    {
        var payload = SnapshotWith(snapshot => snapshot.Remove("completedGroupIds"));
        var snapshot = ChecklistStateProtocol.ParseSnapshot(payload);

        Assert(snapshot.CompletedGroupIds is null, "A missing group list was not kept as null.");
        Assert(
            new ChecklistGroupCompletionTracker().Observe(snapshot, isRepeated: false).Count == 0,
            "An EFB without group completion data triggered an announcement.");
    }

    private static void RejectsMalformedCompletedGroupIds()
    {
        foreach (var (name, groupIds) in new (string, string[])[]
        {
            ("an empty ID", ["before-start", ""]),
            ("a duplicate ID", ["before-start", "before-start"]),
        })
        {
            var payload = SnapshotWith(snapshot =>
                snapshot["completedGroupIds"] = new JsonArray(groupIds.Select(id => (JsonNode)id).ToArray()));

            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"A group list with {name} was accepted.");
        }
    }

    private static void AnnouncesEachNewlyCompletedGroupOnce()
    {
        var tracker = new ChecklistGroupCompletionTracker();

        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 1, "before-start"), isRepeated: false).Count == 0,
            "The first snapshot of a session announced an already completed group.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 2, "before-start"), isRepeated: false).Count == 0,
            "An unchanged group list triggered an announcement.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 3, "before-start", "engine-start"), isRepeated: false)
                .SequenceEqual(["engine-start"]),
            "A newly completed group was not announced.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 3, "before-start", "engine-start"), isRepeated: true).Count == 0,
            "A repeated snapshot announced the group again.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 4, "before-start"), isRepeated: false).Count == 0,
            "Reopening an item in a completed group triggered an announcement.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 5, "before-start", "engine-start"), isRepeated: false)
                .SequenceEqual(["engine-start"]),
            "Completing the reopened group again was not announced.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 6), isRepeated: false).Count == 0,
            "A checklist reset triggered an announcement.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 7, "before-start", "engine-start"), isRepeated: false)
                .SequenceEqual(["before-start", "engine-start"]),
            "Groups completed after a reset were not announced in checklist order.");
    }

    private static void BaselinesGroupCompletionPerSessionAndChecklist()
    {
        var tracker = new ChecklistGroupCompletionTracker();

        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 1), isRepeated: false).Count == 0,
            "An empty first snapshot announced a group.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-2", 1, "before-start"), isRepeated: false).Count == 0,
            "A new flight session replayed a restored group completion.");
        Assert(
            tracker.Observe(
                    SnapshotWithGroups("session-2", 2, ["before-start", "engine-start"], revision: "2"),
                    isRepeated: false)
                .Count == 0,
            "A checklist revision change replayed a group completion.");
        Assert(
            tracker.Observe(
                    SnapshotWithGroups("session-2", 3, ["before-start", "engine-start", "departure"], revision: "2"),
                    isRepeated: false)
                .SequenceEqual(["departure"]),
            "A group completed after the checklist change was not announced.");
        Assert(
            tracker.Observe(
                    ChecklistStateProtocol.ParseSnapshot(SnapshotWith(snapshot =>
                    {
                        snapshot["sessionId"] = "session-2";
                        snapshot["sequence"] = 4;
                        snapshot["checklist"] = null;
                    })),
                    isRepeated: false)
                .Count == 0,
            "Losing the checklist announced a group.");
    }

    private static void RebaselinesGroupCompletionAfterLostConnection()
    {
        var tracker = new ChecklistGroupCompletionTracker();

        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 1), isRepeated: false).Count == 0,
            "An empty first snapshot announced a group.");

        // The group end at sequence 2 was never delivered.
        tracker.ResetBaseline();

        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 3, "before-start"), isRepeated: false).Count == 0,
            "A group completed during the lost connection was announced late.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 4, "before-start", "engine-start"), isRepeated: false)
                .SequenceEqual(["engine-start"]),
            "A group completed after the reconnect was not announced.");

        tracker.ResetBaseline();

        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 4, "before-start", "engine-start"), isRepeated: true).Count == 0,
            "A repeated snapshot after a reconnect announced a group.");
        Assert(
            tracker.Observe(SnapshotWithGroups("session-1", 5, "before-start", "engine-start", "departure"), isRepeated: false)
                .SequenceEqual(["departure"]),
            "The baseline after a repeated reconnect snapshot was lost.");
    }

    private static void DecodesEmbeddedCompletionClip()
    {
        var clip = OpusClip.LoadEmbeddedCompletion();

        Assert(clip.WaveFormat.SampleRate == 48000, "The clip was not decoded at the Opus rate.");
        Assert(
            clip.Duration > TimeSpan.FromSeconds(1) && clip.Duration < TimeSpan.FromSeconds(5),
            $"The clip duration {clip.Duration} is not a short announcement.");

        using var pcm = clip.OpenRead();
        var buffer = new byte[pcm.Length];
        Assert(pcm.Read(buffer, 0, buffer.Length) == buffer.Length, "The clip did not read completely.");
        var peak = 0;

        for (var offset = 0; offset < buffer.Length; offset += sizeof(short))
        {
            peak = Math.Max(peak, Math.Abs((int)BitConverter.ToInt16(buffer, offset)));
        }

        Assert(peak > short.MaxValue / 10, "The decoded clip is silent.");
    }

    private static ChecklistStateSnapshot SnapshotWithGroups(
        string sessionId,
        long sequence,
        params string[] completedGroupIds) =>
        SnapshotWithGroups(sessionId, sequence, completedGroupIds, revision: "1");

    private static ChecklistStateSnapshot SnapshotWithGroups(
        string sessionId,
        long sequence,
        string[] completedGroupIds,
        string revision) =>
        ChecklistStateProtocol.ParseSnapshot(SnapshotWith(snapshot =>
        {
            snapshot["sessionId"] = sessionId;
            snapshot["sequence"] = sequence;
            Nested(snapshot, "checklist")["revision"] = revision;
            snapshot["completedGroupIds"] =
                new JsonArray(completedGroupIds.Select(id => (JsonNode)id).ToArray());
        }));

    private static void RejectsMalformedSnapshotJson()
    {
        ExpectThrows<JsonException>(
            () => ChecklistStateProtocol.ParseSnapshot("{not-json}"),
            "Malformed snapshot JSON was accepted.");
        ExpectThrows<InvalidDataException>(
            () => ChecklistStateProtocol.ParseSnapshot("{}"),
            "A snapshot without required data was accepted.");
    }

    private static void RejectsIncompatibleChecklistStateSnapshot()
    {
        var payload = SnapshotWith(snapshot => snapshot["protocolVersion"] = 2);

        ExpectThrows<ChecklistProtocolException>(
            () => ChecklistStateProtocol.ParseSnapshot(payload),
            "An incompatible protocol version was accepted.");
    }

    private static void RejectsNonPositiveSnapshotSequence()
    {
        foreach (var sequence in new[] { 0, -1 })
        {
            var payload = SnapshotWith(snapshot => snapshot["sequence"] = sequence);
            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"Snapshot sequence {sequence} was accepted.");
        }
    }

    private static void RejectsImpossibleSnapshotProgress()
    {
        var completedOverTotal = SnapshotWith(snapshot =>
        {
            snapshot["completedRequiredItems"] = 21;
            snapshot["totalRequiredItems"] = 20;
        });
        ExpectThrows<InvalidDataException>(
            () => ChecklistStateProtocol.ParseSnapshot(completedOverTotal),
            "Progress above the total was accepted.");

        foreach (var field in new[] { "completedRequiredItems", "totalRequiredItems" })
        {
            var negativeProgress = SnapshotWith(snapshot => snapshot[field] = -1);
            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(negativeProgress),
                $"Negative {field} was accepted.");
        }
    }

    private static void RejectsEmptyRequiredSnapshotFields()
    {
        foreach (var field in new[] { "type", "sessionId", "efbVersion", "instanceId" })
        {
            var payload = SnapshotWith(snapshot => snapshot[field] = " ");
            ExpectThrows<InvalidDataException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"An empty required field '{field}' was accepted.");
        }
    }

    private static void RejectsMalformedNestedSnapshotRecords()
    {
        (string Field, Action<JsonObject> Mutate)[] cases =
        [
            ("checklist.id", snapshot => Nested(snapshot, "checklist")["id"] = " "),
            ("checklist.revision", snapshot => Nested(snapshot, "checklist")["revision"] = " "),
            ("checklist.title", snapshot => Nested(snapshot, "checklist")["title"] = " "),
            ("activeGroup.id", snapshot => Nested(snapshot, "activeGroup")["id"] = " "),
            ("activeGroup.title", snapshot => Nested(snapshot, "activeGroup")["title"] = " "),
            ("activeGroup.index", snapshot => Nested(snapshot, "activeGroup")["index"] = -1),
            ("activeGroup.phase empty", snapshot => Nested(snapshot, "activeGroup")["phase"] = " "),
            ("activeGroup.phase type", snapshot => Nested(snapshot, "activeGroup")["phase"] = 42),
            ("nextOpenItem.id", snapshot => Nested(snapshot, "nextOpenItem")["id"] = " "),
            ("nextOpenItem.challenge", snapshot => Nested(snapshot, "nextOpenItem")["challenge"] = " "),
            ("nextOpenItem.response", snapshot => Nested(snapshot, "nextOpenItem")["response"] = " "),
            ("activeGroup.index missing", snapshot => Nested(snapshot, "activeGroup").Remove("index")),
        ];

        foreach (var (field, mutate) in cases)
        {
            var payload = SnapshotWith(mutate);
            ExpectThrows<JsonException>(
                () => ChecklistStateProtocol.ParseSnapshot(payload),
                $"A malformed nested field '{field}' was accepted.",
                allowInvalidDataException: true);
        }
    }

    private static void DeduplicatesSnapshotsBySessionAndSequence()
    {
        var tracker = new ChecklistSnapshotSequenceTracker();

        Assert(
            tracker.Observe(ParseSnapshot("session-1", 7)) == ChecklistSnapshotDisposition.New,
            "The first snapshot was not treated as new.");
        Assert(
            tracker.Observe(ParseSnapshot("session-1", 7)) == ChecklistSnapshotDisposition.Repeated,
            "An identical session and sequence was not treated as repeated.");
        Assert(
            tracker.Observe(ParseSnapshot("session-1", 6)) == ChecklistSnapshotDisposition.Stale,
            "An older sequence in the same session was not rejected as stale.");
        Assert(
            tracker.Observe(ParseSnapshot("session-1", 8)) == ChecklistSnapshotDisposition.New,
            "A newer sequence in the same session was not treated as new.");
        Assert(
            tracker.Observe(ParseSnapshot("session-2", 1)) == ChecklistSnapshotDisposition.New,
            "The first sequence of a new session was not treated as new.");
        Assert(
            tracker.Observe(ParseSnapshot("session-2", 1)) == ChecklistSnapshotDisposition.Repeated,
            "A repeated sequence in the new session was not deduplicated.");
    }

    private static void FormatsZeroOfZeroProgress()
    {
        var payload = SnapshotWith(snapshot =>
        {
            snapshot["checklist"] = null;
            snapshot["activeGroup"] = null;
            snapshot["nextOpenItem"] = null;
            snapshot["completedRequiredItems"] = 0;
            snapshot["totalRequiredItems"] = 0;
        });
        var progress = ChecklistProgress.FromSnapshot(
            ChecklistStateProtocol.ParseSnapshot(payload));

        Assert(progress.Label == "0 / 0", "Zero progress has the wrong label.");
        Assert(progress.Percent == 0, "Zero progress has a non-zero percentage.");
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

    private static void LoadsEmbeddedChecklistsSortedByTitle()
    {
        var checklists = ChecklistCatalog.Load(typeof(TransportProbeSelfTests).Assembly);

        Assert(checklists.Count >= 2, "Expected the shipped checklists to be embedded.");
        Assert(
            checklists.Select(checklist => checklist.Title)
                .SequenceEqual(
                    checklists.Select(checklist => checklist.Title)
                        .OrderBy(title => title, StringComparer.OrdinalIgnoreCase)),
            "Expected checklists to be sorted by title.");
        Assert(
            checklists.Any(checklist => checklist.Id == "hughes-oh6a-500c"),
            "Expected the OH-6A/500C checklist to be embedded.");
        Assert(
            checklists.All(checklist =>
                checklist.Sections.All(section => section.Items.Count > 0)),
            "Expected every embedded section to contain items.");
    }

    private static void RejectsChecklistWithoutSections()
    {
        const string payload = """
            {
              "schemaVersion": 1,
              "id": "empty",
              "title": "Empty",
              "revision": "2026-09-02",
              "sections": []
            }
            """;
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(payload));

        ExpectThrows<InvalidDataException>(
            () => ChecklistCatalog.Parse(stream, "empty.json"),
            "Expected a checklist without sections to be rejected.");
    }

    private static void FormatsChecklistAsMarkdownLikeText()
    {
        var checklist = new ChecklistDocument(
            "demo",
            "Demo",
            "2026-09-02",
            [
                new ChecklistSectionDocument(
                    "engine-start",
                    "Engine Start",
                    "Engine Start",
                    [
                        new ChecklistItemDocument(
                            "twistgrip", "Twistgrip Throttle", "IDLE", "action",
                            Condition: "Engine N1 ≥ 20 %",
                            Alternatives: null,
                            Notes: ["Advance gradually."],
                            NeedsReview: null,
                            ReviewNote: null),
                        new ChecklistItemDocument(
                            "indicators", "Caution / Warning Indicators", "All Out", "verify",
                            Condition: null,
                            Alternatives: [new ChecklistAlternativeDocument("cold start", "Check")],
                            Notes: null,
                            NeedsReview: true,
                            ReviewNote: "Confirm in the sim."),
                        new ChecklistItemDocument(
                            "atis", "COM: ATIS", "Received", "communication",
                            Condition: null, Alternatives: null, Notes: null,
                            NeedsReview: null, ReviewNote: null),
                    ]),
            ]);

        var text = ChecklistTextFormatter.ToPlainText(ChecklistTextFormatter.Format(checklist));

        const string expected =
            "# Demo\n" +
            "Revision 2026-09-02\n" +
            "\n" +
            "## Engine Start [Engine Start]\n" +
            "\n" +
            "- Twistgrip Throttle...IDLE\n" +
            "  Engine N1 ≥ 20 %\n" +
            "  Advance gradually.\n" +
            "- [Verify] Caution / Warning Indicators...All Out\n" +
            "  Alternative · cold start: Check\n" +
            "  Review required: Confirm in the sim.\n" +
            "- [ATC] COM: ATIS...Received\n";
        Assert(text == expected, $"Unexpected checklist text:\n{text}");
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

        ExpectThrows<InvalidDataException>(
            () => assembler.Append(1, 2, "late"u8),
            "An out-of-order chunk was accepted.");
    }

    private static void ResetsAssemblerAfterMalformedSequence()
    {
        var assembler = new CommBusMessageAssembler();
        Assert(
            assembler.Append(0, 2, "partial"u8) is null,
            "A partial message completed too early.");
        ExpectThrows<InvalidDataException>(
            () => assembler.Append(1, 3, "invalid"u8),
            "A mismatched chunk count was accepted.");
        Assert(
            assembler.Append(0, 1, "fresh\0"u8) == "fresh",
            "The assembler did not recover after a malformed sequence.");
    }

    private static void AcceptsNewChunkSequence()
    {
        var assembler = new CommBusMessageAssembler();
        Assert(
            assembler.Append(0, 1, "first\0"u8) == "first",
            "The first single-chunk sequence was not assembled.");
        Assert(
            assembler.Append(0, 1, "second\0"u8) == "second",
            "A new chunk sequence was not assembled.");
    }

    private static void RejectsOutOfZero()
    {
        var assembler = new CommBusMessageAssembler();
        ExpectThrows<InvalidDataException>(
            () => assembler.Append(0, 0, "invalid"u8),
            "A CommBus chunk with outOf zero was accepted.");
        Assert(
            assembler.Append(0, 1, "recovered\0"u8) == "recovered",
            "The assembler did not recover after outOf zero.");
    }

    private static void SkipsMalformedDispatch()
    {
        var guard = new CommBusDispatchGuard();
        var processed = false;

        guard.Invoke(() => throw new InvalidDataException("malformed packet"));
        guard.Invoke(() => processed = true);

        Assert(processed, "A valid message after a malformed packet was not processed.");
        Assert(
            guard.TakeFatalError() is null,
            "A malformed packet was incorrectly retained as a fatal dispatch error.");
    }

    private static void ConsumesFatalDispatchErrorOnce()
    {
        var expected = new InvalidOperationException("unexpected handler failure");
        var guard = new CommBusDispatchGuard();

        guard.Invoke(() => throw expected);

        Assert(
            ReferenceEquals(guard.TakeFatalError(), expected),
            "The fatal dispatch error was not returned.");
        Assert(
            guard.TakeFatalError() is null,
            "The fatal dispatch error leaked into a later pump.");
    }

    private static void EnforcesCommBusSingleWorkerAffinity()
    {
        var guard = new CommBusThreadAffinityGuard();
        guard.Enter();

        var error = Task.Run(() =>
        {
            try
            {
                guard.Enter();
                return null;
            }
            catch (Exception caught)
            {
                return caught;
            }
        }).GetAwaiter().GetResult();

        Assert(
            error is InvalidOperationException,
            "A second worker thread was allowed to use the CommBus client.");
    }

    private static void ReportsMissingSimConnectLibrary()
    {
        using var reported = new ManualResetEventSlim();
        string? detail = null;
        var service = CreateConnectionService(
            new MissingLibraryCommBusClient(),
            TimeSpan.FromSeconds(1));
        service.ConnectionChanged += (status, statusDetail) =>
        {
            if (status == SimulatorConnectionStatus.Connecting &&
                statusDetail == ChecklistConnectionService.SimConnectMissingDetail)
            {
                detail = statusDetail;
                reported.Set();
            }
        };

        service.Start();
        Assert(reported.Wait(TimeSpan.FromSeconds(1)), "A missing SimConnect.dll was reported as plain waiting.");
        service.Dispose();

        Assert(detail is not null, "The missing-library detail was not delivered.");
    }

    private static void StopsCompanionWorkerNormally()
    {
        using var pumpEntered = new ManualResetEventSlim();
        var client = new BlockingChecklistCommBusClient(
            pumpEntered: pumpEntered,
            honorPumpCancellation: true);
        var service = CreateConnectionService(client, TimeSpan.FromSeconds(1));
        service.Start();

        Assert(pumpEntered.Wait(TimeSpan.FromSeconds(1)), "The worker did not enter Pump.");
        service.Dispose();

        Assert(service.WorkerCompletion.IsCompleted, "Normal shutdown did not join the worker.");
        Assert(client.Disposed, "Normal shutdown did not dispose the CommBus client.");
        Assert(
            client.CancellationAccessError is null,
            "Normal shutdown disposed cancellation state before Pump stopped.");
    }

    private static void StopsAfterDelayedConnectionAttempt()
    {
        using var connectEntered = new ManualResetEventSlim();
        using var releaseConnect = new ManualResetEventSlim();
        var client = new BlockingChecklistCommBusClient(
            connectEntered: connectEntered,
            releaseConnect: releaseConnect);
        var service = CreateConnectionService(client, TimeSpan.FromMilliseconds(20));
        service.Start();

        Assert(
            connectEntered.Wait(TimeSpan.FromSeconds(1)),
            "The worker did not enter Connect.");
        service.Dispose();
        Assert(
            !service.WorkerCompletion.IsCompleted,
            "Shutdown unexpectedly waited indefinitely for Connect.");

        releaseConnect.Set();
        Assert(
            service.WorkerCompletion.Wait(TimeSpan.FromSeconds(1)),
            "The worker did not stop after Connect returned.");
        Assert(client.Disposed, "Shutdown during Connect did not dispose the CommBus client.");
        Assert(client.SubscribeCalls == 0, "The cancelled worker subscribed after Connect returned.");
        Assert(client.SendCalls == 0, "The cancelled worker sent a request after Connect returned.");
        Assert(client.PumpCalls == 0, "The cancelled worker entered Pump after Connect returned.");
    }

    private static void StopsAfterDelayedPump()
    {
        using var pumpEntered = new ManualResetEventSlim();
        using var releasePump = new ManualResetEventSlim();
        var client = new BlockingChecklistCommBusClient(
            pumpEntered: pumpEntered,
            releasePump: releasePump);
        var service = CreateConnectionService(client, TimeSpan.FromMilliseconds(20));
        service.Start();

        Assert(pumpEntered.Wait(TimeSpan.FromSeconds(1)), "The worker did not enter Pump.");
        service.Dispose();
        Assert(
            !service.WorkerCompletion.IsCompleted,
            "Shutdown unexpectedly waited indefinitely for Pump.");

        releasePump.Set();
        Assert(
            service.WorkerCompletion.Wait(TimeSpan.FromSeconds(1)),
            "The worker did not stop after Pump returned.");
        Assert(client.Disposed, "Shutdown during Pump did not dispose the CommBus client.");
        Assert(
            client.CancellationAccessError is null,
            "Shutdown disposed cancellation state while Pump still used it.");
    }

    private static ChecklistConnectionService CreateConnectionService(
        IChecklistCommBusClient client,
        TimeSpan shutdownWait) =>
        new(() => client, () => true, shutdownWait);

    private static ChecklistStateSnapshot ParseSnapshot(string sessionId, long sequence) =>
        ChecklistStateProtocol.ParseSnapshot(SnapshotWith(snapshot =>
        {
            snapshot["sessionId"] = sessionId;
            snapshot["sequence"] = sequence;
        }));

    private static string SnapshotWith(Action<JsonObject> mutate)
    {
        var snapshot = JsonNode.Parse(ValidSnapshotPayload)?.AsObject()
            ?? throw new InvalidOperationException("The valid snapshot fixture is empty.");
        mutate(snapshot);
        return snapshot.ToJsonString();
    }

    private static JsonObject Nested(JsonObject snapshot, string propertyName) =>
        snapshot[propertyName]?.AsObject()
        ?? throw new InvalidOperationException($"Snapshot fixture '{propertyName}' is missing.");

    private static void ExpectThrows<TException>(
        Action action,
        string failureMessage,
        bool allowInvalidDataException = false)
        where TException : Exception
    {
        try
        {
            action();
        }
        catch (TException)
        {
            return;
        }
        catch (InvalidDataException) when (allowInvalidDataException)
        {
            return;
        }
        catch (Exception error)
        {
            throw new InvalidOperationException(
                $"{failureMessage} Received {error.GetType().Name} instead.",
                error);
        }

        throw new InvalidOperationException(failureMessage);
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }

    private sealed class MissingLibraryCommBusClient : IChecklistCommBusClient
    {
        public void Connect() => throw new DllNotFoundException("SimConnect.dll");

        public void Subscribe(uint eventId, string eventName, Action<string> handler)
        {
        }

        public void Send(string eventName, string payload)
        {
        }

        public void Pump(CancellationToken cancellationToken, WaitHandle outgoingSignal)
        {
        }

        public void Dispose()
        {
        }
    }

    private sealed class BlockingChecklistCommBusClient(
        ManualResetEventSlim? connectEntered = null,
        ManualResetEventSlim? releaseConnect = null,
        ManualResetEventSlim? pumpEntered = null,
        ManualResetEventSlim? releasePump = null,
        bool honorPumpCancellation = false) : IChecklistCommBusClient
    {
        private int disposed;
        private int pumpCalls;
        private int sendCalls;
        private int subscribeCalls;

        internal bool Disposed => Volatile.Read(ref disposed) != 0;
        internal int PumpCalls => Volatile.Read(ref pumpCalls);
        internal int SendCalls => Volatile.Read(ref sendCalls);
        internal int SubscribeCalls => Volatile.Read(ref subscribeCalls);
        internal Exception? CancellationAccessError { get; private set; }

        public void Connect()
        {
            connectEntered?.Set();
            releaseConnect?.Wait();
        }

        public void Subscribe(uint eventId, string eventName, Action<string> handler)
        {
            Interlocked.Increment(ref subscribeCalls);
        }

        public void Send(string eventName, string payload)
        {
            Interlocked.Increment(ref sendCalls);
        }

        public void Pump(CancellationToken cancellationToken, WaitHandle outgoingSignal)
        {
            Interlocked.Increment(ref pumpCalls);
            pumpEntered?.Set();

            if (honorPumpCancellation)
            {
                cancellationToken.WaitHandle.WaitOne();
            }
            else
            {
                releasePump?.Wait();
            }

            try
            {
                _ = cancellationToken.WaitHandle;
            }
            catch (Exception error)
            {
                CancellationAccessError = error;
            }

            cancellationToken.ThrowIfCancellationRequested();
        }

        public void Dispose()
        {
            Interlocked.Exchange(ref disposed, 1);
        }
    }
}
