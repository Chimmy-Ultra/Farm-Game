// Remove near-white background from the crop sprite sheet,
// producing a transparent version suitable for overlay rendering.
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const SRC = path.resolve('public/crops-sprite-sheet.png');
const OUT = path.resolve('public/crops-sprite-sheet.png');
const THRESHOLD = 235; // pixels with R,G,B all >= THRESHOLD become transparent

async function run() {
  const img = sharp(SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`expected 4 channels, got ${channels}`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
      data[i + 3] = 0;
    } else {
      // Soft feather: near-white edges become translucent to smooth anti-aliasing
      const minCh = Math.min(r, g, b);
      if (minCh >= THRESHOLD - 30) {
        const t = (minCh - (THRESHOLD - 30)) / 30;
        data[i + 3] = Math.round((1 - t) * data[i + 3]);
      }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  const stat = await fs.stat(OUT);
  console.log(`Wrote ${OUT} (${(stat.size / 1024).toFixed(0)} KB)`);
}

run().catch((e) => { console.error(e); process.exit(1); });
