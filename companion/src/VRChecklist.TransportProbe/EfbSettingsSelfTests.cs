using System.Text.Json;
using VRChecklist.Companion;
using VRChecklist.Transport;

namespace VRChecklist.TransportProbe;

internal static class EfbSettingsSelfTests
{
    internal static void OfflineAndPersistence()
    {
        WithTemporaryPath(path =>
        {
            var sent = 0;
            var vm = new EfbSettingsViewModel(new EfbInputSettings(path), (_, _) =>
            {
                sent++;
                throw new InvalidOperationException("No EFB should be contacted offline.");
            });
            Assert(vm.Actions.Count == 1 && vm.Actions[0].Event == "PLASMA_OFF" && vm.KeybindingsEnabled, "Wrong shared defaults.");
            vm.KeybindingsEnabled = false;
            Assert(sent == 0 && vm.Status.Contains("Saved locally"), "Offline editing required the simulator.");
            var restored = new EfbInputSettings(path);
            Assert(!restored.Enabled && restored.SelectedEvent == "PLASMA_OFF", "Disabled selection did not survive restart.");
            Assert(vm.SelectedAction.Event == "PLASMA_OFF", "Disabling cleared the list selection.");
            File.WriteAllText(path, """{"PLASMA_OFF":false}""");
            var migrated = new EfbInputSettings(path);
            Assert(!migrated.Enabled && migrated.SelectedEvent == "PLASMA_OFF", "The previous saved off choice was lost.");
            File.WriteAllText(path, "invalid json");
            var broken = new EfbInputSettings(path);
            var brokenVm = new EfbSettingsViewModel(broken, (_, _) => { sent++; throw new Exception(); });
            brokenVm.ObserveInstance("efb");
            Assert(sent == 0 && broken.LoadError is not null, "Unreadable local settings overwrote the EFB.");
            File.Delete(path);
            Directory.CreateDirectory(path);
            var failingVm = new EfbSettingsViewModel(new EfbInputSettings(path), (_, _) => throw new Exception());
            failingVm.KeybindingsEnabled = false;
            Assert(failingVm.KeybindingsEnabled && failingVm.Status.Contains("Could not save"), "Failed local save changed the selection.");
        });
    }

    internal static void AcknowledgementAndReconnect()
    {
        WithTemporaryPath(path =>
        {
            var requests = new List<(string Instance, IReadOnlyDictionary<string, bool> Actions, TaskCompletionSource<EfbSettingsResponse> Reply)>();
            var vm = new EfbSettingsViewModel(new EfbInputSettings(path), (instance, actions) =>
            {
                var reply = new TaskCompletionSource<EfbSettingsResponse>();
                requests.Add((instance, actions, reply));
                return reply.Task;
            });
            vm.KeybindingsEnabled = false;
            vm.ObserveInstance("first");
            Assert(requests.Count == 1 && !requests[0].Actions["PLASMA_OFF"], "Offline preference was not sent on connect.");
            Assert(vm.HasStatus, "Pending transfer was hidden before acknowledgement.");
            vm.KeybindingsEnabled = true;
            vm.KeybindingsEnabled = false;
            vm.KeybindingsEnabled = true;
            Assert(requests.Count == 1, "Concurrent changes were sent out of order.");
            requests[0].Reply.SetResult(Response("r", "first", false));
            Assert(requests.Count == 2 && requests[1].Actions["PLASMA_OFF"], "Latest preference was not sent after the earlier response.");
            requests[1].Reply.SetResult(Response("r", "first", true));
            Assert(!vm.HasStatus && vm.Status.Length == 0, "Successful acknowledgement left a status message visible.");
            vm.ObserveInstance("first");
            Assert(requests.Count == 2, "Normal snapshots kept resending settings.");
            vm.Disconnect();
            vm.KeybindingsEnabled = false;
            vm.ObserveInstance("second");
            Assert(requests.Count == 3 && !requests[2].Actions["PLASMA_OFF"], "Reconnect lost the offline preference.");
            vm.Disconnect();
            requests[2].Reply.SetResult(Response("r", "second", false));
            Assert(vm.Status.Contains("Waiting for EFB"), "Late response hid disconnect.");
            vm.ObserveInstance("third");
            requests[3].Reply.SetException(new TimeoutException());
            Assert(vm.Status.Contains("No EFB confirmation"), "Timeout falsely reported success.");
            _ = vm.SynchronizeAsync();
            requests[4].Reply.SetResult(Response("r", "third", true));
            Assert(vm.Status.Contains("did not confirm"), "Different EFB value was reported as applied.");
            _ = vm.SynchronizeAsync();
            requests[5].Reply.SetResult(Response("r", "third", false) with { Actions = null, Error = "Save failed." });
            Assert(vm.Status.Contains("Save failed"), "EFB storage failure was hidden.");
        });
    }

