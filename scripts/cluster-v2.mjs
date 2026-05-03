// Improved plot detection: extend search region, dilate the mask to merge
// intra-plot components, then find 30 clusters.
import sharp from 'sharp';

const src = 'public/farm-reference.png';
const meta = await sharp(src).metadata();
const W = meta.width;
const H = meta.height;

const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

function isDark(x, y) {
  const idx = (y * W + x) * ch;
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  return r > 40 && r < 105 && g > 20 && g < 70 && b > 10 && b < 50 && r > g && g > b;
}

const xMin = Math.round(W * 0.28);
const xMax = Math.round(W * 0.94);
const yMin = Math.round(H * 0.18);
const yMax = Math.round(H * 0.92);

const step = 4;
const cols = Math.floor((xMax - xMin) / step);
const rows = Math.floor((yMax - yMin) / step);
const m0 = Array.from({ length: rows }, () => new Uint8Array(cols));
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const px = xMin + x * step;
    const py = yMin + y * step;
    m0[y][x] = isDark(px, py) ? 1 : 0;
  }
}

// Dilate by 5 cells in each direction (≈20 pixels) to merge plot internals
function dilate(m, radius) {
  const rows = m.length, cols = m[0].length;
  const out = Array.from({ length: rows }, () => new Uint8Array(cols));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!m[y][x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) out[ny][nx] = 1;
        }
      }
    }
  }
  return out;
}

function erode(m, radius) {
  const rows = m.length, cols = m[0].length;
  const out = Array.from({ length: rows }, () => new Uint8Array(cols));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let all = 1;
      for (let dy = -radius; dy <= radius && all; dy++) {
        for (let dx = -radius; dx <= radius && all; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny < 0 || ny >= rows || nx < 0 || nx >= cols || !m[ny][nx]) all = 0;
        }
      }
      out[y][x] = all;
    }
  }
  return out;
}

// Close: dilate then erode
const m1 = erode(dilate(m0, 4), 2);

// Flood-fill
const comp = Array.from({ length: rows }, () => new Int32Array(cols));
const plotsPx = [];
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    if (!m1[y][x] || comp[y][x]) continue;
    const stack = [[x, y]];
    let sx = 0, sy = 0, n = 0;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= cols || cy < 0 || cy >= rows || !m1[cy][cx] || comp[cy][cx]) continue;
      comp[cy][cx] = 1;
      sx += cx; sy += cy; n++;
      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }
    if (n > 80) {
      plotsPx.push({ x: xMin + (sx / n) * step, y: yMin + (sy / n) * step, n });
    }
  }
}

console.log(`Found ${plotsPx.length} plot clusters.`);
plotsPx.sort((a, b) => a.y - b.y);

// Group into rows: any clusters with similar y (within a threshold) are in same row
const rowGroups = [];
const rowThresh = H * 0.06;
for (const p of plotsPx) {
  let placed = false;
  for (const g of rowGroups) {
    if (Math.abs(g[0].y - p.y) < rowThresh) { g.push(p); placed = true; break; }
  }
  if (!placed) rowGroups.push([p]);
}
for (const g of rowGroups) g.sort((a, b) => a.x - b.x);
console.log(`Row groups: ${rowGroups.length}`);
rowGroups.forEach((g, i) => {
  console.log(`Row ${i}: ${g.length} plots  y=${(g[0].y / H * 100).toFixed(1)}%`);
  g.forEach((p, j) => console.log(`  [${j}] % (${(p.x/W*100).toFixed(2)}, ${(p.y/H*100).toFixed(2)})`));
});

// Annotate
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
rowGroups.forEach((g, ri) => {
  g.forEach((p, ci) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="14" fill="lime" stroke="black" stroke-width="3"/>`;
    svg += `<text x="${p.x+18}" y="${p.y+8}" fill="white" stroke="black" stroke-width="2" paint-order="stroke" font-size="22" font-family="monospace">${ci},${ri}</text>`;
  });
});
svg += '</svg>';

await sharp(src)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .toFile('reference/plots-detected.png');

await sharp('reference/plots-detected.png')
  .extract({
    left: Math.round(W * 0.25),
    top: Math.round(H * 0.12),
    width: Math.round(W * 0.70),
    height: Math.round(H * 0.82),
  })
  .resize({ width: 1800 })
  .toFile('reference/plots-detected-zoom.png');
