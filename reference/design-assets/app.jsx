// Harvest Ridge — main app
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "timeOfDay": 11,
  "timeSpeed": 0,
  "weather": "clear",
  "season": "summer",
  "showGrid": false,
  "cameraZoom": 1.0,
  "fastGrow": false
}/*EDITMODE-END*/;

// Initial farm grid state (6 rows × 7 cols = 42 tiles)
function makeInitialGrid() {
  const grid = {};
  for (let r = 0; r < PLOT.rows; r++) {
    for (let c = 0; c < PLOT.cols; c++) {
      grid[`${c},${r}`] = { tilled: false, cropType: null, stage: 0, watered: false, plantedAt: null };
    }
  }
  // Pre-populate some tiles matching the reference image composition
  const preset = [
    // row 0 (back row): mostly lettuce/cabbage
    [0,0,'cabbage',3], [1,0,'cabbage',3], [2,0,'lettuce',2], [3,0,'cabbage',3], [4,0,'carrot',2], [5,0,'carrot',3], [6,0,'carrot',2],
    // row 1
    [0,1,'tomato',3], [1,1,'tomato',3], [2,1,'lettuce',2], [3,1,'cabbage',3], [4,1,'lettuce',2], [5,1,'carrot',3], [6,1,'carrot',3],
    // row 2
    [0,2,'tomato',4], [1,2,'tomato',3], [2,2,'lettuce',3], [3,2,'cabbage',3], [4,2,'tomato',4], [5,2,'lettuce',2], [6,2,null,0],
    // row 3
    [0,3,'lettuce',2], [1,3,'cabbage',3], [2,3,'tomato',4], [3,3,'lettuce',2], [4,3,'lettuce',3], [5,3,'cabbage',2], [6,3,'cabbage',2],
    // row 4
    [0,4,'carrot',2], [1,4,'tomato',3], [2,4,'lettuce',2], [3,4,'cabbage',3], [4,4,'cabbage',2], [5,4,'lettuce',2], [6,4,null,0],
    // row 5 (front)
    [0,5,'carrot',3], [1,5,'lettuce',2], [2,5,'cabbage',3], [3,5,'cabbage',3], [4,5,null,0], [5,5,'lettuce',2], [6,5,null,0],
  ];
  preset.forEach(([c, r, type, stage]) => {
    if (type) grid[`${c},${r}`] = { tilled: true, cropType: type, stage, watered: false, plantedAt: 0 };
    else grid[`${c},${r}`] = { tilled: true, cropType: null, stage: 0, watered: false, plantedAt: null };
  });
  return grid;
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { timeOfDay, timeSpeed, weather, season, showGrid, cameraZoom, fastGrow } = tweaks;

  const [tool, setTool] = useState('hoe');
  const [seedType, setSeedType] = useState('tomato');
  const [seeds, setSeeds] = useState({ tomato: 12, carrot: 12, lettuce: 12, pumpkin: 8, cabbage: 10 });
  const [inventory, setInventory] = useState({});
  const [money, setMoney] = useState(450);
  const [grid, setGrid] = useState(makeInitialGrid);
  const [day, setDay] = useState(3);
  const [hoverTile, setHoverTile] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [farmerPos, setFarmerPos] = useState({ col: 3, row: 5 });
  const [farmerAction, setFarmerAction] = useState(false);
  const [toast, setToast] = useState(null);
  const stageRef = useRef(null);

  // Stage size observation
  const [stageSize, setStageSize] = useState({ w: 1200, h: 680 });
  useEffect(() => {
    const update = () => {
      if (stageRef.current) {
        const r = stageRef.current.getBoundingClientRect();
        setStageSize({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Time progression
  useEffect(() => {
    if (timeSpeed <= 0) return;
    const id = setInterval(() => {
      let nt = timeOfDay + 0.1 * timeSpeed;
      if (nt >= 24) { nt -= 24; setDay(d => d + 1); }
      setTweak('timeOfDay', Math.round(nt * 10) / 10);
    }, 200);
    return () => clearInterval(id);
  }, [timeSpeed, timeOfDay, setTweak]);

  // Crop growth — tick each "day" or fast
  useEffect(() => {
    const interval = setInterval(() => {
      setGrid(g => {
        const ng = { ...g };
        Object.keys(ng).forEach(k => {
          const t = ng[k];
          if (t.cropType && t.watered && t.stage < 4) {
            ng[k] = { ...t, stage: t.stage + 1, watered: false };
          }
        });
        return ng;
      });
    }, fastGrow ? 2500 : 12000);
    return () => clearInterval(interval);
  }, [fastGrow]);

  // Tile click handler
  const handleTileClick = (col, row) => {
    const key = `${col},${row}`;
    const tile = grid[key];
    if (!tile) return;

    // Move farmer visually
    setFarmerPos({ col, row });
    setFarmerAction(true);
    setTimeout(() => setFarmerAction(false), 500);

    setTool(tool);

    if (tool === 'hoe') {
      if (!tile.tilled) {
        setGrid(g => ({ ...g, [key]: { ...g[key], tilled: true } }));
        showToast('Tilled the soil');
      } else if (tile.cropType) {
        showToast('Crop already planted here');
      } else {
        showToast('Already tilled');
      }
    } else if (tool === 'seed') {
      if (!tile.tilled) { showToast('Till the soil first'); return; }
      if (tile.cropType) { showToast('Already planted'); return; }
      if ((seeds[seedType] || 0) <= 0) { showToast(`No ${CROPS[seedType].name} seeds`); return; }
      setGrid(g => ({ ...g, [key]: { ...g[key], cropType: seedType, stage: 0, plantedAt: Date.now() } }));
      setSeeds(s => ({ ...s, [seedType]: s[seedType] - 1 }));
      showToast(`Planted ${CROPS[seedType].name}`);
    } else if (tool === 'water') {
      if (!tile.cropType) { showToast('Nothing to water'); return; }
      if (tile.stage === 4) { showToast('Fully grown — harvest it!'); return; }
      setGrid(g => ({ ...g, [key]: { ...g[key], watered: true } }));
      showToast('Watered');
    } else if (tool === 'basket') {
      if (!tile.cropType || tile.stage < 4) { showToast('Not ready to harvest'); return; }
      const crop = CROPS[tile.cropType];
      setInventory(inv => ({ ...inv, [tile.cropType]: (inv[tile.cropType] || 0) + 1 }));
      setGrid(g => ({ ...g, [key]: { ...g[key], cropType: null, stage: 0, watered: false } }));
      // get 1-2 seeds back
      setSeeds(s => ({ ...s, [tile.cropType]: (s[tile.cropType] || 0) + 1 }));
      showToast(`Harvested ${crop.name} · +1 seed`);
    }
  };

  const toastTimeoutRef = useRef(null);
  const showToast = useCallback((text) => {
    const id = Date.now();
    setToast({ id, text });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 1800);
  }, []);

  // Sell inventory
  const handleSell = () => {
    const total = Object.entries(inventory).reduce((a, [k, v]) => a + v * CROPS[k].price, 0);
    if (total <= 0) return;
    setMoney(m => m + total);
    setInventory({});
    showToast(`Sold for ${total}G`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '1') setTool('hoe');
      else if (e.key === '2') setTool('seed');
      else if (e.key === '3') setTool('water');
      else if (e.key === '4') setTool('basket');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Compute tile footprint in px for highlight/click
  const tileSize = tileFootprint(stageSize.w, stageSize.h);

  // Mouse move handler for tooltip position
  const onMouseMove = (e) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const overlayCursor = {
    hoe: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2732%27 height=%2732%27><text y=%2724%27 font-size=%2724%27>🪓</text></svg>") 4 4, pointer',
    seed: 'crosshair',
    water: 'crosshair',
    basket: 'crosshair',
  };

  // compute farmer smart position — near hovered tile if any
  const farmerDisplay = farmerPos;

  return (
    <div
      ref={stageRef}
      onMouseMove={onMouseMove}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: '#0c0a08',
        cursor: 'default',
      }}
    >
      {/* Reference image base layer with camera zoom */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${cameraZoom})`,
        transformOrigin: '50% 55%',
        transition: 'transform 400ms',
      }}>
        <img
          src="assets/farm-reference.png"
          alt=""
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '100%',
            minHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            pointerEvents: 'none',
            filter: season === 'winter'
              ? 'saturate(0.55) brightness(0.95) hue-rotate(-5deg)'
              : season === 'autumn'
              ? 'saturate(1.15) sepia(0.18) hue-rotate(-8deg)'
              : season === 'spring'
              ? 'saturate(1.1) brightness(1.03)'
              : 'none',
            transition: 'filter 600ms',
          }}
        />

        {/* Winter snow overlay on plot area */}
        {season === 'winter' && (
          <div style={{
            position: 'absolute',
            left: `${PLOT.tl.x - 2}%`,
            top: `${PLOT.tl.y - 2}%`,
            width: `${PLOT.tr.x - PLOT.tl.x + 4}%`,
            height: `${PLOT.bl.y - PLOT.tl.y + 4}%`,
            background: 'radial-gradient(ellipse, rgba(245,248,252,0.65) 0%, rgba(230,238,245,0.4) 70%, transparent 100%)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }} />
        )}

        {/* Autumn leaf tint */}
        <SeasonTint season={season} />

        {/* Ambient effects */}
        <Smoke x={18} y={22} />
        <PondRipple />
        <Chicken x={26} y={22} delay={0} />
        <Chicken x={30} y={20} delay={2} />
        <Chicken x={10} y={38} delay={4} />

        {/* Interactive tile grid */}
        {Object.entries(grid).map(([key, tile]) => {
          const [c, r] = key.split(',').map(Number);
          return (
            <TileHighlight
              key={key}
              col={c} row={r}
              state={tile}
              tileSize={tileSize}
              hovered={hoverTile === key}
              onClick={() => handleTileClick(c, r)}
              onEnter={() => setHoverTile(key)}
              onLeave={() => setHoverTile(null)}
            />
          );
        })}

        {/* Visible grid outline (debug) */}
        {showGrid && <GridOverlay />}

        {/* Crop overlay */}
        {Object.entries(grid).map(([key, tile]) => {
          const [c, r] = key.split(',').map(Number);
          if (!tile.cropType) return null;
          return (
            <CropSprite
              key={`crop-${key}`}
              col={c} row={r}
              cropType={tile.cropType}
              stage={tile.stage}
              watered={tile.watered}
              viewScale={stageSize.w / 1000}
            />
          );
        })}

        {/* Watered tile sheen */}
        {Object.entries(grid).map(([key, tile]) => {
          if (!tile.watered) return null;
          const [c, r] = key.split(',').map(Number);
          const { x, y } = gridToPercent(c, r);
          return (
            <div key={`wet-${key}`} style={{
              position: 'absolute',
              left: `${x}%`, top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              width: 48, height: 24,
              background: 'radial-gradient(ellipse, rgba(30,50,70,0.35) 0%, transparent 70%)',
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              zIndex: 50,
            }} />
          );
        })}

        {/* Farmer */}
        <Farmer
          col={farmerDisplay.col}
          row={farmerDisplay.row}
          tool={tool}
          action={farmerAction}
          viewScale={stageSize.w / 1000}
        />

        {/* Lighting / time-of-day overlay */}
        <TimeOverlay time={timeOfDay} weather={weather} />

        {/* Fireflies at night */}
        <Fireflies time={timeOfDay} />

        {/* Window glow at dusk/night */}
        {(timeOfDay < 6.5 || timeOfDay > 17.5) && (
          <div style={{
            position: 'absolute',
            left: '20.5%', top: '24%',
            width: 14, height: 12,
            background: 'radial-gradient(circle, rgba(255,220,140,0.95) 0%, rgba(255,180,80,0.4) 60%, transparent 100%)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }} />
        )}
      </div>

      <SceneFilters />

      {/* HUD */}
      <TopBar money={money} time={timeOfDay} day={day} season={season} weather={weather} />
      <Hotbar tool={tool} setTool={setTool} seedType={seedType} setSeedType={setSeedType} seeds={seeds} />
      <InventoryPanel inventory={inventory} onSell={handleSell} />
      <Toast message={toast} />

      {/* Tile tooltip */}
      {hoverTile && mousePos && (
        <TileTooltip tile={grid[hoverTile]} position={mousePos} />
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Time & Weather">
          <TweakSlider label="Time of day" value={timeOfDay} min={0} max={23.9} step={0.1} unit="h"
            onChange={(v) => setTweak('timeOfDay', Math.round(v * 10) / 10)} />
          <TweakSlider label="Time speed" value={timeSpeed} min={0} max={10} step={1} unit="×"
            onChange={(v) => setTweak('timeSpeed', v)} />
          <TweakRadio label="Weather" value={weather}
            options={[
              { value: 'clear', label: 'Clear' },
              { value: 'rain', label: 'Rain' },
              { value: 'snow', label: 'Snow' },
            ]}
            onChange={(v) => setTweak('weather', v)} />
          <TweakRadio label="Season" value={season}
            options={[
              { value: 'spring', label: 'Spring' },
              { value: 'summer', label: 'Summer' },
              { value: 'autumn', label: 'Autumn' },
              { value: 'winter', label: 'Winter' },
            ]}
            onChange={(v) => setTweak('season', v)} />
        </TweakSection>
        <TweakSection label="Gameplay">
          <TweakToggle label="Fast growth" value={fastGrow} onChange={(v) => setTweak('fastGrow', v)} />
          <TweakToggle label="Show plot grid" value={showGrid} onChange={(v) => setTweak('showGrid', v)} />
          <TweakSlider label="Camera zoom" value={cameraZoom} min={0.9} max={1.5} step={0.05} unit="×"
            onChange={(v) => setTweak('cameraZoom', v)} />
        </TweakSection>
        <TweakSection label="Cheats">
          <TweakButton label="+500 Gold" onClick={() => { setMoney(m => m + 500); showToast('+500 G'); }} />
          <TweakButton label="+10 Seeds (all)" onClick={() => {
            setSeeds(s => {
              const ns = {};
              Object.keys(CROPS).forEach(k => { ns[k] = (s[k] || 0) + 10; });
              return ns;
            });
            showToast('+10 seeds each');
          }} />
          <TweakButton label="Grow all crops" onClick={() => {
            setGrid(g => {
              const ng = {};
              Object.entries(g).forEach(([k, v]) => {
                ng[k] = v.cropType ? { ...v, stage: 4, watered: false } : v;
              });
              return ng;
            });
          }} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Debug grid overlay
function GridOverlay() {
  const lines = [];
  for (let c = 0; c <= PLOT.cols; c++) {
    const u = c / PLOT.cols;
    const x1 = (1-u)*PLOT.tl.x + u*PLOT.tr.x;
    const y1 = (1-u)*PLOT.tl.y + u*PLOT.tr.y;
    const x2 = (1-u)*PLOT.bl.x + u*PLOT.br.x;
    const y2 = (1-u)*PLOT.bl.y + u*PLOT.br.y;
    lines.push({ x1, y1, x2, y2 });
  }
  for (let r = 0; r <= PLOT.rows; r++) {
    const v = r / PLOT.rows;
    const x1 = (1-v)*PLOT.tl.x + v*PLOT.bl.x;
    const y1 = (1-v)*PLOT.tl.y + v*PLOT.bl.y;
    const x2 = (1-v)*PLOT.tr.x + v*PLOT.br.x;
    const y2 = (1-v)*PLOT.tr.y + v*PLOT.br.y;
    lines.push({ x1, y1, x2, y2 });
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 90,
    }}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgba(255,240,180,0.65)" strokeWidth="0.1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
