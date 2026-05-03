// Detect connected dark regions in the mask, cluster them into 30 plot centers.
// Uses a simple grid-based approach: sweep dark pixels, find large clusters.
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

// Restrict search to plot area: x in [30%, 92%], y in [20%, 80%]
const xMin = Math.round(W * 0.30);
const xMax = Math.round(W * 0.92);
const yMin = Math.round(H * 0.20);
const yMax = Math.round(H * 0.80);

// Build local mask as 2D array (downsampled for speed)
const step = 4;
const cols = Math.floor((xMax - xMin) / step);
const rows = Math.floor((yMax - yMin) / step);
const m = Array.from({ length: rows }, () => new Uint8Array(cols));
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const px = xMin + x * step;
    const py = yMin + y * step;
    m[y][x] = isDark(px, py) ? 1 : 0;
  }
}

// Flood-fill connected components (BFS)
const comp = Array.from({ length: rows }, () => new Int32Array(cols));
let next = 1;
const centroids = [];
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    if (!m[y][x] || comp[y][x]) continue;
    const id = next++;
    comp[y][x] = id;
    const stack = [[x, y]];
    let sx = 0, sy = 0, n = 0;
    let minX = x, maxX = x, minY = y, maxY = y;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      sx += cx; sy += cy; n++;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
      const nbs = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
      for (const [nx, ny] of nbs) {
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && m[ny][nx] && !comp[ny][nx]) {
          comp[ny][nx] = id;
          stack.push([nx, ny]);
        }
      }
    }
    centroids.push({ id, cx: sx / n, cy: sy / n, n, bbox: [minX, minY, maxX, maxY] });
  }
}

// Filter to large components that are probably plots (not noise / fence)
const plotsPx = centroids
  .filter((c) => c.n > 200 && c.n < 8000)
  .map((c) => ({
    x: xMin + c.cx * step,
    y: yMin + c.cy * step,
    n: c.n,
    w: (c.bbox[2] - c.bbox[0]) * step,
    h: (c.bbox[3] - c.bbox[1]) * step,
  }));

console.log(`Found ${plotsPx.length} candidate plot regions.`);
plotsPx.sort((a, b) => a.y - b.y);
for (const p of plotsPx.slice(0, 40)) {
  console.log(`  px (${p.x.toFixed(0)}, ${p.y.toFixed(0)}) = % (${(p.x / W * 100).toFixed(2)}, ${(p.y / H * 100).toFixed(2)})  [n=${p.n}, w=${p.w} h=${p.h}]`);
}

// Annotate: draw centers on mask
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
for (const p of plotsPx) {
  svg += `<circle cx="${p.x}" cy="${p.y}" r="8" fill="yellow"/>`;
}
svg += '</svg>';

await sharp('reference/plot-mask.png')
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .toFile('reference/plot-mask-centers.png');

await sharp('reference/plot-mask-centers.png')
  .extract({
    left: Math.round(W * 0.30),
    top: Math.round(H * 0.15),
    width: Math.round(W * 0.62),
    height: Math.round(H * 0.75),
  })
  .resize({ width: 1800 })
  .toFile('reference/plot-mask-centers-zoom.png');
