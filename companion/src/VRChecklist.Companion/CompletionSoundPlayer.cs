using System.Runtime.Versioning;
using NAudio.CoreAudioApi;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace VRChecklist.Companion;

/*
 * Plays the embedded "Checklist completed" clip on the Windows default output
 * device or a selected endpoint through WASAPI in shared mode (ADR 0004).
 * The Opus clip is decoded
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
    private readonly Func<string?> getDeviceId;
    private readonly Func<bool> isRadioEnabled;
    private readonly object gate = new();
    private WasapiPlayer? output;
    private MMDevice? outputEndpoint;
    private WaveStream? outputReader;
    private bool disposed;

    public CompletionSoundPlayer()
        : this(OpusClip.LoadEmbeddedCompletion())
    {
    }

    public CompletionSoundPlayer(OpusClip clip, Func<string?>? getDeviceId = null, Func<bool>? isRadioEnabled = null)
    {
        ArgumentNullException.ThrowIfNull(clip);
        this.clip = clip;
        this.getDeviceId = getDeviceId ?? (() => null);
        this.isRadioEnabled = isRadioEnabled ?? (() => true);
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
                outputReader = reader;
                ISampleProvider samples = new RadioSampleProvider(reader.ToSampleProvider(), isRadioEnabled);

                if (samples.WaveFormat.Channels == 1)
                {
                    samples = new MonoToStereoSampleProvider(samples);
                }

                using var enumerator = new MMDeviceEnumerator();
                var deviceId = getDeviceId();
                outputEndpoint = deviceId is null
                    ? enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Console)
                    : enumerator.GetDevice(deviceId);
                if (outputEndpoint.State != DeviceState.Active)
                {
                    throw new InvalidOperationException("Selected audio output is unavailable.");
                }
                var device = new WasapiPlayerBuilder()
                    .WithDevice(outputEndpoint)
                    .WithSharedMode()
                    .WithLatency(LatencyMilliseconds)
                    .Build();
                output = device;
                device.PlaybackStopped += (_, eventArgs) =>
                {
                    if (eventArgs.Exception is null)
                    {
                        completion.TrySetResult();
                    }
                    else
                    {
                        completion.TrySetException(eventArgs.Exception);
                    }

                    // Never dispose/join the native playback thread inside its callback.
                    _ = Task.Run(() =>
                    {
                        lock (gate)
                        {
                            if (ReferenceEquals(output, device)) StopCurrentOutput();
                        }
                    });
                };
                device.Init(new SampleToWaveProvider(samples));
                device.Play();
            }
            catch (Exception error)
            {
                StopCurrentOutput();
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

        try
        {
            current?.Dispose();
        }
        catch (Exception)
        {
            // A device that vanished while playing has nothing left to release.
        }
        finally
        {
            outputReader?.Dispose();
            outputReader = null;
            outputEndpoint?.Dispose();
            outputEndpoint = null;
        }
    }
}
