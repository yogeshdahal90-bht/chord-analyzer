/* global Meyda */

// Idealized 12-bin Pitch Profiles (index 0=C, 1=C#, 2=D ... 11=B)
// Each profile has 1s on the root, third, and fifth of the triad.
const CHORD_PROFILES = [
  // Major Triads (root, +4 semitones, +7 semitones)
  { name: 'C',   profile: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0] },
  { name: 'C#',  profile: [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
  { name: 'D',   profile: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
  { name: 'D#',  profile: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0] },
  { name: 'E',   profile: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1] },
  { name: 'F',   profile: [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
  { name: 'F#',  profile: [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
  { name: 'G',   profile: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1] },
  { name: 'G#',  profile: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0] },
  { name: 'A',   profile: [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
  { name: 'A#',  profile: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0] },
  { name: 'B',   profile: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1] },
  // Minor Triads (root, +3 semitones, +7 semitones)
  { name: 'Cm',  profile: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0] },
  { name: 'C#m', profile: [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
  { name: 'Dm',  profile: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
  { name: 'D#m', profile: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0] },
  { name: 'Em',  profile: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1] },
  { name: 'Fm',  profile: [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
  { name: 'F#m', profile: [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
  { name: 'Gm',  profile: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0] },
  { name: 'G#m', profile: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1] },
  { name: 'Am',  profile: [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
  { name: 'A#m', profile: [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0] },
  { name: 'Bm',  profile: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1] }
];

export function matchChord(chroma) {
  let maxScore = -1;
  let bestChord = 'C';

  for (const { name, profile } of CHORD_PROFILES) {
    let score = 0;
    for (let i = 0; i < 12; i++) {
      score += (chroma[i] || 0) * profile[i];
    }
    if (score > maxScore) {
      maxScore = score;
      bestChord = name;
    }
  }

  return bestChord;
}

/**
 * Pre-computes full track Chromagram and Chord Timeline.
 * Each 1.5s "slot" is analyzed as several overlapping sub-frames whose
 * chroma vectors are averaged, rather than a single ~93ms snapshot,
 * so a chord held across the slot is detected far more reliably.
 *
 * onProgress(fraction) is optional and called periodically (0..1).
 */
export async function analyzeAudioBuffer(audioBuffer, onProgress) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const bufferSize = 4096;
  const hopSize = Math.floor(sampleRate * 1.5); // one chord "slot" every 1.5s
  const subFrameStep = Math.floor(bufferSize / 2); // 50% overlap within a slot

  Meyda.bufferSize = bufferSize;
  Meyda.sampleRate = sampleRate;

  const timeline = [];
  const totalLength = channelData.length;

  for (let offset = 0; offset + bufferSize <= totalLength; offset += hopSize) {
    const slotEnd = Math.min(offset + hopSize, totalLength);
    const accum = new Array(12).fill(0);
    let frameCount = 0;

    for (let subOffset = offset; subOffset + bufferSize <= slotEnd; subOffset += subFrameStep) {
      const frame = channelData.subarray(subOffset, subOffset + bufferSize);
      const chroma = Meyda.extract('chroma', frame);
      if (chroma && chroma.length === 12) {
        for (let i = 0; i < 12; i++) accum[i] += chroma[i];
        frameCount++;
      }
    }

    if (frameCount === 0) continue;

    const avgChroma = accum.map((v) => v / frameCount);
    const startTime = offset / sampleRate;
    const endTime = slotEnd / sampleRate;
    const detectedChord = matchChord(avgChroma);

    timeline.push({ startTime, endTime, chord: detectedChord, chroma: avgChroma });

    if (onProgress) onProgress(Math.min(1, offset / totalLength));
  }

  if (onProgress) onProgress(1);
  return mergeIdenticalChords(timeline);
}

function mergeIdenticalChords(timeline) {
  if (!timeline.length) return [];
  const merged = [timeline[0]];

  for (let i = 1; i < timeline.length; i++) {
    const last = merged[merged.length - 1];
    const current = timeline[i];

    if (current.chord === last.chord) {
      last.endTime = current.endTime;
    } else {
      merged.push(current);
    }
  }

  return merged;
}
