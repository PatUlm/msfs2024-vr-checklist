using System.ComponentModel;

namespace VRChecklist.Companion;

/* Implemented with Velopack; development builds are not installed and have no updater. */
public interface ICompanionUpdater
{
    /// <summary>Returns the newer release version, or <c>null</c> when the installed one is current.</summary>
    Task<string?> CheckAsync();

    Task DownloadAsync(IProgress<int> progress);

    /// <summary>Exits the companion; the Velopack updater installs the download and restarts it.</summary>
    void ApplyAndRestart();
}

/*
 * Opt-in update check once per start (ADR 0012). The dashboard shows one
 * notice at a time: the EFB reminder after an update, the consent question or
 * an available update. Nothing is downloaded before the player confirms.
 */
public sealed class UpdateViewModel : INotifyPropertyChanged
{
    private const string ReleasesUrl = "https://github.com/PatUlm/msfs2024-vr-checklist/releases";

    private static readonly string[] ComputedProperties =
    [
        nameof(CheckEnabled), nameof(Status), nameof(HasStatus), nameof(IsNoticeVisible),
        nameof(IsConsentNotice), nameof(IsAvailableNotice), nameof(IsUpdatedNotice), nameof(HasReleasePage),
        nameof(CanInstall), nameof(NoticeTitle), nameof(NoticeText), nameof(NoticeDetail), nameof(HasNoticeDetail),
    ];

    private readonly UpdateCheckSettings settings;
    private readonly ICompanionUpdater? updater;
    private string? updatedVersion;
    private string? availableVersion;
    private string? saveError;
    private string? checkError;
    private string? installError;
    private string? openError;
    private bool isChecking;
    private bool hasChecked;
    private bool isPostponed;
    private bool isInstalling;
    private bool isApplying;
    private int downloadPercent;

    public UpdateViewModel(UpdateCheckSettings settings, ICompanionUpdater? updater, string? updatedVersion)
    {
        this.settings = settings;
        this.updater = updater;
        this.updatedVersion = updatedVersion;
    }

    private enum NoticeKind { None, Consent, Available, Updated }

    public event PropertyChangedEventHandler? PropertyChanged;

    public bool CheckEnabled
    {
        get => settings.Enabled == true;
        set { if (value != CheckEnabled) _ = DecideAsync(value); }
    }

    public string Status => saveError ?? (
        updater is null ? "Update checks run only in the companion installed by the setup."
        : settings.LoadError is { } loadError ? loadError
        : isChecking ? "Checking for updates…"
        : checkError is not null ? $"Could not check for updates: {checkError}"
        : availableVersion is not null ? $"Version {availableVersion} is available."
        : hasChecked ? "The companion is up to date."
        : string.Empty);

    public bool HasStatus => Status.Length > 0;

    private NoticeKind Notice =>
        updatedVersion is not null ? NoticeKind.Updated
        : updater is not null && settings.Enabled is null ? NoticeKind.Consent
        : availableVersion is not null && !isPostponed ? NoticeKind.Available
        : NoticeKind.None;

    public bool IsNoticeVisible => Notice != NoticeKind.None;
    public bool IsConsentNotice => Notice == NoticeKind.Consent;
    public bool IsAvailableNotice => Notice == NoticeKind.Available;
    public bool IsUpdatedNotice => Notice == NoticeKind.Updated;
    public bool HasReleasePage => IsAvailableNotice || IsUpdatedNotice;
    public bool CanInstall => !isInstalling;

    public string NoticeTitle => Notice switch
    {
        NoticeKind.Consent => "UPDATES",
        NoticeKind.Available => "UPDATE AVAILABLE",
        NoticeKind.Updated => "COMPANION UPDATED",
        _ => string.Empty,
    };

    public string NoticeText => Notice switch
    {
        NoticeKind.Consent =>
            "Allow the companion to check GitHub for new versions at startup? Updates are downloaded and installed " +
            "only after you confirm. You can change this later in Settings.",
        NoticeKind.Available =>
            $"Version {availableVersion} is available. Installing restarts the companion; afterwards, also update " +
            "the EFB app from the release page.",
        NoticeKind.Updated =>
            $"The companion now runs version {updatedVersion}. Update the EFB app as well: download " +
            $"patulm-vr-checklist-{updatedVersion}.zip from the release page and replace the old folder in " +
            "Community with it.",
        _ => string.Empty,
    };

    public string NoticeDetail => Notice switch
    {
        NoticeKind.Consent => saveError ?? settings.LoadError ?? string.Empty,
        NoticeKind.Available when isApplying => "Installing. The companion restarts.",
        NoticeKind.Available when isInstalling => $"Downloading… {downloadPercent} %",
        NoticeKind.Available => installError ?? openError ?? string.Empty,
        NoticeKind.Updated => openError ?? string.Empty,
        _ => string.Empty,
    };

    public bool HasNoticeDetail => NoticeDetail.Length > 0;

    public string ReleasePageUrl => $"{ReleasesUrl}/tag/v{(IsUpdatedNotice ? updatedVersion : availableVersion)}";

    /* Answers the consent question or the Settings switch; allowing checks at once. */
    public Task DecideAsync(bool enabled)
    {
        try
        {
            settings.Save(enabled);
            saveError = null;
            if (!enabled) checkError = null;
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            saveError = "Could not save the update setting. The previous setting is still active.";
        }
        Refresh();
        return enabled ? CheckAsync() : Task.CompletedTask;
    }

    /* Once per start and only with consent; switching on again retries a failed check. */
    public async Task CheckAsync()
    {
        if (updater is null || settings.Enabled != true || isChecking || hasChecked) return;
        isChecking = true;
        checkError = null;
        Refresh();
        try
        {
            availableVersion = await updater.CheckAsync();
            hasChecked = true;
        }
        catch (Exception error)
        {
            checkError = error.Message;
        }
        finally
        {
            isChecking = false;
            Refresh();
        }
    }

    public async Task InstallAsync()
    {
        if (updater is null || availableVersion is null || isInstalling) return;
        isInstalling = true;
        downloadPercent = 0;
        installError = null;
        openError = null;
        Refresh();
        try
        {
            await updater.DownloadAsync(new Progress<int>(percent =>
            {
                if (!isInstalling || isApplying) return;
                downloadPercent = percent;
                Refresh();
            }));
            isApplying = true;
            Refresh();
            updater.ApplyAndRestart();
        }
        catch (Exception error)
        {
            installError = $"Could not install the update: {error.Message}";
            isInstalling = false;
            isApplying = false;
            Refresh();
        }
    }

    /* Hides the offer until the next start. */
    public void Postpone()
    {
        isPostponed = true;
        Refresh();
    }

    public void DismissUpdated()
    {
        updatedVersion = null;
        openError = null;
        Refresh();
    }

    public void ReportOpenFailed()
    {
        openError = $"Could not open the browser. The release page is {ReleasePageUrl}";
        Refresh();
    }

    private void Refresh()
    {
        foreach (var name in ComputedProperties)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
