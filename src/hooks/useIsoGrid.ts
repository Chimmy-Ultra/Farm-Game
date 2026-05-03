/**
 * Isometric plot geometry for the reference farm background.
 *
 * The farm-reference.png contains a painted isometric garden plot.
 * We define the four corners of that plot as percentages of the image,
 * then use bilinear interpolation to place a GRID_COLS × GRID_ROWS
 * grid of interactive tiles within it.
 */
import { GRID_COLS, GRID_ROWS } from '../game/tile';

export interface PlotCorner {
  x: number;
  y: number;
}

export interface PlotQuad {
  tl: PlotCorner;
  tr: PlotCorner;
  br: PlotCorner;
  bl: PlotCorner;
}

export const PLOT: PlotQuad = {
  tl: { x: 47.25, y: 30.41 },
  tr: { x: 82.52, y: 22.27 },
  br: { x: 72.89, y: 68.55 },
  bl: { x: 38.04, y: 75.57 },
};

export function gridToPercent(col: number, row: number): PlotCorner {
  const u = (col + 0.5) / GRID_COLS;
  const v = (row + 0.5) / GRID_ROWS;
  const x =
    (1 - u) * (1 - v) * PLOT.tl.x +
    u * (1 - v) * PLOT.tr.x +
    u * v * PLOT.br.x +
    (1 - u) * v * PLOT.bl.x;
  const y =
    (1 - u) * (1 - v) * PLOT.tl.y +
    u * (1 - v) * PLOT.tr.y +
    u * v * PLOT.br.y +
    (1 - u) * v * PLOT.bl.y;
  return { x, y };
}

export interface TileFootprint {
  colVec: { x: number; y: number };
  rowVec: { x: number; y: number };
}

export function tileFootprint(): TileFootprint {
  return {
    colVec: {
      x: (PLOT.tr.x - PLOT.tl.x) / GRID_COLS,
      y: (PLOT.tr.y - PLOT.tl.y) / GRID_COLS,
    },
    rowVec: {
      x: (PLOT.bl.x - PLOT.tl.x) / GRID_ROWS,
      y: (PLOT.bl.y - PLOT.tl.y) / GRID_ROWS,
    },
  };
}
