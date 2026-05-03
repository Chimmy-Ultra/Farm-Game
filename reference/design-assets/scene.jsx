// Harvest Ridge — photoreal farm scene
// Uses the reference image as a painted base layer with interactive
// crop tiles overlaid on the central garden plot area.

// The garden plot in the reference image occupies roughly:
// x: 27% - 73% of width
// y: 27% - 78% of height (in isometric space)
// It's a 6x7 grid of planting tiles

const PLOT = {
  // Quadrilateral corners of the garden plot in the reference image (as % of image dims)
  // Top-left, top-right, bottom-right, bottom-left of the isometric rectangle
  tl: { x: 38.5, y: 23.5 },
  tr: { x: 70.0, y: 30.5 },
  br: { x: 55.5, y: 70.0 },
  bl: { x: 24.5, y: 58.0 },
  cols: 7,
  rows: 6,
};

// Bilinear interpolation to find screen position of a grid cell center
function gridToPercent(col, row) {
  const u = (col + 0.5) / PLOT.cols;
  const v = (row + 0.5) / PLOT.rows;
  // Bilerp
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

// Approximate tile footprint in px for hit testing (width/height of a single cell projected)
function tileFootprint(stageW, stageH) {
  const colVec = {
    x: (PLOT.tr.x - PLOT.tl.x) / PLOT.cols,
    y: (PLOT.tr.y - PLOT.tl.y) / PLOT.cols,
  };
  const rowVec = {
    x: (PLOT.bl.x - PLOT.tl.x) / PLOT.rows,
    y: (PLOT.bl.y - PLOT.tl.y) / PLOT.rows,
  };
  return { colVec, rowVec };
}

// Scene filters for lighting overlays
function SceneFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="sunFlare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2c4" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffd17a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0ecd0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f0ecd0" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Time-of-day color grading overlay
function TimeOverlay({ time, weather }) {
  // time: 0-24. Build a color overlay that mimics natural lighting changes.
  const grade = getTimeGrade(time);
  const overcast = weather === 'rain' || weather === 'snow';

  return (
    <>
      {/* Color-tint overlay using multiply/overlay blend */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: grade.tint,
        mixBlendMode: 'multiply',
        opacity: grade.tintOpacity,
        transition: 'all 600ms',
      }} />
      {/* Warm/cool additive layer */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: grade.warm,
        mixBlendMode: 'soft-light',
        opacity: grade.warmOpacity,
        transition: 'all 600ms',
      }} />
      {/* Overall brightness shift */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: '#000',
        opacity: grade.darken,
        transition: 'all 600ms',
      }} />
      {/* Sun flare at top */}
      {time > 5.5 && time < 18.5 && !overcast && (
        <div style={{
          position: 'absolute',
          left: `${10 + ((time - 6) / 12) * 80}%`,
          top: `${8 + Math.abs(12 - time) * 1.2}%`,
          width: 240, height: 240,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,240,200,0.35) 0%, rgba(255,200,120,0.15) 40%, transparent 70%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
      )}
      {/* Moon at night */}
      {(time < 5 || time > 19.5) && (
        <div style={{
          position: 'absolute',
          right: '16%', top: '10%',
          width: 70, height: 70,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #f8f4de 0%, #d0c8a8 55%, #7a7458 100%)',
          boxShadow: '0 0 60px rgba(240,230,200,0.35)',
          pointerEvents: 'none',
        }} />
      )}
      {/* Overcast desaturation */}
      {overcast && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'rgba(140,150,155,0.28)',
          mixBlendMode: 'normal',
        }} />
      )}
      {/* Rain */}
      {weather === 'rain' && <Rain />}
      {/* Snow */}
      {weather === 'snow' && <Snow />}
    </>
  );
}

