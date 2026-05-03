// Solve PLOT corners from hand-picked cell centers.
// After examining the mask image, estimate where corner cells are.

const COLS = 6;
const ROWS = 5;

// Hand-picked cell centers in image % from examining the mask image.
// These are the 4 corner cells: (0,0), (5,0), (5,4), (0,4)
const C = {
  c00: { x: 45.5, y: 27.5 },
  c50: { x: 80.0, y: 24.5 },
  c54: { x: 86.5, y: 72.0 },
  c04: { x: 37.0, y: 74.5 },
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
const bX = [C.c00.x, C.c50.x, C.c54.x, C.c04.x];
const bY = [C.c00.y, C.c50.y, C.c54.y, C.c04.y];

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
