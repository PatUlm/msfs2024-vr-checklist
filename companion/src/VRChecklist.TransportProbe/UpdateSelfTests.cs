using VRChecklist.Companion;

namespace VRChecklist.TransportProbe;

internal static class UpdateSelfTests
{
    public static void Consent() => WithSettingsPath(path =>
    {
        var updater = new FakeUpdater();
        var vm = new UpdateViewModel(new UpdateCheckSettings(path), updater, null);
        vm.CheckAsync().GetAwaiter().GetResult();
        Require(vm.IsConsentNotice && !vm.CheckEnabled && updater.Checks == 0,
            "The first start must ask before contacting GitHub.");
        vm.DecideAsync(false).GetAwaiter().GetResult();
        Require(!vm.IsNoticeVisible && updater.Checks == 0 && new UpdateCheckSettings(path).Enabled == false,
            "Declining must be saved and must not check.");
        vm.CheckEnabled = true;
        Require(updater.Checks == 1 && new UpdateCheckSettings(path).Enabled == true,
            "Switching on in Settings must save and check at once.");

        var development = new UpdateViewModel(new UpdateCheckSettings(path + ".new"), null, null);
        Require(!development.IsNoticeVisible && development.Status.Contains("installed by the setup", StringComparison.Ordinal),
            "Development builds must neither ask nor check.");

        File.WriteAllText(path, """{"enabled":"yes"}""");
        vm = new UpdateViewModel(new UpdateCheckSettings(path), updater, null);
        Require(vm.IsConsentNotice && vm.NoticeDetail.Contains("Could not load", StringComparison.Ordinal),
            "An unreadable setting must ask again and say why.");
        File.Delete(path);
        Directory.CreateDirectory(path);
        vm = new UpdateViewModel(new UpdateCheckSettings(path), updater, null);
        vm.DecideAsync(true).GetAwaiter().GetResult();
        Require(vm.IsConsentNotice && updater.Checks == 1 && vm.NoticeDetail.Contains("Could not save", StringComparison.Ordinal),
            "A failed save must keep asking and must not check.");
    });

    public static void Check() => WithSettingsPath(path =>
    {
        new UpdateCheckSettings(path).Save(true);
        var updater = new FakeUpdater { Check = () => Task.FromException<string?>(new HttpRequestException("offline")) };
        var vm = new UpdateViewModel(new UpdateCheckSettings(path), updater, null);
        vm.CheckAsync().GetAwaiter().GetResult();
        Require(!vm.IsNoticeVisible && vm.Status == "Could not check for updates: offline",
            "A failed check must stay out of the dashboard and show in Settings.");
        updater.Check = () => Task.FromResult<string?>(null);
        vm.CheckEnabled = false;
        vm.CheckEnabled = true;
        vm.CheckAsync().GetAwaiter().GetResult();
        Require(updater.Checks == 2 && vm.Status == "The companion is up to date.",
            "Switching on again must retry a failed check, then check only once per start.");

        updater = new FakeUpdater { Check = () => Task.FromResult<string?>("0.19.0") };
        vm = new UpdateViewModel(new UpdateCheckSettings(path), updater, null);
        vm.CheckAsync().GetAwaiter().GetResult();
        Require(vm.IsAvailableNotice && updater.Downloads == 0 &&
                vm.ReleasePageUrl.EndsWith("/releases/tag/v0.19.0", StringComparison.Ordinal),
            "An available update must be offered without downloading.");
        vm.Postpone();
        Require(!vm.IsNoticeVisible && vm.Status == "Version 0.19.0 is available.",
            "Later must hide the offer and keep the result in Settings.");
    });

    public static void Install() => WithSettingsPath(path =>
    {
        new UpdateCheckSettings(path).Save(true);
        var updater = new FakeUpdater
        {
            Check = () => Task.FromResult<string?>("0.19.0"),
            Download = () => Task.FromException(new IOException("disk full")),
        };
        var vm = new UpdateViewModel(new UpdateCheckSettings(path), updater, "0.18.3");
        vm.CheckAsync().GetAwaiter().GetResult();
        Require(vm.IsUpdatedNotice && vm.NoticeText.Contains("patulm-vr-checklist-0.18.3.zip", StringComparison.Ordinal) &&
                vm.ReleasePageUrl.EndsWith("/tag/v0.18.3", StringComparison.Ordinal),
            "After an update, the EFB reminder must come first.");
        vm.DismissUpdated();
        Require(vm.IsAvailableNotice, "Dismissing the reminder must reveal a newer offer.");
        vm.InstallAsync().GetAwaiter().GetResult();
        Require(vm.CanInstall && updater.Applies == 0 && vm.NoticeDetail == "Could not install the update: disk full",
            "A failed download must be reported and allow retrying.");
        updater.Download = () => Task.CompletedTask;
        vm.InstallAsync().GetAwaiter().GetResult();
        Require(updater.Applies == 1 && !vm.CanInstall && vm.NoticeDetail == "Installing. The companion restarts.",
            "A downloaded update must be applied once and lock the offer.");
    });

    private sealed class FakeUpdater : ICompanionUpdater
    {
        public Func<Task<string?>> Check { get; set; } = () => Task.FromResult<string?>(null);
        public Func<Task> Download { get; set; } = () => Task.CompletedTask;
        public int Checks { get; private set; }
        public int Downloads { get; private set; }
        public int Applies { get; private set; }

        public Task<string?> CheckAsync()
        {
            Checks++;
            return Check();
        }

        public Task DownloadAsync(IProgress<int> progress)
        {
            Downloads++;
            return Download();
        }

        public void ApplyAndRestart() => Applies++;
    }

    private static void WithSettingsPath(Action<string> test)
    {
        var directory = Path.Combine(Path.GetTempPath(), "vr-checklist-update-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try { test(Path.Combine(directory, "update-check.json")); }
        finally { Directory.Delete(directory, recursive: true); }
    }

    private static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
