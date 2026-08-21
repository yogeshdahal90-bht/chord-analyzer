const CHORD_SHAPES = {
  "C":   { frets: [-1, 3, 2, 0, 1, 0] },
  "C#":  { frets: [-1, 4, 3, 1, 2, 1] },
  "D":   { frets: [-1, -1, 0, 2, 3, 2] },
  "D#":  { frets: [-1, -1, 1, 3, 4, 3] },
  "E":   { frets: [0, 2, 2, 1, 0, 0] },
  "F":   { frets: [1, 3, 3, 2, 1, 1] },
  "F#":  { frets: [2, 4, 4, 3, 2, 2] },
  "G":   { frets: [3, 2, 0, 0, 0, 3] },
  "G#":  { frets: [4, 6, 6, 5, 4, 4] },
  "A":   { frets: [-1, 0, 2, 2, 2, 0] },
  "A#":  { frets: [-1, 1, 3, 3, 3, 1] },
  "B":   { frets: [-1, 2, 4, 4, 4, 2] },
  "Cm":  { frets: [-1, 3, 5, 5, 4, 3] },
  "C#m": { frets: [-1, 4, 6, 6, 5, 4] },
  "Dm":  { frets: [-1, -1, 0, 2, 3, 1] },
  "D#m": { frets: [-1, -1, 1, 3, 4, 2] },
  "Em":  { frets: [0, 2, 2, 0, 0, 0] },
  "Fm":  { frets: [1, 3, 3, 1, 1, 1] },
  "F#m": { frets: [2, 4, 4, 2, 2, 2] },
  "Gm":  { frets: [3, 5, 5, 3, 3, 3] },
  "G#m": { frets: [4, 6, 6, 4, 4, 4] },
  "Am":  { frets: [-1, 0, 2, 2, 1, 0] },
  "A#m": { frets: [-1, 1, 3, 3, 2, 1] },
  "Bm":  { frets: [-1, 2, 4, 4, 3, 2] }
};

export function renderChordSVG(container, chordName) {
  container.innerHTML = "";
  const shape = CHORD_SHAPES[chordName];

  if (!shape) {
    container.innerHTML = `<p style="color:var(--text-dim)">Shape diagram pending for ${chordName}</p>`;
    return;
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "160");
  svg.setAttribute("height", "190");
  svg.setAttribute("viewBox", "0 0 160 190");

  for (let i = 0; i <= 4; i++) {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "30");
    line.setAttribute("y1", 35 + i * 30);
    line.setAttribute("x2", "130");
    line.setAttribute("y2", 35 + i * 30);
    line.setAttribute("stroke", i === 0 ? "#000" : "#888");
    line.setAttribute("stroke-width", i === 0 ? "4" : "1");
    svg.appendChild(line);
  }

  for (let i = 0; i < 6; i++) {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 30 + i * 20);
    line.setAttribute("y1", "35");
    line.setAttribute("x2", 30 + i * 20);
    line.setAttribute("y2", "155");
    line.setAttribute("stroke", "#444");
    line.setAttribute("stroke-width", "1.5");
    svg.appendChild(line);
  }

  shape.frets.forEach((fret, stringIdx) => {
    const x = 30 + stringIdx * 20;
    if (fret === 0) {
      const openCircle = document.createElementNS(svgNS, "circle");
      openCircle.setAttribute("cx", x);
      openCircle.setAttribute("cy", "20");
      openCircle.setAttribute("r", "5");
      openCircle.setAttribute("fill", "none");
      openCircle.setAttribute("stroke", "#000");
      openCircle.setAttribute("stroke-width", "1.5");
      svg.appendChild(openCircle);
    } else if (fret > 0) {
      const y = 35 + (fret - 0.5) * 30;
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", "8");
      dot.setAttribute("fill", "#00e676");
      svg.appendChild(dot);
    } else if (fret === -1) {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x - 4);
      text.setAttribute("y", "24");
      text.setAttribute("font-size", "14");
      text.textContent = "X";
      svg.appendChild(text);
    }
  });

  container.appendChild(svg);
}
