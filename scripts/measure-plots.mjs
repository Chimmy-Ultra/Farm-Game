// Detect dark plot pixels in farm-reference.png to estimate plot center positions.
// Outputs a debug visualization where detected dark regions are highlighted.
import sharp from 'sharp';

const src = 'public/farm-reference.png';
const meta = await sharp(src).metadata();
const W = meta.width;
const H = meta.height;

// Read raw pixel data
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

// Build a binary mask: dark brown soil pixels
// Target color: low brightness, reddish-brown hue
// Only look within plot bounding area: x in [30%, 92%], y in [20%, 82%]
const xMin = Math.round(W * 0.30);
const xMax = Math.round(W * 0.92);
const yMin = Math.round(H * 0.20);
const yMax = Math.round(H * 0.82);

// Mask image (same size)
const mask = Buffer.alloc(W * H * 3, 0);

let dark = 0;
for (let y = yMin; y < yMax; y++) {
  for (let x = xMin; x < xMax; x++) {
    const idx = (y * W + x) * ch;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Dark soil: r in 50-90, g in 30-60, b in 15-40
    const isDark = r > 40 && r < 105 && g > 20 && g < 70 && b > 10 && b < 50 && r > g && g > b;
    if (isDark) {
      const mi = (y * W + x) * 3;
      mask[mi] = 255;
      mask[mi + 1] = 0;
      mask[mi + 2] = 0;
      dark++;
    }
  }
}

console.log(`Dark pixels in bounds: ${dark}`);

// Composite mask (red) over original at 60% opacity
const maskPng = await sharp(mask, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
await sharp(src)
  .composite([{ input: maskPng, blend: 'over', opacity: 0.55 }])
  .toFile('reference/plot-mask.png');

await sharp('reference/plot-mask.png')
  .extract({
    left: Math.round(W * 0.30),
    top: Math.round(H * 0.15),
    width: Math.round(W * 0.62),
    height: Math.round(H * 0.75),
  })
  .resize({ width: 1600 })
  .toFile('reference/plot-mask-zoom.png');

console.log('Wrote mask and zoom.');
