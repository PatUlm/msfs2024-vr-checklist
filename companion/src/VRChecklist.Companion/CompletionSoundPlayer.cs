using System.Runtime.Versioning;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace VRChecklist.Companion;

/*
 * Plays the embedded "Checklist completed" clip on the Windows default output
 * device through WASAPI in shared mode (ADR 0004). The Opus clip is decoded
 * once at construction and converted to stereo float, the usual shared-mode
 * mix format, so the audio engine mixes it without touching the MSFS stream.
 * A failed playback is reported through the returned task; it must never
 * affect the checklist workflow.
 */
[SupportedOSPlatform("windows")]
public sealed class CompletionSoundPlayer : IDisposable
{
    private const int LatencyMilliseconds = 200;
    private readonly OpusClip clip;
    private readonly object gate = new();
    private WasapiPlayer? output;
    private bool disposed;

    public CompletionSoundPlayer()
        : this(OpusClip.LoadEmbeddedCompletion())
    {
    }

    public CompletionSoundPlayer(OpusClip clip)
    {
        ArgumentNullException.ThrowIfNull(clip);
        this.clip = clip;
    }

    /*
     * Starts the clip and completes when playback stopped. A clip that is
     * still playing is cut off; two group ends within a second are rare and
     * the second announcement is the one that matters.
     */
    public Task PlayAsync()
    {
        var completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        lock (gate)
        {
            ObjectDisposedException.ThrowIf(disposed, this);
            StopCurrentOutput();

            try
            {
                var reader = clip.OpenRead();
                ISampleProvider samples = reader.ToSampleProvider();

                if (samples.WaveFormat.Channels == 1)
                {
                    samples = new MonoToStereoSampleProvider(samples);
                }

                var device = new WasapiPlayerBuilder()
                    .WithSharedMode()
                    .WithLatency(LatencyMilliseconds)
                    .Build();
                device.PlaybackStopped += (_, eventArgs) =>
                {
                    reader.Dispose();

                    if (eventArgs.Exception is null)
                    {
                        completion.TrySetResult();
                    }
                    else
                    {
                        completion.TrySetException(eventArgs.Exception);
                    }
                };
                device.Init(new SampleToWaveProvider(samples));
                device.Play();
                output = device;
            }
            catch (Exception error)
            {
                completion.TrySetException(error);
            }
        }

        return completion.Task;
    }

    public void Dispose()
    {
        lock (gate)
        {
            if (disposed)
            {
                return;
            }

            disposed = true;
            StopCurrentOutput();
        }
    }

    private void StopCurrentOutput()
    {
        var current = output;
        output = null;

        if (current is null)
        {
            return;
        }

        try
        {
            current.Stop();
            current.Dispose();
        }
        catch (Exception)
        {
            // A device that vanished while playing has nothing left to release.
        }
    }
}
