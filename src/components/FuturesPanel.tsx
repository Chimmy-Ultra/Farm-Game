import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { COMMODITIES, type CommodityCategory } from '../data/commodities';
import { useGameStore } from '../store/gameStore';

const CATEGORY_LABEL: Record<CommodityCategory, string> = {
  grain: '穀物',
  oilseed: '油籽',
  soft: '軟商品',
  livestock: '畜產',
  dairy: '乳製品',
  industrial: '工業',
  asian: '亞洲',
};

/**
 * Simple simulated price noise tied to day.
 * Real implementation would drive prices from ENSO + weather + seasonality.
 */
function simulatedPrice(basePrice: number, dailyVolatility: number, day: number, id: string): number {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = (day + seed) * 0.37;
  const wave = Math.sin(t) * 0.7 + Math.sin(t * 2.3) * 0.3;
  const shift = wave * dailyVolatility * 20;
  return basePrice * (1 + shift);
}

function priceDelta(base: number, now: number): { pct: number; color: string; sign: string } {
  const pct = ((now - base) / base) * 100;
  const color = pct >= 0 ? '#22c55e' : '#ef4444';
  const sign = pct >= 0 ? '+' : '';
  return { pct, color, sign };
}

export function FuturesPanel() {
  const panel = useUIStore((s) => s.panel);
  const closePanel = useUIStore((s) => s.closePanel);
  const day = useGameStore((s) => s.day);

  const open = panel === 'futures';

  const rows = useMemo(() => {
    return Object.values(COMMODITIES).map((c) => {
      const now = simulatedPrice(c.basePrice, c.dailyVolatility, day, c.id);
      const { pct, color, sign } = priceDelta(c.basePrice, now);
      return { c, now, pct, color, sign };
    });
  }, [day]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5,8,10,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={closePanel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(94vw, 1200px)',
          height: 'min(88vh, 720px)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,200,100,0.25)',
        }}
      >
        {/* Background image */}
        <img
          src="./futures-trading-room.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
          }}
        />
        {/* Darkening for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,14,18,0.55) 0%, rgba(10,14,18,0.25) 40%, rgba(10,14,18,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Close button */}
        <button
          onClick={closePanel}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid rgba(255,220,140,0.4)',
            background: 'rgba(15,18,15,0.7)',
            color: '#f5efd5',
            cursor: 'pointer',
            fontSize: 18,
            zIndex: 10,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 28,
            color: '#f5efd5',
            zIndex: 5,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
            期貨交易終端 <span style={{ opacity: 0.6, fontSize: 14 }}>· Futures Terminal</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            第 {day} 天 · {rows.length} 項商品報價 (模擬)
          </div>
        </div>

        {/* Commodity quote board */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            right: 28,
            bottom: 28,
            top: 80,
            background: 'rgba(8,12,14,0.82)',
            border: '1px solid rgba(255,200,100,0.18)',
            borderRadius: 10,
            padding: '12px 10px 6px',
            overflowY: 'auto',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 12,
            color: '#e8ddbb',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr 90px 90px 80px 70px',
              gap: 8,
              padding: '4px 10px',
              fontWeight: 600,
              color: '#c9b26a',
              borderBottom: '1px solid rgba(255,200,100,0.18)',
              marginBottom: 4,
            }}
          >
            <span>類別</span>
            <span>商品</span>
            <span style={{ opacity: 0.7 }}>交易所</span>
            <span style={{ textAlign: 'right' }}>基準價</span>
            <span style={{ textAlign: 'right' }}>現價</span>
            <span style={{ textAlign: 'right' }}>漲跌</span>
            <span style={{ textAlign: 'right' }}>波動</span>
          </div>
          {rows.map(({ c, now, pct, color, sign }) => (
            <div
              key={c.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr 90px 90px 80px 70px',
                gap: 8,
                padding: '4px 10px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ color: '#a79a6a', fontSize: 11 }}>{CATEGORY_LABEL[c.category]}</span>
              <span>
                <span style={{ color: '#ffe9b0' }}>{c.nameZh}</span>{' '}
                <span style={{ opacity: 0.5, fontSize: 11 }}>{c.symbol}</span>
              </span>
              <span style={{ opacity: 0.6, fontSize: 11 }}>{c.exchange}</span>
              <span style={{ textAlign: 'right', opacity: 0.65 }}>
                {c.basePrice.toFixed(c.basePrice < 10 ? 2 : 0)}
              </span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {now.toFixed(c.basePrice < 10 ? 2 : 0)}
              </span>
              <span style={{ textAlign: 'right', color, fontWeight: 600 }}>
                {sign}{pct.toFixed(2)}%
              </span>
              <span style={{ textAlign: 'right', opacity: 0.55 }}>
                {(c.dailyVolatility * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
