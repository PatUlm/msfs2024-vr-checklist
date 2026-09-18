using NAudio.Wave;
using NAudio.Wave.SampleProviders;
using VRChecklist.Companion;

namespace VRChecklist.TransportProbe;

internal static class RadioSelfTests
{
    public static void CleanBypass()
    {
        var input = Enumerable.Range(0, 4096).Select(i => (float)(0.4 * Math.Sin(i * 0.071))).ToArray();
        var source = new Samples(input);
        var radio = new RadioSampleProvider(source, () => false);
        var buffer = Enumerable.Repeat(123f, input.Length + 10).ToArray();
        Require(radio.Read(buffer, 5, input.Length) == input.Length, "Bypass changed the sample count.");
        Require(buffer.Skip(5).Take(input.Length).SequenceEqual(input), "Clean must be bit-identical to the input.");
        Require(buffer.Take(5).Concat(buffer.Skip(input.Length + 5)).All(x => x == 123), "Read touched buffer guards.");
        Require(radio.Read(buffer, 0, buffer.Length) == 0, "End of stream must remain empty.");
    }

    public static void SpeechBand()
    {
        var mid = Gain(1000);
        Require(Gain(50) < mid * 0.06, "Radio must suppress low rumble.");
        Require(Gain(10000) < mid * 0.04, "Radio must suppress high frequencies.");
        Require(mid > 0.5 && mid < 2.5, "Speech-band gain is implausible.");
    }

    public static void StreamingAndSwitching()
    {
        var input = Enumerable.Range(0, 24000).Select(i => (float)(0.9 * Math.Sin(i * 0.12))).ToArray();
        var whole = Process(input, input.Length);
        var chunked = Process(input, 257);
        Require(whole.SequenceEqual(chunked), "Audio callback sizes must not change the filter output.");
        Require(whole.All(x => float.IsFinite(x) && Math.Abs(x) <= 0.89f), "Radio output clipped or became non-finite.");

        var enabled = false;
        var provider = new RadioSampleProvider(new Samples(input), () => enabled);
        var buffer = new float[2048];
        provider.Read(buffer, 0, buffer.Length);
        Require(buffer.SequenceEqual(input.Take(buffer.Length)), "Initial clean playback changed.");
        enabled = true;
        provider.Read(buffer, 0, buffer.Length);
        Require(!buffer.SequenceEqual(input.Skip(2048).Take(2048)), "Live enable did not affect the running stream.");
        // The first changed sample only moves 1/480 of the distance to the wet signal.
        Require(Math.Abs(buffer[0] - input[2048]) < 0.01, "Enable introduced a hard switch.");
        enabled = false;
        provider.Read(buffer, 0, buffer.Length);
        Require(buffer.Skip(500).SequenceEqual(input.Skip(4096 + 500).Take(2048 - 500)),
            "Disabling must return to clean within the 10 ms transition.");
    }

    public static void ShippedClip()
    {
        using var stream = OpusClip.LoadEmbeddedCompletion().OpenRead();
        var source = new RadioSampleProvider(stream.ToSampleProvider(), () => true);
        var samples = new List<float>();
        var buffer = new float[1024];
        int count;
        while ((count = source.Read(buffer, 0, buffer.Length)) > 0) samples.AddRange(buffer.Take(count));
        Require(samples.Count > 24000 && samples.All(float.IsFinite), "Shipped audio did not decode/filter.");
        Require(samples.Max(x => Math.Abs(x)) > 0.05, "Radio announcement is silent.");
        Require(samples.Max(x => Math.Abs(x)) < 0.9, "Radio announcement has no headroom.");
    }

    private static float[] Process(float[] input, int blockSize)
    {
        var provider = new RadioSampleProvider(new Samples(input), () => true);
        var output = new float[input.Length];
        for (var i = 0; i < output.Length;)
            i += provider.Read(output, i, Math.Min(blockSize, output.Length - i));
        return output;
    }

    private static double Gain(double frequency)
    {
        var input = Enumerable.Range(0, 48000).Select(i => (float)(0.01 * Math.Sin(2 * Math.PI * frequency * i / 48000))).ToArray();
        var output = Process(input, 480);
        return Math.Sqrt(output.Skip(24000).Sum(x => (double)x * x) / input.Skip(24000).Sum(x => (double)x * x));
    }

    private sealed class Samples(float[] values) : ISampleProvider
    {
        private int position;
        public WaveFormat WaveFormat { get; } = WaveFormat.CreateIeeeFloatWaveFormat(48000, 1);
        public int Read(float[] buffer, int offset, int count)
            => Read(buffer.AsSpan(offset, count));

        public int Read(Span<float> buffer)
        {
            var read = Math.Min(buffer.Length, values.Length - position);
            values.AsSpan(position, read).CopyTo(buffer);
            position += read;
            return read;
        }
    }

    private static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
