import { analyzeAudioBuffer } from './audioAnalyzer.js';
import { transposeForCapo } from './chordTransposer.js';
import { renderChordSVG } from './chordRenderer.js';

let audioTimelineData = [];
let currentCapo = 0;
let activeChordIndex = -1;

const audioPlayer = document.getElementById('audio-player');
const audioInput = document.getElementById('audio-input');
const capoSelect = document.getElementById('capo-select');
const timelineContainer = document.getElementById('chord-timeline');
const diagramContainer = document.getElementById('chord-diagram');

// 1. Handle File Upload
audioInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  audioPlayer.src = url;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Extract Chromagram / Chord Map
  audioTimelineData = await analyzeAudioBuffer(audioBuffer);
  renderTimeline();
});

// 2. Transposition Event Handler
capoSelect.addEventListener('change', (e) => {
  currentCapo = parseInt(e.target.value, 10);
  renderTimeline();
  if (activeChordIndex !== -1) {
    updateActiveDiagram();
  }
});

// 3. Render Timeline Cards
function renderTimeline() {
  timelineContainer.innerHTML = '';
  audioTimelineData.forEach((item, index) => {
    const transposedChord = transposeForCapo(item.chord, currentCapo);
    
    const card = document.createElement('div');
    card.className = `chord-card ${index === activeChordIndex ? 'active' : ''}`;
    card.dataset.index = index;
    card.innerHTML = `
      <div class="root">${transposedChord}</div>
      <div class="timestamp">${formatTime(item.startTime)}</div>
    `;

    card.addEventListener('click', () => {
      audioPlayer.currentTime = item.startTime;
    });

    timelineContainer.appendChild(card);
  });
}

// 4. Real-Time Timeupdate Listener with Sync Logic
audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;

  const index = audioTimelineData.findIndex(
    (item) => currentTime >= item.startTime && currentTime < item.endTime
  );

  if (index !== -1 && index !== activeChordIndex) {
    activeChordIndex = index;
    highlightActiveChord();
  }
});

function highlightActiveChord() {
  const cards = timelineContainer.querySelectorAll('.chord-card');
  cards.forEach((card, idx) => {
    if (idx === activeChordIndex) {
      card.classList.add('active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      card.classList.remove('active');
    }
  });

  updateActiveDiagram();
}

function updateActiveDiagram() {
  if (activeChordIndex === -1 || !audioTimelineData[activeChordIndex]) return;
  const rawChord = audioTimelineData[activeChordIndex].chord;
  const transposedChord = transposeForCapo(rawChord, currentCapo);
  renderChordSVG(diagramContainer, transposedChord);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
