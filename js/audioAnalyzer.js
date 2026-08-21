/* global EssentiaWasm, Essentia */

let essentia = null;

// Initialize Essentia WASM module
async function initEssentia() {
  if (essentia) return essentia;
  
  return new Promise((resolve) => {
    EssentiaWasm().then((wasmModule) => {
      essentia = new Essentia(wasmModule);
      resolve(essentia);
    });
  });
}

// Idealized 12-bin Chroma profiles for Major and Minor triads
const CHORD_PROFILES = [
  // Major triads
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
  // Minor triads
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

// Cosine similarity to match extracted chromagram against ideal chord profiles
function matchChord(chroma) {
  let maxSimilarity = -Infinity;
  let bestChord = 'C';

  for (const { name, profile } of CHORD_PROFILES) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < 12; i++) {
      dotProduct += chroma[i] * profile[i];
      normA += chroma[i] * chroma[i];
      normB += profile[i] * profile[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestChord = name;
    }
  }

  return bestChord;
}

/**
 * Analyzes audio buffer using Essentia WASM HPCP feature extraction.
 */
export async function analyzeAudioBuffer(audioBuffer) {
  const ess = await initEssentia();
  
  // Get mono channel audio data
  const pcmData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Windowing settings for ~2 seconds per chord window
  const frameSize = 4096;
  const hopSize = 2048;
  const windowSize = Math.floor(sampleRate * 1.5); // Analyze every 1.5s block
  
  const rawDetections = [];

  for (let offset = 0; offset < pcmData.length; offset += windowSize) {
    const chunk = pcmData.subarray(offset, offset + windowSize);
    if (chunk.length < frameSize) break;

    // Convert Audio Chunk to Essentia Vector
    const signalVector = ess.arrayToVector(chunk);
    
    // Extract Pitch Class Profile (HPCP)
    const hpcpResult = ess.HPCP(signalVector, sampleRate);
    const chroma = ess.vectorToArray(hpcpResult.hpcp);
    
    // Free C++ WASM Memory
    signalVector.delete();

    const startTime = offset / sampleRate;
    const endTime = Math.min((offset + windowSize) / sampleRate, audioBuffer.duration);
    const detectedChord = matchChord(chroma);

    rawDetections.push({ startTime, endTime, chord: detectedChord });
  }

  // Smooth out rapid flickering (merge adjacent identical chords)
  return mergeIdenticalChords(rawDetections);
}

function mergeIdenticalChords(detections) {
  if (!detections.length) return [];
  
  const merged = [detections[0]];

  for (let i = 1; i < detections.length; i++) {
    const last = merged[merged.length - 1];
    const current = detections[i];

    if (current.chord === last.chord) {
      last.endTime = current.endTime;
    } else {
      merged.push(current);
    }
  }

  return merged;
}
