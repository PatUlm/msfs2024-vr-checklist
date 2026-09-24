// Keep group introductions in the same recording as the first item so the
// synthesizer supplies a natural sentence pause and playback stays atomic.
export function itemSpeech(section, item) {
  const text = item.speech ?? `${item.challenge}: ${item.response}`;
  if (item.id !== section.items[0].id) return text;
  const title = section.title.replace(/\b[A-Z]{2,}\b/g, acronym => [...acronym].join(' '))
    .replaceAll('&', 'and');
  return `${title} Checklist. ${text}`;
}
