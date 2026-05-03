import { useState, useMemo, useCallback } from 'react';
import { tileKey, GRID_COLS, GRID_ROWS, type TileState } from '../game/tile';
import { useTileStore } from '../store/tileStore';
import { useToolStore } from '../store/toolStore';
import { useGameStore } from '../store/gameStore';
import { gridToPercent, tileFootprint } from '../hooks/useIsoGrid';
import { CROPS } from '../game/crops';
import { COMMODITIES } from '../data/commodities';
import { spriteUrlForCrop } from '../assets/cropSprites';
import type { CommodityId } from '../data/commodities';
import { TimeOverlay } from './TimeOverlay';

const STAGE_FILL: Record<TileState['stage'], string> = {
  untouched: 'transparent',
  tilled: 'rgba(70, 42, 20, 0.55)',
  seeded: 'rgba(70, 42, 20, 0.50)',
  growing: 'rgba(70, 42, 20, 0.35)',
  mature: 'rgba(70, 42, 20, 0.20)',
};

interface TileCellProps {
  col: number;
  row: number;
  tile: TileState;
  hovered: boolean;
  tileW: number;
  tileH: number;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function TileCell({ col, row, tile, hovered, tileW, tileH, onEnter, onLeave, onClick }: TileCellProps) {
  const { x, y } = gridToPercent(col, row);
  const fill = STAGE_FILL[tile.stage];
  const watered = tile.watered && tile.stage !== 'untouched';

  return (
    <div
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${tileW}%`,
        height: `${tileH}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      {/* Tile fill (diamond-ish rounded rect) */}
      {tile.stage !== 'untouched' && (
        <div
          style={{
            position: 'absolute',
            inset: '12%',
            background: fill,
            borderRadius: '18%',
            boxShadow: watered
              ? 'inset 0 0 18px rgba(80,150,240,0.35)'
              : 'inset 0 0 10px rgba(0,0,0,0.25)',
            transition: 'background 200ms',
          }}
        />
      )}

      {/* Hover ring */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            inset: '8%',
            border: '1.5px solid rgba(255,235,140,0.85)',
            borderRadius: '20%',
            boxShadow: '0 0 14px rgba(255,230,130,0.45), inset 0 0 20px rgba(255,240,170,0.25)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Crop indicator */}
      {(tile.stage === 'growing' || tile.stage === 'mature' || tile.stage === 'seeded') && tile.cropId && (
        <CropSprite stage={tile.stage} progress={tile.growthProgress} cropId={tile.cropId} />
      )}
    </div>
  );
}

function CropSprite({
  stage,
  progress,
  cropId,
}: {
  stage: TileState['stage'];
  progress: number;
  cropId: CommodityId;
}) {
  if (stage === 'seeded') {
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '55%',
          width: 8,
          height: 8,
          background: '#6b4a22',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}
      />
    );
  }

  const url = spriteUrlForCrop(cropId);
  if (!url) {
    // Fallback: simple colored dot if no sprite mapped
    const size = stage === 'mature' ? 22 : Math.min(8 + progress * 2, 18);
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size,
          height: size,
          background: stage === 'mature' ? '#f5b100' : '#5ab54a',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }

  // Scale: seedling ~30% → growing 45-65% → mature 75%
  const scale = stage === 'mature' ? 0.75 : Math.min(0.30 + progress * 0.022, 0.65);
  const bounce = stage === 'mature' ? 'cropPulse 2.6s ease-in-out infinite' : undefined;

  return (
    <img
      src={url}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '100%',
        height: 'auto',
        transform: `translate(-50%, -85%) scale(${scale})`,
        transformOrigin: '50% 100%',
        filter: stage === 'growing'
          ? `saturate(${0.85 + progress * 0.005}) drop-shadow(0 2px 3px rgba(0,0,0,0.35))`
          : 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))',
        pointerEvents: 'none',
        userSelect: 'none',
        animation: bounce,
      }}
    />
  );
}

