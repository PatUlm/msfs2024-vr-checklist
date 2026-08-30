namespace VRChecklist.Companion;

public sealed record ReleaseNoteLine(string Text);

public sealed class ReleaseNotesReleaseViewModel
{
    public ReleaseNotesReleaseViewModel(ReleaseNotesRelease release)
    {
        Version = release.Version;
        Date = release.Date;
        Highlight = release.Highlight;
        Features = release.Features.Select(text => new ReleaseNoteLine(text)).ToArray();
        Fixes = release.Fixes.Select(text => new ReleaseNoteLine(text)).ToArray();
    }

    public string Version { get; }

    public string Date { get; }

    public string Highlight { get; }

    public IReadOnlyList<ReleaseNoteLine> Features { get; }

    public IReadOnlyList<ReleaseNoteLine> Fixes { get; }

    public bool HasFeatures => Features.Count > 0;

    public bool HasFixes => Fixes.Count > 0;
}

public sealed class ReleaseNotesViewModel
{
    public ReleaseNotesViewModel(ReleaseNotesDocument document)
    {
        Releases = document.Releases
            .Select(release => new ReleaseNotesReleaseViewModel(release))
            .ToArray();
    }

    public IReadOnlyList<ReleaseNotesReleaseViewModel> Releases { get; }
}
