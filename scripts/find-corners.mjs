// Find the 4 corner plot centers by looking in small windows of the mask.
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

// Compute centroid of dark pixels in a rectangular window.
function centroidInRect(x0, y0, x1, y1) {
  let sx = 0, sy = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (isDark(x, y)) { sx += x; sy += y; n++; }
    }
  }
  if (!n) return null;
  return { x: sx / n, y: sy / n, count: n };
}

// Windows covering each corner plot (tuned from visual inspection)
// Back-left (0,0): approximately x=41-48%, y=23-30%
// Back-right (5,0): approximately x=78-85%, y=23-30%
// Front-left (0,4): approximately x=34-41%, y=73-80%
// Front-right (5,4): approximately x=87-94%, y=73-80%
const windows = {
  c00: [0.41, 0.23, 0.49, 0.31],
  c50: [0.76, 0.23, 0.84, 0.31],
  c04: [0.32, 0.72, 0.40, 0.82],
  c54: [0.85, 0.72, 0.93, 0.82],
};

for (const [k, w] of Object.entries(windows)) {
  const [x0, y0, x1, y1] = w;
  const r = centroidInRect(
    Math.round(x0 * W), Math.round(y0 * H),
    Math.round(x1 * W), Math.round(y1 * H)
  );
  if (r) {
    console.log(`${k}: pixel (${r.x.toFixed(0)}, ${r.y.toFixed(0)}) -> percent (${(r.x / W * 100).toFixed(2)}%, ${(r.y / H * 100).toFixed(2)}%)  [${r.count} px]`);
  } else {
    console.log(`${k}: no dark pixels found`);
  }
}
