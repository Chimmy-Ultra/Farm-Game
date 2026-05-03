// Solve the bilinear system for PLOT corners given 4 observed cell-center positions.
// Uses the 4 corner cells (0,0), (5,0), (5,4), (0,4) at u,v = (0.0833, 0.1), (0.9167, 0.1), (0.9167, 0.9), (0.0833, 0.9)
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

// Tuned windows around each corner plot from the mask image
// Remember: mask zoom showed the grid clearly
const windows = {
  c00: [0.405, 0.245, 0.445, 0.285],
  c50: [0.775, 0.225, 0.825, 0.265],
  c04: [0.320, 0.700, 0.370, 0.755],
  c54: [0.820, 0.700, 0.875, 0.745],
};

const C = {};
for (const [k, w] of Object.entries(windows)) {
  const [x0, y0, x1, y1] = w;
  const r = centroidInRect(
    Math.round(x0 * W), Math.round(y0 * H),
    Math.round(x1 * W), Math.round(y1 * H)
  );
  const px = r.x / W * 100;
  const py = r.y / H * 100;
  C[k] = { x: px, y: py };
  console.log(`${k}: % (${px.toFixed(2)}, ${py.toFixed(2)}) [${r.count} px]`);
}

// Solve bilinear system for PLOT corners
// cell (c, r) center at u = (c+0.5)/COLS, v = (r+0.5)/ROWS
// For COLS=6, ROWS=5: u00 = 1/12, u50 = 11/12, v00 = 1/10, v04 = 9/10
// Weights for P(u,v) = (1-u)(1-v)*TL + u(1-v)*TR + uv*BR + (1-u)v*BL

function weights(u, v) {
  return [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
}

const U_LO = 1 / 12;
const U_HI = 11 / 12;
const V_LO = 1 / 10;
const V_HI = 9 / 10;

// Matrix A: rows are [C00, C50, C54, C04] — order matches unknowns [TL, TR, BR, BL]
const A = [
  weights(U_LO, V_LO),
  weights(U_HI, V_LO),
  weights(U_HI, V_HI),
  weights(U_LO, V_HI),
];
const bX = [C.c00.x, C.c50.x, C.c54.x, C.c04.x];
const bY = [C.c00.y, C.c50.y, C.c54.y, C.c04.y];

function solve4(A, b) {
  // Gaussian elimination for a 4x4 system
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < 4; i++) {
    let pivot = i;
    for (let j = i + 1; j < 4; j++) {
      if (Math.abs(M[j][i]) > Math.abs(M[pivot][i])) pivot = j;
    }
    [M[i], M[pivot]] = [M[pivot], M[i]];
    for (let j = i + 1; j < 4; j++) {
      const f = M[j][i] / M[i][i];
      for (let k = i; k <= 4; k++) M[j][k] -= f * M[i][k];
    }
  }
  const x = [0, 0, 0, 0];
  for (let i = 3; i >= 0; i--) {
    let sum = M[i][4];
    for (let j = i + 1; j < 4; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

const [tlX, trX, brX, blX] = solve4(A, bX);
const [tlY, trY, brY, blY] = solve4(A, bY);

console.log('\nComputed PLOT:');
console.log(`  tl: { x: ${tlX.toFixed(2)}, y: ${tlY.toFixed(2)} },`);
console.log(`  tr: { x: ${trX.toFixed(2)}, y: ${trY.toFixed(2)} },`);
console.log(`  br: { x: ${brX.toFixed(2)}, y: ${brY.toFixed(2)} },`);
console.log(`  bl: { x: ${blX.toFixed(2)}, y: ${blY.toFixed(2)} },`);
