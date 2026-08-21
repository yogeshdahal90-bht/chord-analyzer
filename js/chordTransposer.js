const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_MAP = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };

// The shapes most guitarists find easiest to fret (open-position chords).
const EASY_CHORDS = new Set(["C", "D", "E", "G", "A", "Am", "Dm", "Em"]);

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

/**
 * Given the list of detected chord names (may contain duplicates), finds
 * the capo position (0-7) that converts the most unique chords into an
 * "easy" open-chord shape. Ties go to the lowest capo fret.
 *
 * Returns { capo, easyCount, totalUnique, shapes } where `shapes` maps
 * each original chord to the shape you'd play at that capo.
 */
export function suggestBestCapo(chordNames, maxCapo = 7) {
  const uniqueChords = [...new Set(chordNames)];
  let best = { capo: 0, easyCount: -1, totalUnique: uniqueChords.length, shapes: {} };

  for (let capo = 0; capo <= maxCapo; capo++) {
    let easyCount = 0;
    const shapes = {};

    for (const chord of uniqueChords) {
      const transposed = transposeForCapo(chord, capo);
      shapes[chord] = transposed;
      if (EASY_CHORDS.has(transposed)) easyCount++;
    }

    if (easyCount > best.easyCount) {
      best = { capo, easyCount, totalUnique: uniqueChords.length, shapes };
    }
  }

  return best;
}
