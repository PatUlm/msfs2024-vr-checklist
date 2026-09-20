using System.Globalization;
using System.IO.Compression;
using System.Text;

namespace VRChecklist.Companion;

/// <summary>
/// Renders a checklist as a printable A4 PDF that follows the layout of the
/// ODS source sheets: two column pairs per page, a challenge and a response
/// cell per item, a framed header row per section and a closing line below
/// the last item. Sections flow left column, right column, next page and are
/// kept together in one column whenever they fit.
/// </summary>
/// <remarks>
/// The PDF is written directly with the standard 14 fonts (Helvetica family
/// and Symbol), which every PDF viewer provides. No font is embedded, so a
/// checklist stays at a few kilobytes.
/// </remarks>
public static class ChecklistPdfRenderer
{
    private const float PointsPerCentimetre = 72f / 2.54f;
    private const float PageWidth = 21f * PointsPerCentimetre;
    private const float PageHeight = 29.7f * PointsPerCentimetre;
    private const float PageMargin = 1f * PointsPerCentimetre;
    private const float ChallengeWidth = 5.5f * PointsPerCentimetre;
    private const float ResponseWidth = 3.5f * PointsPerCentimetre;
    private const float ColumnGap = 1f * PointsPerCentimetre;
    private const float ColumnWidth = ChallengeWidth + ResponseWidth;
    private const float CellPadding = 3f;
    private const float DetailIndent = 8f;
    private const float SectionSpacing = 10f;
    private const float HeaderGap = 0.5f * PointsPerCentimetre;
    private const float BorderWidth = 0.74f;
    private const string ContinuationSuffix = " (cont.)";

    private static readonly TextStyle TitleStyle = new(PdfFont.Bold, 18f);
    private static readonly TextStyle RegularStyle = new(PdfFont.Regular, 10f);
    private static readonly TextStyle BoldStyle = new(PdfFont.Bold, 10f);
    private static readonly TextStyle DetailStyle = new(PdfFont.Oblique, 8f);

    private static readonly PdfColor TextColor = new(0, 0, 0);
    private static readonly PdfColor DetailColor = PdfColor.FromHex("#404040");
    private static readonly PdfColor MutedColor = PdfColor.FromHex("#606060");
    private static readonly PdfColor HeaderTextColor = new(1, 1, 1);
    private static readonly PdfColor HeaderFill = PdfColor.FromHex("#808080");
    private static readonly PdfColor VerifyFill = PdfColor.FromHex("#D6E9FF");
    private static readonly PdfColor CommunicationFill = PdfColor.FromHex("#E6D5F5");
    private static readonly PdfColor OptionalFill = PdfColor.FromHex("#E4E4E4");

    private static readonly float BodyTop = PageMargin + TitleStyle.Spacing + HeaderGap;
    private static readonly float BodyBottom = PageHeight - PageMargin - DetailStyle.Spacing;

    public static string SuggestFileName(ChecklistDocument checklist) =>
        $"{SanitizeFileNamePart(checklist.Title)} Checklist – {SanitizeFileNamePart(checklist.Revision)}.pdf";

    public static void Render(ChecklistDocument checklist, Stream output)
    {
        var pages = Layout(checklist);
        var writer = new PdfWriter(checklist.Title, $"Revision {checklist.Revision}");
        for (var pageIndex = 0; pageIndex < pages.Count; pageIndex++)
        {
            var content = new PdfContent();
            DrawPageHeader(content, checklist);
            foreach (var placement in pages[pageIndex])
            {
                DrawRow(content, placement);
            }

            if (pages.Count > 1)
            {
                DrawPageFooter(content, pageIndex + 1, pages.Count);
            }

            writer.AddPage(content);
        }

        writer.Write(output);
    }

    private static string SanitizeFileNamePart(string text)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var builder = new StringBuilder(text.Length);
        var pendingSpace = false;
        foreach (var character in text)
        {
            if (Array.IndexOf(invalid, character) >= 0 || char.IsWhiteSpace(character))
            {
                pendingSpace = builder.Length > 0;
                continue;
            }

            if (pendingSpace)
            {
                builder.Append(' ');
                pendingSpace = false;
            }

            builder.Append(character);
        }

