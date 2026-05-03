// Crop the plot area without any overlays, to count painted plots accurately.
import sharp from 'sharp';

const src = 'public/farm-reference.png';
const meta = await sharp(src).metadata();

const left = Math.round(meta.width * 0.30);
const top = Math.round(meta.height * 0.15);
const width = Math.round(meta.width * 0.62);
const height = Math.round(meta.height * 0.75);

await sharp(src)
  .extract({ left, top, width, height })
  .resize({ width: 1800 })
  .toFile('reference/plot-clean-zoom.png');

console.log(`Clean zoom: ${width}x${height}`);
