// Large crop of the mask just showing the plot area for precise counting.
import sharp from 'sharp';

const meta = await sharp('public/farm-reference.png').metadata();
const W = meta.width, H = meta.height;

await sharp('reference/plot-mask.png')
  .extract({
    left: Math.round(W * 0.32),
    top: Math.round(H * 0.17),
    width: Math.round(W * 0.58),
    height: Math.round(H * 0.66),
  })
  .resize({ width: 2400 })
  .toFile('reference/plot-mask-big.png');

console.log('done');
