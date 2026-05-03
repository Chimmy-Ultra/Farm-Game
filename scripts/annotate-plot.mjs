// Annotate farm-reference.png with the current PLOT quad and grid cell centers.
// Outputs reference/plot-annotated.png for visual verification.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const GRID_COLS = 7;
const GRID_ROWS = 6;

const PLOT = {
  tl: { x: 43.30, y: 21.93 },
  tr: { x: 82.45, y: 18.26 },
  br: { x: 92.45, y: 77.69 },
  bl: { x: 30.80, y: 80.62 },
};

function gridToPercent(col, row) {
  const u = (col + 0.5) / GRID_COLS;
  const v = (row + 0.5) / GRID_ROWS;
  const x =
    (1 - u) * (1 - v) * PLOT.tl.x +
    u * (1 - v) * PLOT.tr.x +
    u * v * PLOT.br.x +
    (1 - u) * v * PLOT.bl.x;
  const y =
    (1 - u) * (1 - v) * PLOT.tl.y +
    u * (1 - v) * PLOT.tr.y +
    u * v * PLOT.br.y +
    (1 - u) * v * PLOT.bl.y;
  return { x, y };
}

const src = 'public/farm-reference.png';
const meta = await sharp(src).metadata();
const W = meta.width;
const H = meta.height;

const pxX = (p) => (p / 100) * W;
const pxY = (p) => (p / 100) * H;

// Build SVG overlay
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;

// PLOT quad outline (cyan)
const corners = [PLOT.tl, PLOT.tr, PLOT.br, PLOT.bl];
const poly = corners.map((c) => `${pxX(c.x).toFixed(1)},${pxY(c.y).toFixed(1)}`).join(' ');
svg += `<polygon points="${poly}" fill="none" stroke="cyan" stroke-width="6"/>`;

// Grid cells (thin yellow lines)
for (let c = 0; c <= GRID_COLS; c++) {
  // vertical lines = interpolate between top edge and bottom edge
  const u = c / GRID_COLS;
  const topX = (1 - u) * PLOT.tl.x + u * PLOT.tr.x;
  const topY = (1 - u) * PLOT.tl.y + u * PLOT.tr.y;
  const botX = (1 - u) * PLOT.bl.x + u * PLOT.br.x;
  const botY = (1 - u) * PLOT.bl.y + u * PLOT.br.y;
  svg += `<line x1="${pxX(topX).toFixed(1)}" y1="${pxY(topY).toFixed(1)}" x2="${pxX(botX).toFixed(1)}" y2="${pxY(botY).toFixed(1)}" stroke="yellow" stroke-width="2" opacity="0.7"/>`;
}
for (let r = 0; r <= GRID_ROWS; r++) {
  const v = r / GRID_ROWS;
  const lX = (1 - v) * PLOT.tl.x + v * PLOT.bl.x;
  const lY = (1 - v) * PLOT.tl.y + v * PLOT.bl.y;
  const rX = (1 - v) * PLOT.tr.x + v * PLOT.br.x;
  const rY = (1 - v) * PLOT.tr.y + v * PLOT.br.y;
  svg += `<line x1="${pxX(lX).toFixed(1)}" y1="${pxY(lY).toFixed(1)}" x2="${pxX(rX).toFixed(1)}" y2="${pxY(rY).toFixed(1)}" stroke="yellow" stroke-width="2" opacity="0.7"/>`;
}

// Cell centers (red dots + labels)
for (let c = 0; c < GRID_COLS; c++) {
  for (let r = 0; r < GRID_ROWS; r++) {
    const { x, y } = gridToPercent(c, r);
    const cx = pxX(x);
    const cy = pxY(y);
    svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="red"/>`;
    svg += `<text x="${(cx + 14).toFixed(1)}" y="${(cy + 6).toFixed(1)}" fill="white" stroke="black" stroke-width="3" paint-order="stroke" font-size="20" font-family="monospace" font-weight="bold">${c},${r}</text>`;
  }
}

svg += `</svg>`;

fs.mkdirSync('reference', { recursive: true });
const outFull = 'reference/plot-annotated.png';
await sharp(src)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile(outFull);

// Also produce a small thumbnail for quick inspection
await sharp(outFull).resize({ width: 1200 }).toFile('reference/plot-annotated-thumb.png');

console.log(`Wrote ${outFull} (${W}x${H}) and thumbnail.`);
console.log('PLOT:', PLOT);
