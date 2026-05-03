// Harvest Ridge — HUD overlays
// Top bar: money + time + season. Bottom bar: tool hotbar + selected seed.
// Right panel: inventory. All styled to match the reference image's warm/rustic look.

function TopBar({ money, time, day, season, weather }) {
  const hours = Math.floor(time);
  const mins = Math.floor((time - hours) * 60);
  const ampm = hours < 12 ? 'AM' : 'PM';
  const h12 = ((hours + 11) % 12) + 1;

  const seasonLabels = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  const weatherIcons = { clear: '☀', rain: '☂', snow: '❄' };
  const weatherLabels = { clear: 'Clear', rain: 'Rain', snow: 'Snow' };

  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, right: 16,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      pointerEvents: 'none',
      fontFamily: 'Inter, sans-serif',
      zIndex: 1000,
    }}>
      {/* Money + farm name */}
      <div style={{
        pointerEvents: 'auto',
        background: 'linear-gradient(135deg, rgba(48,32,18,0.92) 0%, rgba(28,18,10,0.92) 100%)',
        border: '1px solid rgba(200,170,110,0.35)',
        boxShadow: '0 6px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,230,180,0.12)',
        borderRadius: 10,
        padding: '10px 16px',
        minWidth: 220,
      }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 22, fontWeight: 700, color: '#f1d89a',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>Harvest Ridge</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#d9a441" stroke="#8a5f18" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="7" fill="none" stroke="#8a5f18" strokeWidth="0.8" />
            <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#5a3a10">G</text>
          </svg>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 18, fontWeight: 600, color: '#f1d89a',
            letterSpacing: '0.04em',
          }}>
            {money.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Clock + season + weather */}
      <div style={{
        pointerEvents: 'auto',
        display: 'flex', gap: 8,
      }}>
        <ClockBadge time={time} day={day} />
        <Badge icon={weatherIcons[weather]} label={weatherLabels[weather]} />
        <Badge label={`${seasonLabels[season]} · ${season[0].toUpperCase()+season.slice(1)}`} />
      </div>
    </div>
  );
}

function ClockBadge({ time, day }) {
  const hours = Math.floor(time);
  const mins = Math.floor((time - hours) * 60);
  const h24 = hours.toString().padStart(2, '0');
  const m24 = mins.toString().padStart(2, '0');
  // analog clock hand angles
  const hourAng = ((time % 12) / 12) * 360;
  const minAng = (mins / 60) * 360;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(48,32,18,0.92), rgba(28,18,10,0.92))',
      border: '1px solid rgba(200,170,110,0.35)',
      boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
      borderRadius: 10,
      padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      color: '#f1d89a',
    }}>
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#1c1208" stroke="#8a6030" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="14" fill="url(#clockFace)" />
        <defs>
          <radialGradient id="clockFace" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#4a3218" />
            <stop offset="100%" stopColor="#1c1208" />
          </radialGradient>
        </defs>
        {[0, 3, 6, 9].map(n => {
          const a = (n / 12) * 2 * Math.PI - Math.PI/2;
          return <circle key={n} cx={16 + Math.cos(a)*10} cy={16 + Math.sin(a)*10} r="0.8" fill="#d9a441" />;
        })}
        <line x1="16" y1="16"
          x2={16 + Math.cos((hourAng - 90) * Math.PI/180) * 6}
          y2={16 + Math.sin((hourAng - 90) * Math.PI/180) * 6}
          stroke="#f1d89a" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="16"
          x2={16 + Math.cos((minAng - 90) * Math.PI/180) * 9}
          y2={16 + Math.sin((minAng - 90) * Math.PI/180) * 9}
          stroke="#f1d89a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.3" fill="#d9a441" />
      </svg>
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, letterSpacing: '0.05em' }}>
          {h24}:{m24}
        </div>
        <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Day {day}
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(48,32,18,0.92), rgba(28,18,10,0.92))',
      border: '1px solid rgba(200,170,110,0.35)',
      boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
      borderRadius: 10,
      padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
      color: '#f1d89a',
      fontSize: 13, fontWeight: 500,
    }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}

