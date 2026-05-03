// Larger zoomed view of the annotated plot for better visibility.
import sharp from 'sharp';

const src = 'reference/plot-annotated.png';
const meta = await sharp(src).metadata();

// Crop to just the plot area (roughly 30% to 92% horizontally, 15% to 90% vertically)
const left = Math.round(meta.width * 0.30);
const top = Math.round(meta.height * 0.15);
const width = Math.round(meta.width * 0.62);
const height = Math.round(meta.height * 0.75);

await sharp(src)
  .extract({ left, top, width, height })
  .resize({ width: 1600 })
  .toFile('reference/plot-annotated-zoom.png');

console.log(`Zoomed crop: ${width}x${height} -> reference/plot-annotated-zoom.png`);