function getTimeGrade(t) {
  // returns { tint, tintOpacity, warm, warmOpacity, darken }
  if (t < 5) {
    return { tint: '#1a2245', tintOpacity: 0.75, warm: '#2a3f7a', warmOpacity: 0.4, darken: 0.35 };
  } else if (t < 6.5) {
    const k = (t - 5) / 1.5;
    return { tint: mix('#1a2245', '#e8a070', k), tintOpacity: 0.65 - k*0.3, warm: '#ff9060', warmOpacity: 0.5, darken: 0.25 - k*0.2 };
  } else if (t < 9) {
    const k = (t - 6.5) / 2.5;
    return { tint: mix('#e8a070', '#fff4d0', k), tintOpacity: 0.35 - k*0.25, warm: '#ffc88a', warmOpacity: 0.5 - k*0.2, darken: 0.05 };
  } else if (t < 15) {
    return { tint: '#ffffff', tintOpacity: 0, warm: '#fff4d0', warmOpacity: 0.15, darken: 0 };
  } else if (t < 17.5) {
    const k = (t - 15) / 2.5;
    return { tint: mix('#ffffff', '#ffcc80', k), tintOpacity: k*0.2, warm: '#ffb060', warmOpacity: 0.2 + k*0.3, darken: 0 };
  } else if (t < 19.5) {
    const k = (t - 17.5) / 2;
    return { tint: mix('#ffcc80', '#c4502a', k), tintOpacity: 0.2 + k*0.3, warm: '#ff7040', warmOpacity: 0.5 + k*0.1, darken: k*0.15 };
  } else if (t < 21) {
    const k = (t - 19.5) / 1.5;
    return { tint: mix('#c4502a', '#1a2245', k), tintOpacity: 0.5 + k*0.25, warm: '#4a3a60', warmOpacity: 0.4, darken: 0.15 + k*0.2 };
  } else {
    return { tint: '#1a2245', tintOpacity: 0.75, warm: '#2a3f7a', warmOpacity: 0.4, darken: 0.35 };
  }
}

function mix(a, b, k) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  return `rgb(${Math.round(pa.r + (pb.r - pa.r)*k)}, ${Math.round(pa.g + (pb.g - pa.g)*k)}, ${Math.round(pa.b + (pb.b - pa.b)*k)})`;
}
function hexToRgb(h) {
  const s = h.replace('#','');
  return { r: parseInt(s.slice(0,2),16), g: parseInt(s.slice(2,4),16), b: parseInt(s.slice(4,6),16) };
}

function Rain() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({length: 100}).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 13) % 100}%`,
          top: `-10%`,
          width: 1.2, height: 20,
          background: 'linear-gradient(to bottom, transparent, rgba(220,232,240,0.75))',
          transform: 'rotate(14deg)',
          animation: `rainfall ${0.45 + (i%5)*0.08}s linear ${(i%10)*0.07}s infinite`,
        }} />
      ))}
      <style>{`@keyframes rainfall { from { transform: translateY(-10vh) rotate(14deg); } to { transform: translateY(120vh) rotate(14deg); } }`}</style>
    </div>
  );
}

function Snow() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({length: 70}).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 17) % 100}%`,
          top: `-5%`,
          width: 3 + (i%3), height: 3 + (i%3),
          background: '#fbfaf2',
          borderRadius: '50%',
          filter: 'blur(0.5px)',
          opacity: 0.85,
          animation: `snowfall ${5 + (i%5)}s linear ${(i%10)*0.3}s infinite`,
        }} />
      ))}
      <style>{`@keyframes snowfall { from { transform: translate(0,-5vh); } to { transform: translate(50px, 110vh); } }`}</style>
    </div>
  );
}

// Snow blanket overlay for winter — soft white over everything
function WinterBlanket({ season }) {
  if (season !== 'winter') return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 40%, rgba(240,245,250,0.25) 0%, rgba(220,230,240,0.35) 100%)',
      mixBlendMode: 'screen',
    }} />
  );
}

