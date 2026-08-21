// Pitch index map supporting sharp and flat normalization
const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_MAP = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };

/**
 * Transposes a chord label for a given Capo position.
 * @param {string} chordName - Full chord string (e.g., "Cmaj", "F#m", "Bb")
 * @param {number} capoFret - Fret position (0 - 7)
 * @returns {string} Transposed chord shape label
 */
export function transposeForCapo(chordName, capoFret) {
  if (!chordName || capoFret === 0) return chordName;

  // Extract root note and quality suffix
  const match = chordName.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chordName;

  let [, root, quality] = match;

  // Normalize flats to sharps
  if (FLAT_MAP[root]) {
    root = FLAT_MAP[root];
  }

  const rootIndex = CHROMATIC_SCALE.indexOf(root);
  if (rootIndex === -1) return chordName;

  // Moving capo UP N frets requires playing shape N semitones DOWN
  let transposedIndex = (rootIndex - capoFret) % 12;
  if (transposedIndex < 0) {
    transposedIndex += 12;
  }

  return CHROMATIC_SCALE[transposedIndex] + quality;
}
