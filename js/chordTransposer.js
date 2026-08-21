const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_MAP = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };

export function transposeForCapo(chordName, capoFret) {
  if (!chordName || capoFret === 0) return chordName;

  const match = chordName.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chordName;

  let [, root, quality] = match;

  if (FLAT_MAP[root]) {
    root = FLAT_MAP[root];
  }

  const rootIndex = CHROMATIC_SCALE.indexOf(root);
  if (rootIndex === -1) return chordName;

  let transposedIndex = (rootIndex - capoFret) % 12;
  if (transposedIndex < 0) {
    transposedIndex += 12;
  }

  return CHROMATIC_SCALE[transposedIndex] + quality;
}
