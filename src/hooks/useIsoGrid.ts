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
  tl: { x: 42.5, y: 28.5 },
  tr: { x: 79.5, y: 18.5 },
  br: { x: 71.5, y: 63.5 },
  bl: { x: 35.5, y: 71.0 },
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

/**
 * Returns a CSS clip-path polygon that matches the isometric parallelogram
 * shape of each tile, so hit areas and visual overlays align with the 2.5D art.
 *
 * The four vertices (clockwise from top-right peak):
 *   top-right → right → bottom-left → left
 */
export function isoTileClipPath(): string {
  const { colVec, rowVec } = tileFootprint();
  const tileW = Math.abs(colVec.x) + Math.abs(rowVec.x);
  const tileH = Math.abs(colVec.y) + Math.abs(rowVec.y);
  // a = how far right the column vector pushes (as % of tile width)
  // b = how far up the column vector pushes (as % of tile height)
  const a = Math.round(Math.abs(colVec.x) / tileW * 100);
  const b = Math.round(Math.abs(colVec.y) / tileH * 100);
  return `polygon(100% 0%, ${a}% ${100 - b}%, 0% 100%, ${100 - a}% ${b}%)`;
}