// Autumn warm tint
function SeasonTint({ season }) {
  if (season === 'autumn') {
    return (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'rgba(200,120,40,0.15)',
        mixBlendMode: 'overlay',
      }} />
    );
  }
  if (season === 'spring') {
    return (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'rgba(140,180,80,0.08)',
        mixBlendMode: 'overlay',
      }} />
    );
  }
  return null;
}

// ---------- Interactive tile highlight ----------
function TileHighlight({ col, row, state, hovered, tileSize, onClick, onEnter, onLeave }) {
  const { x, y } = gridToPercent(col, row);
  // Approx tile diamond footprint
  const { colVec, rowVec } = tileSize;
  return (
    <div
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'absolute',
        left: `${x}%`, top: `${y}%`,
        width: `${Math.abs(colVec.x) + Math.abs(rowVec.x)}%`,
        height: `${Math.abs(colVec.y) + Math.abs(rowVec.y)}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      {hovered && (
        <div style={{
          position: 'absolute', inset: '10%',
          background: 'rgba(255,240,180,0.18)',
          border: '1.5px solid rgba(255,240,180,0.7)',
          boxShadow: 'inset 0 0 20px rgba(255,240,180,0.3), 0 0 12px rgba(255,240,180,0.4)',
          transform: `skew(${Math.atan2(colVec.y, colVec.x) * 180 / Math.PI}deg, 0deg)`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ---------- Crop overlay ----------
// Rendered as small 3D-ish illustrations anchored at grid cell center.
// Scale varies with row (further tiles = smaller for fake depth).
function CropSprite({ col, row, cropType, stage, watered, viewScale }) {
  const { x, y } = gridToPercent(col, row);
  const crop = CROPS[cropType];
  if (!crop) return null;

  // Depth scale: rows further back (smaller row index) are further away.
  // But with isometric, deeper rows are higher on screen; they should be slightly smaller.
  const depthScale = 0.85 + (row / PLOT.rows) * 0.3;
  const scale = depthScale * viewScale;
  const h = crop.heights[stage] * scale;

  if (stage === 0) {
    return (
      <div style={{
        position: 'absolute',
        left: `${x}%`, top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        width: 6 * scale, height: 6 * scale,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #4a2e18 0%, #1a0a05 80%)',
        boxShadow: `0 ${1*scale}px ${2*scale}px rgba(0,0,0,0.6)`,
        zIndex: 100 + row * 10,
      }} />
    );
  }

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: `translate(-50%, calc(-50% - ${h*0.35}px))`,
      width: 34 * scale, height: h,
      zIndex: 100 + row * 10 + col,
      pointerEvents: 'none',
    }}>
      {/* ground shadow */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -4 * scale,
        width: 28 * scale, height: 8 * scale,
        transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 65%)',
      }} />
      {crop.render(stage, scale)}
      {stage === 4 && (
        <div style={{
          position: 'absolute', left: '50%', top: -6 * scale,
          width: 4, height: 4, transform: 'translateX(-50%)',
          fontSize: 12 * scale, lineHeight: 1,
          color: '#ffe066',
          textShadow: '0 0 6px rgba(255,220,100,0.8)',
        }}>✦</div>
      )}
    </div>
  );
}

// Render functions per crop — painted-look using layered CSS/SVG
const CROPS = {
  lettuce: {
    name: 'Lettuce', icon: '🥬', days: 3, price: 30,
    heights: [0, 14, 20, 26, 30],
    render(stage, s) {
      const size = [0, 10, 16, 22, 26][stage] * s;
      return (
        <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}>
          <svg width={size * 1.4} height={size} viewBox="0 0 40 28" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id={`lett-${stage}`} cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#a8c85a" />
                <stop offset="60%" stopColor="#6a8a2a" />
                <stop offset="100%" stopColor="#3a5010" />
              </radialGradient>
            </defs>
            {[0, 1, 2, 3, 4].slice(0, 2 + stage).map((i) => {
              const ang = (i * 72 - 90) * Math.PI / 180;
              const rx = 6 + i * 0.5;
              const ry = 9 + i * 0.5;
              return (
                <ellipse key={i}
                  cx={20 + Math.cos(ang) * 6}
                  cy={16 + Math.sin(ang) * 4}
                  rx={rx} ry={ry}
                  fill={`url(#lett-${stage})`}
                  opacity={0.92}
                />
              );
            })}
            <ellipse cx="20" cy="14" rx="8" ry="6" fill="#c4d870" opacity="0.7" />
          </svg>
        </div>
      );
    },
  },
  tomato: {
    name: 'Tomato', icon: '🍅', days: 5, price: 55,
    heights: [0, 18, 32, 46, 54],
    render(stage, s) {
      const h = [0, 18, 32, 46, 54][stage] * s;
      return (
        <>
          <div style={{
            position: 'absolute', left: '50%', bottom: 0,
            width: 2.2 * s, height: h,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to right, #2a4010, #4a6a20, #2a4010)',
            borderRadius: 1,
          }} />
          {[0.3, 0.55, 0.8].slice(0, stage + 1).map((p, i) => (
            <div key={i} style={{
              position: 'absolute', left: '50%', bottom: h * p,
              width: 16 * s, height: 10 * s,
              transform: `translateX(-50%) rotate(${i%2 ? -18 : 18}deg)`,
              background: `radial-gradient(ellipse at 40% 30%, #6a9a2a 0%, #3a6010 80%)`,
              borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
              boxShadow: 'inset -2px -2px 3px rgba(0,0,0,0.35)',
            }} />
          ))}
          {stage >= 3 && (
            <>
              <div style={{
                position: 'absolute', left: `calc(50% - ${4*s}px)`, bottom: h * 0.55,
                width: 8 * s, height: 8 * s,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, #ff9060 0%, #c43020 55%, #6a1005 100%)`,
                boxShadow: `0 ${1*s}px ${2*s}px rgba(0,0,0,0.4), inset -1.5px -2px 3px rgba(0,0,0,0.3)`,
              }} />
              <div style={{
                position: 'absolute', left: `calc(50% + ${1*s}px)`, bottom: h * 0.35,
                width: 7 * s, height: 7 * s,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, #ff9060 0%, #c43020 55%, #6a1005 100%)`,
                boxShadow: `0 ${1*s}px ${2*s}px rgba(0,0,0,0.4), inset -1.5px -2px 3px rgba(0,0,0,0.3)`,
              }} />
            </>
          )}
        </>
      );
    },
  },
  carrot: {
    name: 'Carrot', icon: '🥕', days: 3, price: 28,
    heights: [0, 14, 22, 30, 36],
    render(stage, s) {
      return (
        <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}>
          <svg width={26 * s} height={36 * s} viewBox="0 0 26 36" style={{ overflow: 'visible' }}>
            {[0, 1, 2, 3, 4, 5].slice(0, 2 + stage).map((i) => {
              const angle = -60 + i * 24;
              const len = 16 + i % 2 * 4;
              return (
                <path key={i}
                  d={`M 13 ${36 - stage*3} L ${13 + Math.cos(angle*Math.PI/180)*len} ${36 - stage*3 - Math.sin(Math.abs(angle)*Math.PI/180)*len}`}
                  stroke={i%2 ? '#3a5a12' : '#4a7020'}
                  strokeWidth="1.5"
                  fill="none"
                />
              );
            })}
            {stage >= 3 && (
              <path d={`M 11 ${36 - 2} L 15 ${36 - 2} L 14 ${32 - stage} L 12 ${32 - stage} Z`}
                    fill="url(#carrotGrad)" />
            )}
            <defs>
              <linearGradient id="carrotGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#ff9040" />
                <stop offset="100%" stopColor="#c45010" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
    },
  },
  pumpkin: {
    name: 'Pumpkin', icon: '🎃', days: 7, price: 95,
    heights: [0, 12, 20, 28, 34],
    render(stage, s) {
      return (
        <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}>
          <svg width={36 * s} height={28 * s} viewBox="0 0 36 28" style={{ overflow: 'visible' }}>
            {/* vines/leaves */}
            {[0, 1, 2, 3].slice(0, 2 + stage).map((i) => (
              <ellipse key={i}
                cx={6 + i * 8}
                cy={20 + (i%2) * 3}
                rx={5}
                ry={3}
                fill="#4a7a20"
                opacity="0.85"
              />
            ))}
            {stage >= 3 && (
              <>
                <ellipse cx="18" cy="20" rx="10" ry="7" fill="#c45a10" />
                <path d="M 10 20 Q 18 14 26 20" stroke="#8a3a08" strokeWidth="0.8" fill="none" />
                <path d="M 13 14 Q 18 12 23 14" stroke="#8a3a08" strokeWidth="0.8" fill="none" />
                <ellipse cx="18" cy="17" rx="8" ry="5" fill="#e07020" opacity="0.6" />
                <rect x="17" y="12" width="2" height="3" fill="#3a5010" />
              </>
            )}
          </svg>
        </div>
      );
    },
  },
  cabbage: {
    name: 'Cabbage', icon: '🥗', days: 4, price: 42,
    heights: [0, 14, 20, 26, 30],
    render(stage, s) {
      const size = [0, 12, 18, 24, 28][stage] * s;
      return (
        <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}>
          <svg width={size * 1.3} height={size} viewBox="0 0 40 30" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id={`cab-${stage}`} cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#b8d5a0" />
                <stop offset="55%" stopColor="#7a9a5a" />
                <stop offset="100%" stopColor="#3a5a28" />
              </radialGradient>
            </defs>
            <ellipse cx="20" cy="22" rx="14" ry="6" fill="#2a4018" opacity="0.7" />
            <circle cx="20" cy="16" r="12" fill={`url(#cab-${stage})`} />
            <path d="M 10 16 Q 14 10 20 14 Q 26 10 30 16 Q 26 20 20 16 Q 14 20 10 16"
                  stroke="#2a4018" strokeWidth="0.5" fill="none" opacity="0.6" />
            <ellipse cx="16" cy="12" rx="5" ry="3" fill="#c4dca0" opacity="0.5" />
          </svg>
        </div>
      );
    },
  },
};

