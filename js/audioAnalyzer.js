/* global Meyda */

// Idealized 12-bin Pitch Profiles
const CHORD_PROFILES = [
  // Major Triads
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
  // Minor Triads
  { name: 'Cm',  profile: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0] },
  { name: 'C#m', profile: [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
  { name: 'Dm',  profile: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
  { name: 'D#m', profile: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0] },
  { name: 'Em',  profile: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1] },
  { name: 'Fm',  profile: [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
  { name: 'F#m', profile: [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
  { name: 'Gm',  profile: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1] },
  { name: 'G#m', profile: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0] },
  { name: 'Am',  profile: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
  { name: 'A#m', profile: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
  { name: 'Bm',  profile: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] }
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
 */
export async function analyzeAudioBuffer(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const bufferSize = 4096;
  const hopSize = Math.floor(sampleRate * 1.5); // Analyze frame every 1.5s

  Meyda.bufferSize = bufferSize;
  Meyda.sampleRate = sampleRate;

  const timeline = [];

  for (let offset = 0; offset < channelData.length; offset += hopSize) {
    const frame = channelData.subarray(offset, offset + bufferSize);
    if (frame.length < bufferSize) break;

    const chroma = Meyda.extract('chroma', frame);
    const startTime = offset / sampleRate;
    const endTime = Math.min((offset + hopSize) / sampleRate, audioBuffer.duration);

    if (chroma && chroma.length === 12) {
      const detectedChord = matchChord(chroma);
      timeline.push({
        startTime,
        endTime,
        chord: detectedChord,
        chroma: Array.from(chroma)
      });
    }
  }

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
