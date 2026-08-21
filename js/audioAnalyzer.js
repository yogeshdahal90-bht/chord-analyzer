/**
 * Mock chromagram feature extraction.
 * Integrates directly with Essentia.js WASM or Web Audio API AnalyserNode.
 */
export async function analyzeAudioBuffer(audioBuffer) {
  // Simulating time-aligned extracted chords over track duration
  const duration = audioBuffer.duration;
  const mockChords = ["C", "G", "Am", "F"];
  const progression = [];
  const interval = 3.0; // Every 3 seconds

  for (let time = 0; time < duration; time += interval) {
    const chordIndex = Math.floor(time / interval) % mockChords.length;
    progression.push({
      startTime: time,
      endTime: Math.min(time + interval, duration),
      chord: mockChords[chordIndex]
    });
  }

  return progression;
}