// ---------- Farmer ----------
function Farmer({ col, row, tool, action, viewScale = 1 }) {
  const { x, y } = gridToPercent(col, row);
  const s = viewScale * (0.85 + (row / PLOT.rows) * 0.3);
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: `translate(-50%, calc(-100% + 10px))`,
      zIndex: 200 + row * 10,
      pointerEvents: 'none',
      transition: 'left 350ms ease-out, top 350ms ease-out',
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: '100%',
        width: 38 * s, height: 10 * s, transform: 'translate(-50%, -5px)',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
      }} />
      <svg width={52 * s} height={82 * s} viewBox="0 0 52 82" style={{ overflow: 'visible' }}>
        {/* legs */}
        <path d="M 18 56 L 22 56 L 24 78 L 18 78 Z" fill="#2a3858" />
        <path d="M 28 56 L 32 56 L 34 78 L 28 78 Z" fill="#2a3858" />
        <rect x="16" y="76" width="10" height="4" rx="1" fill="#2a1808" />
        <rect x="26" y="76" width="10" height="4" rx="1" fill="#2a1808" />
        {/* torso — plaid */}
        <path d="M 14 34 L 38 34 L 40 58 L 12 58 Z" fill="#8a2818" />
        <path d="M 14 34 L 38 34 L 39 44 L 13 44 Z" fill="#b03820" opacity="0.85" />
        <line x1="20" y1="34" x2="21" y2="58" stroke="#5a1008" strokeWidth="0.8" />
        <line x1="32" y1="34" x2="32" y2="58" stroke="#5a1008" strokeWidth="0.8" />
        <line x1="13" y1="46" x2="39" y2="46" stroke="#5a1008" strokeWidth="0.6" />
        {/* neck */}
        <rect x="23" y="29" width="6" height="6" fill="#c4906a" />
        {/* head */}
        <circle cx="26" cy="22" r="9" fill="#d4a080" />
        <circle cx="23" cy="22" r="0.9" fill="#1a0a05" />
        <circle cx="29" cy="22" r="0.9" fill="#1a0a05" />
        <path d="M 23 26 Q 26 28 29 26" stroke="#1a0a05" strokeWidth="0.7" fill="none" />
        {/* hat */}
        <ellipse cx="26" cy="16" rx="14" ry="3" fill="#5a3a18" />
        <path d="M 17 16 Q 19 6 26 6 Q 33 6 35 16 Z" fill="#6a4520" />
        <ellipse cx="26" cy="9" rx="7" ry="1.5" fill="#3a240c" />
        {/* arms */}
        <rect x="10" y="36" width="5" height="18" rx="2" fill="#8a2818"
          transform={action ? 'rotate(-18 12 36)' : ''} style={{ transition: 'transform 200ms' }} />
        <rect x="37" y="36" width="5" height={action ? 13 : 18} rx="2" fill="#8a2818"
          transform={action ? 'rotate(-28 39 36)' : ''} />
        {/* tools */}
        {tool === 'hoe' && (
          <g transform={`translate(${action ? 40 : 44} ${action ? 26 : 38}) rotate(${action ? -25 : 25})`}>
            <rect x="0" y="0" width="2" height="30" fill="#5a3a18" />
            <path d="M -4 -1 L 6 -1 L 4 -6 L -2 -6 Z" fill="#888074" />
            <path d="M -4 -1 L 6 -1 L 5 0 L -3 0 Z" fill="#5a5044" />
          </g>
        )}
        {tool === 'water' && (
          <g transform={`translate(${action ? 42 : 44} ${action ? 40 : 46}) rotate(${action ? 22 : 0})`}>
            <rect x="-6" y="-3" width="12" height="9" rx="1.5" fill="#6a7078" />
            <rect x="-6" y="-3" width="12" height="2.5" fill="#8a9098" />
            <path d="M 6 0 L 14 -5 L 14 3 L 6 4 Z" fill="#6a7078" />
            <path d="M 6 0 L 14 -5 L 14 -3 L 6 1 Z" fill="#8a9098" />
            <rect x="-5" y="-7" width="3" height="4" rx="1" fill="#6a7078" />
            {action && (
              <>
                <circle cx="15" cy="-1" r="0.8" fill="#6aaadc" opacity="0.9" />
                <circle cx="17" cy="3" r="1" fill="#6aaadc" opacity="0.9" />
                <circle cx="14" cy="6" r="0.7" fill="#6aaadc" opacity="0.9" />
                <circle cx="18" cy="8" r="0.6" fill="#6aaadc" opacity="0.8" />
              </>
            )}
          </g>
        )}
        {tool === 'seed' && (
          <g transform={`translate(${action ? 40 : 42} 44)`}>
            <path d="M -5 -3 L 5 -3 L 4 8 L -4 8 Z" fill="#8a6a3a" />
            <path d="M -5 -3 L 5 -3 L 5 -1 L -5 -1 Z" fill="#a88a58" />
            <path d="M -3 -3 Q -3 -6 0 -6 Q 3 -6 3 -3" stroke="#5a4020" strokeWidth="0.5" fill="none" />
            {action && (
              <>
                <circle cx="2" cy="10" r="0.8" fill="#4a2e18" />
                <circle cx="-1" cy="12" r="0.7" fill="#4a2e18" />
                <circle cx="3" cy="14" r="0.6" fill="#4a2e18" />
              </>
            )}
          </g>
        )}
        {tool === 'basket' && (
          <g transform="translate(42 48)">
            <path d="M -6 -1 L 6 -1 L 4 10 L -4 10 Z" fill="#8a6030" />
            <ellipse cx="0" cy="-1" rx="6" ry="1.5" fill="#a87840" />
            <path d="M -5 2 L 5 2 M -5 5 L 5 5" stroke="#5a3818" strokeWidth="0.5" />
          </g>
        )}
      </svg>
    </div>
  );
}

