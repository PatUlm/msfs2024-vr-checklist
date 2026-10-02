using Velopack;
using Velopack.Sources;

namespace VRChecklist.Companion;

public sealed class VelopackCompanionUpdater : ICompanionUpdater
{
    private const string RepositoryUrl = "https://github.com/PatUlm/msfs2024-vr-checklist";
    private readonly UpdateManager manager;
    private readonly Action exit;
    private UpdateInfo? update;

    private VelopackCompanionUpdater(UpdateManager manager, Action exit)
    {
        this.manager = manager;
        this.exit = exit;
    }

    /*
     * Returns null for development builds, which the setup did not install.
     * VR_CHECKLIST_UPDATE_SOURCE replaces GitHub with a local release folder
     * or feed URL to test an update before it is published. The GitHub source
     * skips releases without releases.win.json.
     */
    public static VelopackCompanionUpdater? CreateForInstallation(Action exit)
    {
        var source = Environment.GetEnvironmentVariable("VR_CHECKLIST_UPDATE_SOURCE");
        var manager = string.IsNullOrWhiteSpace(source)
            ? new UpdateManager(new GithubSource(RepositoryUrl, accessToken: null, prerelease: false))
            : new UpdateManager(source);
        return manager.IsInstalled ? new VelopackCompanionUpdater(manager, exit) : null;
    }

    public async Task<string?> CheckAsync()
    {
        update = await Task.Run(manager.CheckForUpdatesAsync);
        return update?.TargetFullRelease.Version.ToString();
    }

    public Task DownloadAsync(IProgress<int> progress)
    {
        var pending = update ?? throw new InvalidOperationException("No update was found.");
        return Task.Run(() => manager.DownloadUpdatesAsync(pending, progress.Report));
    }

    public void ApplyAndRestart()
    {
        var pending = update ?? throw new InvalidOperationException("No update was found.");
        // The updater waits for this process to exit, so connection and audio shut down normally.
        manager.WaitExitThenApplyUpdates(pending.TargetFullRelease, silent: false, restart: true);
        exit();
    }
}
