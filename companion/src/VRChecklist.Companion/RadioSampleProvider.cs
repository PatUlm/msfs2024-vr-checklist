using NAudio.Dsp;
using NAudio.Wave;

namespace VRChecklist.Companion;

// Runs only when the audio device requests samples. No timer, simulator polling,
// background rendering or second audio asset. Each playback owns its DSP state.
public sealed class RadioSampleProvider : ISampleProvider
{
    private readonly ISampleProvider source;
    private readonly Func<bool> isEnabled;
    private readonly BiQuadFilter highPass;
    private readonly BiQuadFilter lowPass;
    private readonly BiQuadFilter finalLowPass;
    private readonly double attack;
    private readonly double release;
    private readonly float mixStep;
    private float mix;
    private double envelope;

    public RadioSampleProvider(ISampleProvider source, Func<bool> isEnabled)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(isEnabled);
        if (source.WaveFormat.Channels != 1 || source.WaveFormat.SampleRate < 8000)
            throw new ArgumentException("Radio processing requires mono audio at 8 kHz or higher.", nameof(source));
        this.source = source;
        this.isEnabled = isEnabled;
        var rate = source.WaveFormat.SampleRate;
        highPass = BiQuadFilter.HighPassFilter(rate, 300, 0.70710678f);
        lowPass = BiQuadFilter.LowPassFilter(rate, 3000, 0.70710678f);
        finalLowPass = BiQuadFilter.LowPassFilter(rate, 3300, 0.70710678f);
        attack = Math.Exp(-1.0 / (rate * 0.005));
        release = Math.Exp(-1.0 / (rate * 0.080));
        mixStep = 1f / (rate * 0.010f);
        mix = isEnabled() ? 1 : 0;
    }

    public WaveFormat WaveFormat => source.WaveFormat;

    public int Read(float[] buffer, int offset, int count)
        => Read(buffer.AsSpan(offset, count));

    public int Read(Span<float> buffer)
    {
        var read = source.Read(buffer);
        var target = isEnabled() ? 1f : 0f;
        if (target == 0 && mix == 0) return read; // Clean is an exact bypass.

        for (var index = 0; index < read; index++)
        {
            var dry = buffer[index];
            var band = lowPass.Transform(highPass.Transform(dry));
            var level = Math.Abs(band);
            var coefficient = level > envelope ? attack : release;
            envelope = coefficient * envelope + (1 - coefficient) * level;
            // 3:1 compression above -20 dBFS, modest makeup, soft saturation.
            var gain = envelope > 0.1 ? Math.Pow(0.1 / envelope, 2.0 / 3.0) : 1;
            var wet = finalLowPass.Transform((float)(0.63 * Math.Tanh(band * gain * 1.5 / 0.7)));
            // Compensate some speech-band loss; retain headroom without a loudness scan.
            wet = Math.Clamp(wet * 1.6f, -0.89f, 0.89f);
            mix = target > mix ? Math.Min(target, mix + mixStep) : Math.Max(target, mix - mixStep);
            buffer[index] = dry + (wet - dry) * mix;
        }
        return read;
    }
}