// Chickens wandering near coop
function Chicken({ x, y, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -100%)',
      zIndex: 150,
      pointerEvents: 'none',
      animation: `chickenWalk 6s ease-in-out ${delay}s infinite`,
    }}>
      <svg width="18" height="16" viewBox="0 0 18 16" style={{ overflow: 'visible' }}>
        <ellipse cx="9" cy="10" rx="5" ry="4" fill="#f8f3e0" />
        <ellipse cx="9" cy="10" rx="5" ry="4" fill="#d8c8a8" opacity="0.4" />
        <circle cx="13" cy="7" r="2.5" fill="#f8f3e0" />
        <path d="M 15 6 L 17 7 L 15 7.5 Z" fill="#e0a020" />
        <path d="M 13 5 Q 14 3 15 5" fill="#c42020" />
        <circle cx="14" cy="7" r="0.4" fill="#1a0a05" />
        <path d="M 7 13 L 7 16 M 11 13 L 11 16" stroke="#d0a050" strokeWidth="0.8" />
      </svg>
      <style>{`
        @keyframes chickenWalk {
          0%, 100% { transform: translate(-50%, -100%); }
          25% { transform: translate(calc(-50% + 15px), -100%); }
          50% { transform: translate(calc(-50% + 15px), -100%) scaleX(-1); }
          75% { transform: translate(-50%, -100%) scaleX(-1); }
        }
      `}</style>
    </div>
  );
}

