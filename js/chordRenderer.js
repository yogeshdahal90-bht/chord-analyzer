// SVG Guitar Chord Diagram Generator
const CHORD_SHAPES = {
  "C":  { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
  "G":  { frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  "D":  { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 },
  "A":  { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 },
  "E":  { frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  "Em": { frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  "Am": { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1 },
  "Dm": { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1 }
};

export function renderChordSVG(container, chordName) {
  container.innerHTML = "";
  const shape = CHORD_SHAPES[chordName];

  if (!shape) {
    container.innerHTML = `<p>No diagram available for ${chordName}</p>`;
    return;
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "160");
  svg.setAttribute("height", "200");
  svg.setAttribute("viewBox", "0 0 160 200");

  // Draw Nut/Frets
  for (let i = 0; i <= 4; i++) {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "30");
    line.setAttribute("y1", 40 + i * 30);
    line.setAttribute("x2", "130");
    line.setAttribute("y2", 40 + i * 30);
    line.setAttribute("stroke", i === 0 ? "#000" : "#888");
    line.setAttribute("stroke-width", i === 0 ? "4" : "1");
    svg.appendChild(line);
  }

  // Draw Strings
  for (let i = 0; i < 6; i++) {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 30 + i * 20);
    line.setAttribute("y1", "40");
    line.setAttribute("x2", 30 + i * 20);
    line.setAttribute("y2", "160");
    line.setAttribute("stroke", "#444");
    line.setAttribute("stroke-width", "1.5");
    svg.appendChild(line);
  }

  // Draw Finger Points / Mutes
  shape.frets.forEach((fret, stringIdx) => {
    const x = 30 + stringIdx * 20;
    if (fret === 0) {
      const openCircle = document.createElementNS(svgNS, "circle");
      openCircle.setAttribute("cx", x);
      openCircle.setAttribute("cy", "25");
      openCircle.setAttribute("r", "5");
      openCircle.setAttribute("fill", "none");
      openCircle.setAttribute("stroke", "#000");
      openCircle.setAttribute("stroke-width", "1.5");
      svg.appendChild(openCircle);
    } else if (fret > 0) {
      const y = 40 + (fret - 0.5) * 30;
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", "8");
      dot.setAttribute("fill", "#00e676");
      svg.appendChild(dot);
    } else if (fret === -1) {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x - 4);
      text.setAttribute("y", "28");
      text.setAttribute("font-size", "14");
      text.textContent = "X";
      svg.appendChild(text);
    }
  });

  container.appendChild(svg);
}
