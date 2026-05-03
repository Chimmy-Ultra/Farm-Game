import { useEffect } from 'react';
import { useToolStore, type Tool } from '../store/toolStore';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { STARTER_CROP_IDS, CROPS } from '../game/crops';
import { COMMODITIES } from '../data/commodities';
import { useTileStore } from '../store/tileStore';

interface ToolButton {
  tool: Tool;
  label: string;
  icon: string;
  shortcut: string;
}

const TOOL_BUTTONS: ToolButton[] = [
  { tool: 'till', label: '鋤地', icon: '⛏️', shortcut: '1' },
  { tool: 'seed', label: '播種', icon: '🌱', shortcut: '2' },
  { tool: 'water', label: '澆水', icon: '💧', shortcut: '3' },
  { tool: 'harvest', label: '收成', icon: '🌾', shortcut: '4' },
];

export function Toolbar() {
  const selectedTool = useToolStore((s) => s.selectedTool);
  const selectedSeed = useToolStore((s) => s.selectedSeed);
  const setTool = useToolStore((s) => s.setTool);
  const setSeed = useToolStore((s) => s.setSeed);
  const advanceDay = useGameStore((s) => s.advanceDay);
  const tileAdvance = useTileStore((s) => s.advanceDay);
  const day = useGameStore((s) => s.day);
  const openPanel = useUIStore((s) => s.openPanel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === '1') setTool('till');
      else if (k === '2') setTool('seed');
      else if (k === '3') setTool('water');
      else if (k === '4') setTool('harvest');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setTool]);

  const handleSleep = () => {
    tileAdvance(day);
    advanceDay();
  };

  return (
    <>
      {/* Seed selector (above toolbar, only when seed tool active) */}
      {selectedTool === 'seed' && (
        <div
          style={{
            position: 'fixed',
            bottom: 110,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            background: 'rgba(18,22,18,0.85)',
            backdropFilter: 'blur(8px)',
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid rgba(255,220,140,0.15)',
            zIndex: 40,
          }}
        >
          {STARTER_CROP_IDS.map((id) => {
            const spec = CROPS[id];
            const commodity = COMMODITIES[id];
            if (!spec) return null;
            const active = selectedSeed === id;
            return (
              <button
                key={id}
                onClick={() => setSeed(id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '6px 12px',
                  minWidth: 70,
                  borderRadius: 8,
                  border: active
                    ? '1.5px solid rgba(255,220,140,0.95)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: active
                    ? 'rgba(255,220,140,0.18)'
                    : 'rgba(40,46,40,0.6)',
                  color: '#f5efd5',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {commodity.nameZh}
                </div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>
                  ${spec.seedCost} · {spec.growthDays}天
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main toolbar */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          background: 'rgba(15,18,15,0.85)',
          backdropFilter: 'blur(8px)',
          padding: '8px',
          borderRadius: 14,
          border: '1px solid rgba(255,220,140,0.2)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      >
        {TOOL_BUTTONS.map((btn) => {
          const active = selectedTool === btn.tool;
          return (
            <button
              key={btn.tool}
              onClick={() => setTool(btn.tool)}
              title={`${btn.label} (${btn.shortcut})`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 10,
                border: active
                  ? '1.5px solid rgba(255,220,140,0.9)'
                  : '1px solid rgba(255,255,255,0.08)',
                background: active
                  ? 'linear-gradient(180deg, rgba(255,220,140,0.22), rgba(180,140,60,0.18))'
                  : 'rgba(40,46,40,0.6)',
                color: '#f5efd5',
                cursor: 'pointer',
                transition: 'all 150ms',
                fontSize: 24,
              }}
            >
              <span>{btn.icon}</span>
              <span style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                {btn.label}
              </span>
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 6,
                  fontSize: 9,
                  opacity: 0.55,
                  fontFamily: 'monospace',
                }}
              >
                {btn.shortcut}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <div
          style={{
            width: 1,
            margin: '4px 4px',
            background: 'rgba(255,255,255,0.1)',
          }}
        />

        {/* Sleep / next day */}
        <button
          onClick={handleSleep}
          title="睡覺（下一日）"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 10,
            border: '1px solid rgba(140,180,255,0.25)',
            background:
              'linear-gradient(180deg, rgba(60,90,160,0.35), rgba(30,50,110,0.35))',
            color: '#f5efd5',
            cursor: 'pointer',
            fontSize: 24,
          }}
        >
          <span>🌙</span>
          <span style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>
            睡覺
          </span>
        </button>

        {/* Futures terminal */}
        <button
          onClick={() => openPanel('futures')}
          title="期貨交易終端"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 10,
            border: '1px solid rgba(255,200,100,0.35)',
            background:
              'linear-gradient(180deg, rgba(90,70,30,0.55), rgba(40,30,15,0.55))',
            color: '#f5efd5',
            cursor: 'pointer',
            fontSize: 24,
          }}
        >
          <span>📈</span>
          <span style={{ fontSize: 10, opacity: 0.9, marginTop: 2 }}>
            期貨
          </span>
        </button>
      </div>
    </>
  );
}