// Smoke from chimney
function Smoke({ x, y }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      zIndex: 80,
      pointerEvents: 'none',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 24, height: 24,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,220,220,0.7) 0%, rgba(180,180,180,0) 70%)',
          animation: `smokeRise 4s ease-out ${i * 1.3}s infinite`,
          filter: 'blur(2px)',
        }} />
      ))}
      <style>{`
        @keyframes smokeRise {
          0% { transform: translate(0, 0) scale(0.4); opacity: 0.9; }
          100% { transform: translate(-20px, -80px) scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Fireflies at night
function Fireflies({ time }) {
  if (time > 5.5 && time < 19.5) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({length: 12}).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${20 + (i * 6) % 60}%`,
          top: `${60 + (i * 4) % 25}%`,
          width: 3, height: 3,
          borderRadius: '50%',
          background: '#fff4a0',
          boxShadow: '0 0 8px rgba(255,240,160,0.9), 0 0 16px rgba(255,240,160,0.6)',
          animation: `firefly ${3 + (i%4)}s ease-in-out ${i*0.3}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes firefly {
          0%, 100% { opacity: 0; transform: translate(0,0); }
          30% { opacity: 0.9; }
          50% { transform: translate(15px, -10px); }
          70% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// Pond ripple animation (over the pond area bottom-right)
function PondRipple() {
  return (
    <div style={{
      position: 'absolute',
      left: '82%', top: '80%',
      transform: 'translate(-50%, -50%)',
      width: 60, height: 30,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        border: '1px solid rgba(180,200,220,0.5)',
        borderRadius: '50%',
        animation: 'ripple 4s ease-out infinite',
      }} />
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// expose
Object.assign(window, {
  SceneFilters, TimeOverlay, Rain, Snow,
  WinterBlanket, SeasonTint,
  TileHighlight, CropSprite, CROPS,
  Farmer, Chicken, Smoke, Fireflies, PondRipple,
  gridToPercent, tileFootprint, PLOT,
});
