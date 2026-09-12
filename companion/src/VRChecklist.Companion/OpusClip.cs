using Concentus;
using Concentus.Oggfile;
using NAudio.Wave;

namespace VRChecklist.Companion;

/*
 * A pre-rendered announcement stored as Opus in an Ogg container (ADR 0007),
 * decoded once into 16-bit PCM at the Opus rate of 48 kHz. Concentus is a
 * pure C# port of libopus, so the decode works on every platform and the
 * self-tests can exercise the shipped clip without Windows audio.
 */
public sealed class OpusClip
{
    public const string CompletionResourceName = "VRChecklist.Companion.audio.checklist-completed.opus";
    private const int SampleRate = 48000;
    private const int Channels = 1;
    private readonly byte[] pcm;

    private OpusClip(byte[] pcm)
    {
        this.pcm = pcm;
        WaveFormat = new WaveFormat(SampleRate, 16, Channels);
    }

    public WaveFormat WaveFormat { get; }

    public TimeSpan Duration =>
        TimeSpan.FromSeconds((double)pcm.Length / WaveFormat.AverageBytesPerSecond);

    public static OpusClip Decode(Stream ogg)
    {
        ArgumentNullException.ThrowIfNull(ogg);

        var decoder = OpusCodecFactory.CreateDecoder(SampleRate, Channels);
        var reader = new OpusOggReadStream(decoder, ogg);
        using var pcm = new MemoryStream();

        while (reader.HasNextPacket)
        {
            var packet = reader.DecodeNextPacket();

            if (packet is null)
            {
                continue;
            }

            var bytes = new byte[packet.Length * sizeof(short)];
            Buffer.BlockCopy(packet, 0, bytes, 0, bytes.Length);
            pcm.Write(bytes);
        }

        if (pcm.Length == 0)
        {
            throw new InvalidDataException(
                $"The Opus clip contains no audio{(reader.LastError is null ? "." : $": {reader.LastError}")}");
        }

        return new OpusClip(pcm.ToArray());
    }

    public static OpusClip LoadEmbeddedCompletion() => LoadEmbedded(CompletionResourceName);

    public static OpusClip LoadEmbedded(string resourceName)
    {
        using var stream = typeof(OpusClip).Assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded audio clip '{resourceName}' is missing.");
        return Decode(stream);
    }

    /* A fresh stream per playback; the decoded samples are shared read-only. */
    public WaveStream OpenRead() =>
        new RawSourceWaveStream(new MemoryStream(pcm, writable: false), WaveFormat);
}
