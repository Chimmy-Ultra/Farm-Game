// Split the 3x3 crop sprite sheet into 9 individual PNGs, cropping each plant
// tightly to its bounding box of non-transparent pixels to avoid wasted space.
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const SRC = path.resolve('public/crops-sprite-sheet.png');
const OUT_DIR = path.resolve('public/crops');

const NAMES = [
  ['carrot', 'cabbage', 'spinach'],
  ['tomato', 'pepper', 'broccoli'],
  ['radish', 'kale', 'onion'],
];

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const meta = await sharp(SRC).metadata();
  const W = meta.width, H = meta.height;
  const cellW = Math.floor(W / 3);
  const cellH = Math.floor(H / 3);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const name = NAMES[row][col];
      const left = col * cellW;
      const top = row * cellH;

      // First extract the cell
      const cellBuf = await sharp(SRC)
        .extract({ left, top, width: cellW, height: cellH })
        .ensureAlpha()
        .png()
        .toBuffer();

      // Find tight bounding box of non-transparent pixels
      const { data, info } = await sharp(cellBuf)
        .raw()
        .toBuffer({ resolveWithObject: true });

      let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const a = data[(y * info.width + x) * 4 + 3];
          if (a > 20) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        console.warn(`[${name}] no non-transparent pixels — saving as-is`);
        await sharp(cellBuf).png().toFile(path.join(OUT_DIR, `${name}.png`));
        continue;
      }

      // Add a small padding around the plant
      const pad = 10;
      const bx = Math.max(0, minX - pad);
      const by = Math.max(0, minY - pad);
      const bw = Math.min(info.width - bx, maxX - bx + 1 + pad);
      const bh = Math.min(info.height - by, maxY - by + 1 + pad);

      await sharp(cellBuf)
        .extract({ left: bx, top: by, width: bw, height: bh })
        .png({ compressionLevel: 9 })
        .toFile(path.join(OUT_DIR, `${name}.png`));

      console.log(`${name}.png: ${bw}x${bh}`);
    }
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