export function FarmScene2D() {
  const tiles = useTileStore((s) => s.tiles);
  const till = useTileStore((s) => s.till);
  const seed = useTileStore((s) => s.seed);
  const water = useTileStore((s) => s.water);
  const harvest = useTileStore((s) => s.harvest);

  const selectedTool = useToolStore((s) => s.selectedTool);
  const selectedSeed = useToolStore((s) => s.selectedSeed);

  const day = useGameStore((s) => s.day);
  const addMoney = useGameStore((s) => s.addMoney);
  const spendMoney = useGameStore((s) => s.spendMoney);

  const [hovered, setHovered] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { tileW, tileH } = useMemo(() => {
    const { colVec, rowVec } = tileFootprint();
    return {
      tileW: Math.abs(colVec.x) + Math.abs(rowVec.x),
      tileH: Math.abs(colVec.y) + Math.abs(rowVec.y),
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600);
  }, []);

  const handleTileClick = useCallback(
    (col: number, row: number) => {
      const key = tileKey(col, row);
      const tile = tiles[key];
      if (!tile) return;

      switch (selectedTool) {
        case 'till': {
          if (till(col, row)) showToast('已耕地');
          else showToast('這裡不能耕地');
          break;
        }
        case 'seed': {
          const crop = CROPS[selectedSeed];
          if (!crop) {
            showToast('未選擇種子');
            break;
          }
          if (tile.stage !== 'tilled') {
            showToast('先耕地再播種');
            break;
          }
          if (!spendMoney(crop.seedCost)) {
            showToast('金錢不足');
            break;
          }
          if (seed(col, row, selectedSeed, day)) {
            showToast(`已播種 ${COMMODITIES[selectedSeed].nameZh}`);
          }
          break;
        }
        case 'water': {
          if (water(col, row)) showToast('已澆水');
          else showToast('無法澆水');
          break;
        }
        case 'harvest': {
          const result = harvest(col, row);
          if (!result) {
            showToast('尚未成熟');
            break;
          }
          const crop = CROPS[result.cropId];
          const commodity = COMMODITIES[result.cropId];
          const value = crop
            ? Math.round(crop.yieldUnits * commodity.basePrice * 10)
            : 10;
          addMoney(value);
          showToast(`收成 ${commodity.nameZh} +$${value}`);
          break;
        }
      }
    },
    [selectedTool, selectedSeed, day, tiles, till, seed, water, harvest, addMoney, spendMoney, showToast],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#0c0a08',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes cropPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>

      {/* Aspect-locked stage: image + tiles share one coordinate space */}
      <div
        style={{
          position: 'relative',
          width: 'min(100vw, calc(100vh * 2752 / 1536))',
          aspectRatio: '2752 / 1536',
          maxHeight: '100vh',
          maxWidth: '100vw',
        }}
      >
        {/* Base image (non-interactive) */}
        <img
          src="./farm-reference.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />

        {/* Day/night overlays (between image and tiles) */}
        <TimeOverlay />

        {/* Interactive tile layer */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, idx) => {
            const col = idx % GRID_COLS;
            const row = Math.floor(idx / GRID_COLS);
            const key = tileKey(col, row);
            const tile = tiles[key];
            if (!tile) return null;
            return (
              <TileCell
                key={key}
                col={col}
                row={row}
                tile={tile}
                hovered={hovered === key}
                tileW={tileW}
                tileH={tileH}
                onEnter={() => setHovered(key)}
                onLeave={() => setHovered((h) => (h === key ? null : h))}
                onClick={() => handleTileClick(col, row)}
              />
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '14%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,24,20,0.82)',
            color: '#f5efd5',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 14,
            letterSpacing: 0.5,
            border: '1px solid rgba(255,220,140,0.25)',
            pointerEvents: 'none',
            zIndex: 30,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