        return builder.Length == 0 ? "Checklist" : builder.ToString();
    }

    private static float ColumnX(int column) =>
        PageMargin + column * (ColumnWidth + ColumnGap);

    private static IReadOnlyList<IReadOnlyList<Placement>> Layout(ChecklistDocument checklist)
    {
        var pages = new List<List<Placement>> { new() };
        var column = 0;
        var y = BodyTop;

        void NextColumn()
        {
            if (column == 0)
            {
                column = 1;
            }
            else
            {
                column = 0;
                pages.Add(new List<Placement>());
            }

            y = BodyTop;
        }

        foreach (var section in checklist.Sections)
        {
            var rows = BuildRows(section);
            var sectionHeight = rows.Sum(row => row.Height);
            if (y > BodyTop && y + sectionHeight > BodyBottom)
            {
                NextColumn();
            }

            Placement? previous = null;
            foreach (var row in rows)
            {
                if (y > BodyTop && y + row.Height > BodyBottom)
                {
                    if (previous is not null)
                    {
                        previous.ClosesSection = true;
                    }

                    NextColumn();
                    var continuation = BuildHeaderRow(section.Title + ContinuationSuffix, section.Phase);
                    pages[^1].Add(new Placement(column, y, continuation));
                    y += continuation.Height;
                }

                previous = new Placement(column, y, row);
                pages[^1].Add(previous);
                y += row.Height;
            }

            if (previous is not null)
            {
                previous.ClosesSection = true;
            }

            y += SectionSpacing;
        }

        return pages;
    }

    private static List<RowLayout> BuildRows(ChecklistSectionDocument section)
    {
        var rows = new List<RowLayout> { BuildHeaderRow(section.Title, section.Phase) };
        foreach (var item in section.Items)
        {
            rows.Add(BuildItemRow(item));
        }

        return rows;
    }

    private static RowLayout BuildHeaderRow(string title, string phase)
    {
        var lines = Wrap(BoldStyle, $"{title} [{phase}]", ColumnWidth - 2 * CellPadding);
        return new RowLayout
        {
            HeaderLines = lines,
            Fill = HeaderFill,
            Height = lines.Count * BoldStyle.Spacing + 2 * CellPadding,
        };
    }

    private static RowLayout BuildItemRow(ChecklistItemDocument item)
    {
        var challenge = Wrap(RegularStyle, item.Challenge, ChallengeWidth - 2 * CellPadding);
        var response = Wrap(BoldStyle, item.Response, ResponseWidth - 2 * CellPadding);
        var details = new List<string>();
        var detailWidth = ColumnWidth - 2 * CellPadding - DetailIndent;
        if (item.Condition is not null)
        {
            details.AddRange(Wrap(DetailStyle, item.Condition, detailWidth));
        }

        foreach (var alternative in item.Alternatives ?? [])
        {
            details.AddRange(Wrap(
                DetailStyle,
                $"{alternative.When}: {alternative.Response}",
                detailWidth));
        }

        foreach (var note in item.Notes ?? [])
        {
            details.AddRange(Wrap(DetailStyle, note, detailWidth));
        }

        var mainHeight = Math.Max(challenge.Count, response.Count) * RegularStyle.Spacing;
        var detailHeight = details.Count * DetailStyle.Spacing;
        return new RowLayout
        {
            ChallengeLines = challenge,
            ResponseLines = response,
            DetailLines = details,
            Fill = item.Kind switch
            {
                "verify" => VerifyFill,
                "communication" => CommunicationFill,
                "optional" => OptionalFill,
                _ => null,
            },
            Height = mainHeight + detailHeight + 2 * CellPadding,
        };
    }

    private static void DrawPageHeader(PdfContent content, ChecklistDocument checklist)
    {
        var baseline = PageMargin + TitleStyle.Ascent;
        content.DrawText(checklist.Title, PageMargin, baseline, TitleStyle, TextColor, TextAlign.Left);
        content.DrawText(
            $"Revision {checklist.Revision}",
            PageWidth - PageMargin,
            baseline,
            RegularStyle,
            MutedColor,
            TextAlign.Right);
    }

    private static void DrawPageFooter(PdfContent content, int page, int pageCount) =>
        content.DrawText(
            $"Page {page} of {pageCount}",
            PageWidth / 2f,
            PageHeight - PageMargin,
            DetailStyle,
            MutedColor,
            TextAlign.Center);

    private static void DrawRow(PdfContent content, Placement placement)
    {
        var row = placement.Row;
        var x = ColumnX(placement.Column);
        var y = placement.Y;
        var bottom = y + row.Height;

        if (row.Fill is { } fill)
        {
            content.FillRect(x, y, ColumnWidth, row.Height, fill);
        }

        if (row.HeaderLines is not null)
        {
            // Section titles are title case with few descenders, so centre the
            // cap-height box vertically in the header block.
            var textHeight = (row.HeaderLines.Count - 1) * BoldStyle.Spacing + BoldStyle.CapHeight;
            var baseline = y + (row.Height - textHeight) / 2f + BoldStyle.CapHeight;
            foreach (var line in row.HeaderLines)
            {
                content.DrawText(line, x + ColumnWidth / 2f, baseline, BoldStyle, HeaderTextColor, TextAlign.Center);
                baseline += BoldStyle.Spacing;
            }

            content.DrawLine(x, y, x + ColumnWidth, y);
        }
        else
        {
            var baseline = y + CellPadding + RegularStyle.LineBaseline;
            var lineCount = Math.Max(row.ChallengeLines.Count, row.ResponseLines.Count);
            for (var index = 0; index < lineCount; index++)
            {
                if (index < row.ChallengeLines.Count)
                {
                    content.DrawText(
                        row.ChallengeLines[index],
                        x + CellPadding,
                        baseline,
                        RegularStyle,
                        TextColor,
                        TextAlign.Left);
                }

                if (index < row.ResponseLines.Count)
                {
                    content.DrawText(
                        row.ResponseLines[index],
                        x + ChallengeWidth + CellPadding,
                        baseline,
                        BoldStyle,
                        TextColor,
                        TextAlign.Left);
                }

                baseline += RegularStyle.Spacing;
            }

            baseline = y + CellPadding + lineCount * RegularStyle.Spacing + DetailStyle.LineBaseline;
            foreach (var line in row.DetailLines)
            {
                content.DrawText(
                    line,
                    x + CellPadding + DetailIndent,
                    baseline,
                    DetailStyle,
                    DetailColor,
                    TextAlign.Left);
                baseline += DetailStyle.Spacing;
            }
        }

        content.DrawLine(x, y, x, bottom);
        content.DrawLine(x + ColumnWidth, y, x + ColumnWidth, bottom);
        if (placement.ClosesSection)
        {
            content.DrawLine(x, bottom, x + ColumnWidth, bottom);
        }
    }

    private static List<string> Wrap(TextStyle style, string text, float maxWidth)
    {
        var lines = new List<string>();
        var current = new StringBuilder();
        foreach (var word in text.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = current.Length == 0 ? word : $"{current} {word}";
            if (style.Measure(candidate) <= maxWidth)
            {
                current.Clear().Append(candidate);
                continue;
            }

            if (current.Length > 0)
            {
                lines.Add(current.ToString());
                current.Clear();
            }

            if (style.Measure(word) <= maxWidth)
            {
                current.Append(word);
                continue;
            }

            foreach (var character in word)
            {
                if (current.Length > 0 && style.Measure($"{current}{character}") > maxWidth)
                {
                    lines.Add(current.ToString());
                    current.Clear();
                }

                current.Append(character);
            }
        }

        if (current.Length > 0 || lines.Count == 0)
        {
            lines.Add(current.ToString());
        }

        return lines;
    }

    private enum TextAlign
    {
        Left,
        Center,
        Right,
    }

    private sealed class RowLayout
    {
        public required float Height { get; init; }

        public PdfColor? Fill { get; init; }

        public IReadOnlyList<string>? HeaderLines { get; init; }

        public IReadOnlyList<string> ChallengeLines { get; init; } = [];

        public IReadOnlyList<string> ResponseLines { get; init; } = [];

        public IReadOnlyList<string> DetailLines { get; init; } = [];
    }

    private sealed class Placement(int column, float y, RowLayout row)
    {
        public int Column { get; } = column;

        public float Y { get; } = y;

        public RowLayout Row { get; } = row;

        public bool ClosesSection { get; set; }
    }

    private readonly record struct PdfColor(float Red, float Green, float Blue)
    {
        public static PdfColor FromHex(string hex) =>
            new(
                Convert.ToInt32(hex.Substring(1, 2), 16) / 255f,
                Convert.ToInt32(hex.Substring(3, 2), 16) / 255f,
                Convert.ToInt32(hex.Substring(5, 2), 16) / 255f);
    }

    /// <summary>
    /// A font size on top of a standard font. Helvetica's ascender is 718/1000
    /// of the size; 1.2 times the size is the usual line spacing.
    /// </summary>
    private sealed class TextStyle(PdfFont font, float size)
    {
        public PdfFont Font { get; } = font;

        public float Size { get; } = size;

        public float Spacing { get; } = size * 1.2f;

        public float Ascent { get; } = size * 0.718f;

        public float Descent { get; } = size * 0.207f;

        public float CapHeight { get; } = size * 0.718f;

        /// <summary>
        /// Baseline offset that centres the glyph box (ascender to descender)
        /// within one line of <see cref="Spacing"/>.
        /// </summary>
        public float LineBaseline { get; } = (size * 1.2f - size * 0.718f - size * 0.207f) / 2f + size * 0.718f;

        public float Measure(string text)
        {
            var width = 0f;
            foreach (var run in PdfText.Encode(text, Font))
            {
                foreach (var code in run.Bytes)
                {
                    width += run.Font.Width(code);
                }
            }

            return width / 1000f * Size;
        }
    }

    /// <summary>
    /// One of the standard 14 fonts with its WinAnsi advance widths. Helvetica
    /// and Helvetica-Oblique share one width table, Symbol supplies the few
    /// glyphs outside WinAnsi that checklists use.
    /// </summary>
    private sealed class PdfFont
    {
        private static readonly int[] HelveticaWidths =
        [
            278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
            556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
            1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
            667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
            333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
            556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0,
            556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
            0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
            278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 552,
            400, 549, 333, 333, 333, 576, 537, 333, 333, 333, 365, 556, 834, 834, 834, 611,
            667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
            722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
            556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
            556, 556, 556, 556, 556, 556, 556, 549, 611, 556, 556, 556, 556, 500, 556, 500,
        ];

        private static readonly int[] HelveticaBoldWidths =
        [
            278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
            556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
            975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
            667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
            333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
            611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0,
            556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
            0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
            278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 552,
            400, 549, 333, 333, 333, 576, 556, 333, 333, 333, 365, 556, 834, 834, 834, 611,
            722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
            722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
            556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
            611, 611, 611, 611, 611, 611, 611, 549, 611, 611, 611, 611, 611, 556, 611, 556,
        ];

        // Symbol glyphs used for characters outside WinAnsi: code and width.
        private static readonly Dictionary<char, (byte Code, int Width)> SymbolGlyphs = new()
        {
            ['≤'] = (0xA3, 549), // lessequal
            ['≥'] = (0xB3, 549), // greaterequal
            ['→'] = (0xAE, 987), // arrowright
        };

        public static readonly PdfFont Regular = new("F1", "Helvetica", HelveticaWidths, winAnsi: true);
        public static readonly PdfFont Bold = new("F2", "Helvetica-Bold", HelveticaBoldWidths, winAnsi: true);
        public static readonly PdfFont Oblique = new("F3", "Helvetica-Oblique", HelveticaWidths, winAnsi: true);
        public static readonly PdfFont Symbol = new("F4", "Symbol", null, winAnsi: false);

        public static readonly IReadOnlyList<PdfFont> All = [Regular, Bold, Oblique, Symbol];

        private readonly int[]? widths;

        private PdfFont(string resourceName, string baseFont, int[]? widths, bool winAnsi)
        {
            ResourceName = resourceName;
            BaseFont = baseFont;
            WinAnsi = winAnsi;
            this.widths = widths;
        }

        public string ResourceName { get; }

        public string BaseFont { get; }

        public bool WinAnsi { get; }

        public int Width(byte code)
        {
            if (widths is not null)
            {
                return code < 32 ? 0 : widths[code - 32];
            }

            foreach (var glyph in SymbolGlyphs.Values)
            {
                if (glyph.Code == code)
                {
                    return glyph.Width;
                }
            }

            return 0;
        }

        public static bool TrySymbol(char character, out byte code)
        {
            if (SymbolGlyphs.TryGetValue(character, out var glyph))
            {
                code = glyph.Code;
                return true;
            }

            code = 0;
            return false;
        }
    }

    private sealed record TextRun(PdfFont Font, byte[] Bytes);

    private static class PdfText
    {
        // WinAnsi code points 0x80-0x9F that differ from Latin-1.
        private static readonly Dictionary<char, byte> WinAnsiSpecials = new()
        {
            ['€'] = 0x80, ['‚'] = 0x82, ['ƒ'] = 0x83, ['„'] = 0x84,
            ['…'] = 0x85, ['†'] = 0x86, ['‡'] = 0x87, ['ˆ'] = 0x88,
            ['‰'] = 0x89, ['Š'] = 0x8A, ['‹'] = 0x8B, ['Œ'] = 0x8C,
            ['Ž'] = 0x8E, ['‘'] = 0x91, ['’'] = 0x92, ['“'] = 0x93,
            ['”'] = 0x94, ['•'] = 0x95, ['–'] = 0x96, ['—'] = 0x97,
            ['˜'] = 0x98, ['™'] = 0x99, ['š'] = 0x9A, ['›'] = 0x9B,
            ['œ'] = 0x9C, ['ž'] = 0x9E, ['Ÿ'] = 0x9F,
            // No-break, thin and narrow no-break spaces become plain spaces.
            ['\u00A0'] = 0x20, ['\u2009'] = 0x20, ['\u202F'] = 0x20,
        };

        public static List<TextRun> Encode(string text, PdfFont font)
        {
            var runs = new List<TextRun>();
            var current = new List<byte>();
            var currentFont = font;

            void Flush()
            {
                if (current.Count > 0)
                {
                    runs.Add(new TextRun(currentFont, current.ToArray()));
                    current.Clear();
                }
            }

            foreach (var character in text)
            {
                PdfFont target;
                byte code;
                if (PdfFont.TrySymbol(character, out var symbolCode))
                {
                    target = PdfFont.Symbol;
                    code = symbolCode;
                }
                else
                {
                    target = font;
                    code = EncodeWinAnsi(character);
                }

                if (!ReferenceEquals(target, currentFont))
                {
                    Flush();
                    currentFont = target;
                }

                current.Add(code);
            }

            Flush();
            return runs;
        }

        private static byte EncodeWinAnsi(char character)
        {
            if (character is >= ' ' and <= '~' or >= '\u00A1' and <= '\u00FF')
            {
                return (byte)character;
            }

            return WinAnsiSpecials.TryGetValue(character, out var code) ? code : (byte)'?';
        }
    }

    /// <summary>
    /// Builds one page content stream in PDF user space. Callers pass
    /// top-left based coordinates; the y axis is flipped here.
    /// </summary>
    private sealed class PdfContent
    {
        private readonly MemoryStream stream = new();

        public byte[] ToArray() => stream.ToArray();

        public void FillRect(float x, float y, float width, float height, PdfColor color)
        {
            Append($"{F(color.Red)} {F(color.Green)} {F(color.Blue)} rg ");
            Append($"{F(x)} {F(PageHeight - y - height)} {F(width)} {F(height)} re f\n");
        }

        public void DrawLine(float x1, float y1, float x2, float y2) =>
            Append($"0 G {F(BorderWidth)} w {F(x1)} {F(PageHeight - y1)} m {F(x2)} {F(PageHeight - y2)} l S\n");

        public void DrawText(
            string text,
            float x,
            float baseline,
            TextStyle style,
            PdfColor color,
            TextAlign align)
        {
            var start = align switch
            {
                TextAlign.Center => x - style.Measure(text) / 2f,
                TextAlign.Right => x - style.Measure(text),
                _ => x,
            };

            Append($"BT {F(color.Red)} {F(color.Green)} {F(color.Blue)} rg ");
            Append($"{F(start)} {F(PageHeight - baseline)} Td ");
            foreach (var run in PdfText.Encode(text, style.Font))
            {
                Append($"/{run.Font.ResourceName} {F(style.Size)} Tf (");
                foreach (var code in run.Bytes)
                {
                    if (code is (byte)'(' or (byte)')' or (byte)'\\')
                    {
                        stream.WriteByte((byte)'\\');
                        stream.WriteByte(code);
                    }
                    else if (code < 32 || code > 126)
                    {
                        Append("\\" + Convert.ToString(code, 8).PadLeft(3, '0'));
                    }
                    else
                    {
                        stream.WriteByte(code);
                    }
                }

                Append(") Tj ");
            }

            Append("ET\n");
        }

        private void Append(string text)
        {
            foreach (var character in text)
            {
                stream.WriteByte((byte)character);
            }
        }
    }

    private static string F(float value) =>
        value.ToString("0.###", CultureInfo.InvariantCulture);

    /// <summary>
    /// Minimal PDF 1.4 writer: catalog, page tree, standard fonts, one
    /// Flate-compressed content stream per page and a classic xref table.
    /// </summary>
    private sealed class PdfWriter(string title, string subject)
    {
        private readonly List<byte[]> pageContents = [];

        public void AddPage(PdfContent content) => pageContents.Add(content.ToArray());

        public void Write(Stream output)
        {
            // Object numbers: 1 catalog, 2 pages, 3 info, 4..7 fonts, then page + content pairs.
            const int firstPageObject = 8;
            var objects = new List<byte[]>();
            var pageObjectNumbers = Enumerable.Range(0, pageContents.Count)
                .Select(index => firstPageObject + 2 * index);
            var kids = string.Join(" ", pageObjectNumbers.Select(number => $"{number} 0 R"));

            objects.Add(Ascii("<< /Type /Catalog /Pages 2 0 R >>"));
            objects.Add(Ascii($"<< /Type /Pages /Kids [{kids}] /Count {pageContents.Count} >>"));
            objects.Add(Ascii(
                $"<< /Title {Utf16(title)} /Subject {Utf16(subject)} " +
                "/Creator (VR Checklist Companion) /Producer (VR Checklist Companion) " +
                $"/CreationDate (D:{DateTime.Now:yyyyMMddHHmmss}) >>"));
            foreach (var font in PdfFont.All)
            {
                var encoding = font.WinAnsi ? " /Encoding /WinAnsiEncoding" : string.Empty;
                objects.Add(Ascii($"<< /Type /Font /Subtype /Type1 /BaseFont /{font.BaseFont}{encoding} >>"));
            }

            var fontResources = string.Join(
                " ",
                PdfFont.All.Select((font, index) => $"/{font.ResourceName} {4 + index} 0 R"));

            for (var index = 0; index < pageContents.Count; index++)
            {
                var contentObject = firstPageObject + 2 * index + 1;
                objects.Add(Ascii(
                    $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {F(PageWidth)} {F(PageHeight)}] " +
                    $"/Resources << /Font << {fontResources} >> >> /Contents {contentObject} 0 R >>"));

                var compressed = Compress(pageContents[index]);
                var header = Ascii($"<< /Length {compressed.Length} /Filter /FlateDecode >>\nstream\n");
                var footer = Ascii("\nendstream");
                objects.Add([.. header, .. compressed, .. footer]);
            }

            using var buffer = new MemoryStream();
            buffer.Write(Ascii("%PDF-1.4\n"));
            buffer.Write([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]);
            var offsets = new List<long>();
            for (var index = 0; index < objects.Count; index++)
            {
                offsets.Add(buffer.Position);
                buffer.Write(Ascii($"{index + 1} 0 obj\n"));
                buffer.Write(objects[index]);
                buffer.Write(Ascii("\nendobj\n"));
            }

            var xref = buffer.Position;
            buffer.Write(Ascii($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n"));
            foreach (var offset in offsets)
            {
                buffer.Write(Ascii($"{offset:D10} 00000 n \n"));
            }

            buffer.Write(Ascii(
                $"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n{xref}\n%%EOF\n"));
            buffer.Position = 0;
            buffer.CopyTo(output);
        }

        private static byte[] Compress(byte[] data)
        {
            using var buffer = new MemoryStream();
            using (var zlib = new ZLibStream(buffer, CompressionLevel.Optimal, leaveOpen: true))
            {
                zlib.Write(data);
            }

            return buffer.ToArray();
        }

        private static byte[] Ascii(string text) => Encoding.ASCII.GetBytes(text);

        private static string Utf16(string text)
        {
            var bytes = Encoding.BigEndianUnicode.GetBytes(text);
            return "<FEFF" + Convert.ToHexString(bytes) + ">";
        }
    }
}