// ---------- Tool hotbar ----------
function Hotbar({ tool, setTool, seedType, setSeedType, seeds }) {
  const tools = [
    { id: 'hoe',    label: 'Hoe',         key: '1', icon: HoeIcon },
    { id: 'seed',   label: 'Seeds',       key: '2', icon: SeedIcon },
    { id: 'water',  label: 'Watering Can',key: '3', icon: WaterIcon },
    { id: 'basket', label: 'Harvest',     key: '4', icon: BasketIcon },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: 18, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'auto',
      zIndex: 1000,
    }}>
      {/* Seed selector (shown when seed tool active) */}
      {tool === 'seed' && (
        <div style={{
          display: 'flex', gap: 6,
          background: 'linear-gradient(135deg, rgba(48,32,18,0.94), rgba(28,18,10,0.94))',
          border: '1px solid rgba(200,170,110,0.35)',
          borderRadius: 10, padding: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {Object.entries(CROPS).map(([id, c]) => (
            <button key={id}
              onClick={() => setSeedType(id)}
              style={{
                background: seedType === id
                  ? 'linear-gradient(180deg, #8a6030, #5a3a18)'
                  : 'linear-gradient(180deg, #2a1c10, #1a1008)',
                border: `1px solid ${seedType === id ? '#d9a441' : 'rgba(200,170,110,0.2)'}`,
                borderRadius: 6,
                padding: '6px 10px',
                color: '#f1d89a',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                minWidth: 60,
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
              }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ letterSpacing: '0.04em' }}>{c.name}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, opacity: 0.7 }}>×{seeds[id] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hotbar */}
      <div style={{
        display: 'flex', gap: 6,
        background: 'linear-gradient(135deg, rgba(48,32,18,0.94), rgba(28,18,10,0.94))',
        border: '1px solid rgba(200,170,110,0.35)',
        borderRadius: 12, padding: 8,
        boxShadow: '0 8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,230,180,0.12)',
      }}>
        {tools.map(t => {
          const active = tool === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id}
              onClick={() => setTool(t.id)}
              style={{
                position: 'relative',
                width: 64, height: 64,
                background: active
                  ? 'linear-gradient(180deg, #c98a3a, #7a4f18)'
                  : 'linear-gradient(180deg, #3a2818, #1c120a)',
                border: `1.5px solid ${active ? '#f1d89a' : 'rgba(200,170,110,0.25)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2,
                boxShadow: active
                  ? '0 0 18px rgba(217,164,65,0.5), inset 0 1px 0 rgba(255,230,180,0.3)'
                  : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                transition: 'all 150ms',
              }}>
              <Icon size={28} active={active} />
              <span style={{
                position: 'absolute', top: 3, left: 5,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9, color: active ? '#2a1808' : '#a08758',
                fontWeight: 600,
              }}>{t.key}</span>
              <span style={{
                fontSize: 9, color: active ? '#2a1808' : '#c4a068',
                fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textShadow: active ? '0 1px 0 rgba(255,230,180,0.3)' : 'none',
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Tool icons (SVG) ----------
function HoeIcon({ size = 28, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <line x1="8" y1="30" x2="30" y2="8" stroke={active ? '#3a1808' : '#8a6030'} strokeWidth="3" strokeLinecap="round" />
      <path d="M 28 4 L 36 8 L 34 14 L 26 10 Z" fill={active ? '#d9d2c0' : '#8a8074'} stroke={active ? '#5a3a10' : '#3a3028'} strokeWidth="0.6" />
      <rect x="7" y="29" width="5" height="5" fill={active ? '#5a3a18' : '#3a2810'} rx="1" />
    </svg>
  );
}
function SeedIcon({ size = 28, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <path d="M 10 14 L 30 14 L 28 34 L 12 34 Z" fill={active ? '#c49860' : '#8a6838'} stroke={active ? '#5a3a10' : '#3a2810'} strokeWidth="0.8" />
      <path d="M 10 14 L 30 14 L 30 18 L 10 18 Z" fill={active ? '#d9b478' : '#a88a58'} />
      <path d="M 14 14 Q 14 8 20 8 Q 26 8 26 14" stroke={active ? '#5a3a10' : '#3a2810'} strokeWidth="1.2" fill="none" />
      <circle cx="18" cy="24" r="1.8" fill={active ? '#3a2010' : '#1a0a05'} />
      <circle cx="24" cy="28" r="1.4" fill={active ? '#3a2010' : '#1a0a05'} />
      <circle cx="16" cy="30" r="1.3" fill={active ? '#3a2010' : '#1a0a05'} />
    </svg>
  );
}
function WaterIcon({ size = 28, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="10" y="16" width="18" height="14" rx="2" fill={active ? '#c4ccd4' : '#6a7078'} stroke={active ? '#5a6068' : '#2a3038'} strokeWidth="0.8" />
      <rect x="10" y="16" width="18" height="4" fill={active ? '#e0e6ec' : '#8a9098'} />
      <path d="M 28 20 L 36 14 L 36 24 L 28 26 Z" fill={active ? '#c4ccd4' : '#6a7078'} stroke={active ? '#5a6068' : '#2a3038'} strokeWidth="0.8" />
      <rect x="12" y="12" width="5" height="5" rx="1" fill={active ? '#c4ccd4' : '#6a7078'} />
      <circle cx="35" cy="28" r="1" fill="#6aaadc" />
      <circle cx="37" cy="32" r="0.8" fill="#6aaadc" />
    </svg>
  );
}
function BasketIcon({ size = 28, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <path d="M 8 18 L 32 18 L 28 34 L 12 34 Z" fill={active ? '#c49860' : '#8a6030'} stroke={active ? '#5a3a10' : '#3a2410'} strokeWidth="0.8" />
      <ellipse cx="20" cy="18" rx="12" ry="3" fill={active ? '#d9b478' : '#a87840'} stroke={active ? '#5a3a10' : '#3a2410'} strokeWidth="0.8" />
      <path d="M 12 14 Q 20 6 28 14" stroke={active ? '#5a3a10' : '#3a2410'} strokeWidth="1.5" fill="none" />
      <path d="M 8 22 L 32 22 M 9 26 L 31 26 M 10 30 L 30 30" stroke={active ? '#5a3a10' : '#3a2410'} strokeWidth="0.5" />
      {/* contents */}
      <circle cx="16" cy="20" r="2.5" fill="#c43020" />
      <circle cx="22" cy="19" r="2" fill="#c45010" />
      <circle cx="26" cy="21" r="1.8" fill="#6a9a2a" />
    </svg>
  );
}

// ---------- Inventory / crop log (right side) ----------
function InventoryPanel({ inventory, onSell }) {
  const entries = Object.entries(inventory).filter(([, v]) => v > 0);
  const total = entries.reduce((acc, [k, v]) => acc + v * CROPS[k].price, 0);

  return (
    <div style={{
      position: 'absolute', top: 90, right: 16,
      width: 220,
      background: 'linear-gradient(135deg, rgba(48,32,18,0.92), rgba(28,18,10,0.92))',
      border: '1px solid rgba(200,170,110,0.35)',
      boxShadow: '0 6px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,230,180,0.1)',
      borderRadius: 10,
      padding: 12,
      color: '#f1d89a',
      pointerEvents: 'auto',
      fontFamily: 'Inter, sans-serif',
      zIndex: 900,
    }}>
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 16, fontWeight: 700,
        letterSpacing: '0.04em',
        borderBottom: '1px solid rgba(200,170,110,0.25)',
        paddingBottom: 6, marginBottom: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span>Harvest Basket</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, opacity: 0.65 }}>
          {entries.length}/{Object.keys(CROPS).length}
        </span>
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 11, opacity: 0.55, fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
          Empty — plant & harvest crops
        </div>
      ) : (
        <>
          {entries.map(([id, count]) => {
            const c = CROPS[id];
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 4px',
                borderBottom: '1px dashed rgba(200,170,110,0.15)',
              }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, opacity: 0.7 }}>
                    ×{count} · {c.price}G ea
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#d9a441', fontWeight: 600 }}>
                  {count * c.price}G
                </div>
              </div>
            );
          })}
          <button onClick={onSell} style={{
            marginTop: 10, width: '100%',
            background: 'linear-gradient(180deg, #c98a3a, #7a4f18)',
            border: '1px solid #f1d89a',
            borderRadius: 6,
            padding: '8px 0',
            color: '#2a1808',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,230,180,0.4)',
          }}>
            Sell All · {total}G
          </button>
        </>
      )}
    </div>
  );
}

// ---------- Tooltip on hovered tile ----------
function TileTooltip({ tile, cropType, position }) {
  if (!tile || !position) return null;
  const crop = tile.cropType ? CROPS[tile.cropType] : null;
  const stageLabels = ['Seeded', 'Sprout', 'Growing', 'Flowering', 'Ready to harvest'];

  return (
    <div style={{
      position: 'absolute',
      left: position.x + 16, top: position.y - 20,
      background: 'linear-gradient(135deg, rgba(38,24,14,0.97), rgba(22,14,8,0.97))',
      border: '1px solid rgba(200,170,110,0.45)',
      boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
      borderRadius: 8,
      padding: '8px 12px',
      color: '#f1d89a',
      fontFamily: 'Inter, sans-serif',
      fontSize: 11,
      pointerEvents: 'none',
      zIndex: 2000,
      minWidth: 140,
    }}>
      {!tile.tilled && (
        <div style={{ opacity: 0.85 }}>Untilled soil — use hoe</div>
      )}
      {tile.tilled && !crop && (
        <div style={{ opacity: 0.85 }}>Tilled · plant a seed</div>
      )}
      {crop && (
        <>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{crop.icon} {crop.name}</div>
          <div style={{ opacity: 0.75, fontSize: 10 }}>{stageLabels[tile.stage]}</div>
          <div style={{
            marginTop: 5, height: 4, borderRadius: 2,
            background: 'rgba(120,100,70,0.35)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(tile.stage / 4) * 100}%`,
              background: tile.stage === 4 ? '#e0c860' : '#7aa04a',
              transition: 'width 300ms',
            }} />
          </div>
          <div style={{
            marginTop: 5, fontSize: 10, opacity: 0.7,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{tile.watered ? '💧 Watered' : 'Dry'}</span>
            <span>{crop.price}G</span>
          </div>
        </>
      )}
    </div>
  );
}

// Toast for notifications
function Toast({ message }) {
  if (!message) return null;
  return (
    <div key={message.id} style={{
      position: 'absolute', top: 90, left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, rgba(48,32,18,0.96), rgba(28,18,10,0.96))',
      border: '1px solid rgba(217,164,65,0.6)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      borderRadius: 10,
      padding: '10px 18px',
      color: '#f1d89a',
      fontFamily: 'Inter, sans-serif',
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: '0.04em',
      zIndex: 2500,
      animation: 'toastIn 200ms ease-out',
      pointerEvents: 'none',
    }}>
      {message.text}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, {
  TopBar, Hotbar, InventoryPanel, TileTooltip, Toast,
});
