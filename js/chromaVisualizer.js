const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

let canvas = null;
let ctx = null;

export function initVisualizer(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  drawEmptyState();
}

function drawEmptyState() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawLabels();
}

function drawLabels() {
  ctx.fillStyle = '#b0b0b0';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  const step = canvas.width / 12;
  for (let i = 0; i < 12; i++) {
    const x = i * step + step / 2;
    ctx.fillText(NOTES[i], x, canvas.height - 8);
  }
}

export function renderLiveChroma(chromaData) {
  if (!ctx || !chromaData || chromaData.length !== 12) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear frame
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const step = width / 12;
  const barWidth = step * 0.7;
  const gap = step * 0.15;
  const maxBarHeight = height - 30;

  for (let i = 0; i < 12; i++) {
    const energy = Math.min(1.0, chromaData[i] || 0);
    const barHeight = Math.max(3, energy * maxBarHeight);

    const x = i * step + gap;
    const y = maxBarHeight - barHeight + 10;

    // Green dynamic gradient
    ctx.fillStyle = energy > 0.6 ? '#00e676' : '#00a352';
    ctx.fillRect(x, y, barWidth, barHeight);
  }

  drawLabels();
}
