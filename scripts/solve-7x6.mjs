// Solve PLOT for 7x6 grid from 4 observed corner cell centers.
// Based on visual inspection of the live game screenshot with test crops planted.
const COLS = 7, ROWS = 6;

// Where the actual painted plots are, based on the screenshot.
// Estimated from the in-game screenshot where corner crops missed the plots.
// The actual plot centers should be at approximately:
const C = {
  c00: { x: 49.0, y: 33.6 },  // back-left corner plot center
  c60: { x: 79.2, y: 26.7 },  // back-right corner plot center
  c65: { x: 71.2, y: 65.2 },  // front-right corner plot center
  c05: { x: 41.3, y: 71.3 },  // front-left corner plot center
};

function weights(u, v) {
  return [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
}

const U_LO = 0.5 / COLS;
const U_HI = (COLS - 0.5) / COLS;
const V_LO = 0.5 / ROWS;
const V_HI = (ROWS - 0.5) / ROWS;

const A = [
  weights(U_LO, V_LO),
  weights(U_HI, V_LO),
  weights(U_HI, V_HI),
  weights(U_LO, V_HI),
];
const bX = [C.c00.x, C.c60.x, C.c65.x, C.c05.x];
const bY = [C.c00.y, C.c60.y, C.c65.y, C.c05.y];

function solve4(A, b) {
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

console.log('export const PLOT: PlotQuad = {');
console.log(`  tl: { x: ${tlX.toFixed(2)}, y: ${tlY.toFixed(2)} },`);
console.log(`  tr: { x: ${trX.toFixed(2)}, y: ${trY.toFixed(2)} },`);
console.log(`  br: { x: ${brX.toFixed(2)}, y: ${brY.toFixed(2)} },`);
console.log(`  bl: { x: ${blX.toFixed(2)}, y: ${blY.toFixed(2)} },`);
console.log('};');