    internal static void Exchange() => ExchangeAsync().GetAwaiter().GetResult();

    private static async Task ExchangeAsync()
    {
        using var exchange = new EfbSettingsExchange();
        var actions = new Dictionary<string, bool> { ["PLASMA_OFF"] = false };
        await ExpectFailure<IOException>(() => exchange.ApplyAsync("efb", actions));
        exchange.SetConnected(true);
        var waiting = exchange.ApplyAsync("efb", actions);
        Assert(exchange.Signal.WaitOne(0), "Queued settings did not wake the worker.");
        string? requestId = null;
        exchange.SendPending((name, payload) =>
        {
            Assert(name == EfbSettingsProtocol.RequestEvent, "Wrong event.");
            using var request = JsonDocument.Parse(payload);
            Assert(!request.RootElement.GetProperty("actions").GetProperty("PLASMA_OFF").GetBoolean(), "False setting was omitted.");
            requestId = request.RootElement.GetProperty("requestId").GetString();
        });
        exchange.Receive("null");
        exchange.Receive("{");
        exchange.Receive(Serialize(Response("other-request", "efb", false)));
        exchange.Receive(Serialize(Response(requestId!, "other-instance", false)));
        Assert(!waiting.IsCompleted, "Unrelated response completed the request.");
        exchange.Receive(Serialize(Response(requestId!, "efb", false)));
        Assert(!(await waiting).Actions![0].Enabled, "Matching acknowledgement was lost.");
        var disconnected = exchange.ApplyAsync("efb", actions);
        exchange.SetConnected(false);
        await ExpectFailure<IOException>(() => disconnected);
        exchange.SetConnected(true);
        exchange.SendPending((_, _) => throw new Exception("Replayed request after reconnect."));
        await ExpectFailure<TimeoutException>(() => exchange.ApplyAsync("efb", actions, TimeSpan.FromMilliseconds(10)));
        exchange.SendPending((_, _) => throw new Exception("Sent an expired queued request."));
        var missingBoolean = """{"protocolVersion":1,"type":"settingsResponse","requestId":"r","instanceId":"efb","actions":[{"event":"PLASMA_OFF","label":"SET PLASMA OFF"}]}""";
        try { EfbSettingsProtocol.ParseResponse(missingBoolean); throw new Exception("Missing bool accepted."); }
        catch (JsonException) { }
    }

    private static EfbSettingsResponse Response(string request, string instance, bool enabled) =>
        new(1, "settingsResponse", request, instance, [new("PLASMA_OFF", "SET PLASMA OFF", enabled)], null);
    private static string Serialize(EfbSettingsResponse response) => JsonSerializer.Serialize(response, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    private static async Task ExpectFailure<T>(Func<Task<EfbSettingsResponse>> action) where T : Exception
    {
        try { await action(); }
        catch (T) { return; }
        throw new Exception($"Expected {typeof(T).Name}.");
    }
    private static void WithTemporaryPath(Action<string> test)
    {
        var directory = Path.Combine(Path.GetTempPath(), "vr-checklist-efb-settings-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try { test(Path.Combine(directory, "input.json")); }
        finally { Directory.Delete(directory, recursive: true); }
    }
    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
