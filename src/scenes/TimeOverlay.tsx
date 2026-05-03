/**
 * Day/night cycle visual overlay.
 *
 * Ported from reference/design-assets/scene.jsx TimeOverlay.
 * Uses CSS blend modes to tint the farm image based on time-of-day (0-24).
 */
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

function hexToRgb(h: string): { r: number; g: number; b: number } {
  const s = h.replace('#', '');
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

function mix(a: string, b: string, k: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  return `rgb(${Math.round(pa.r + (pb.r - pa.r) * k)}, ${Math.round(pa.g + (pb.g - pa.g) * k)}, ${Math.round(pa.b + (pb.b - pa.b) * k)})`;
}

interface Grade {
  tint: string;
  tintOpacity: number;
  warm: string;
  warmOpacity: number;
  darken: number;
}

function getTimeGrade(t: number): Grade {
  if (t < 5) return { tint: '#1a2245', tintOpacity: 0.75, warm: '#2a3f7a', warmOpacity: 0.4, darken: 0.35 };
  if (t < 6.5) {
    const k = (t - 5) / 1.5;
    return { tint: mix('#1a2245', '#e8a070', k), tintOpacity: 0.65 - k * 0.3, warm: '#ff9060', warmOpacity: 0.5, darken: 0.25 - k * 0.2 };
  }
  if (t < 9) {
    const k = (t - 6.5) / 2.5;
    return { tint: mix('#e8a070', '#fff4d0', k), tintOpacity: 0.35 - k * 0.25, warm: '#ffc88a', warmOpacity: 0.5 - k * 0.2, darken: 0.05 };
  }
  if (t < 15) return { tint: '#ffffff', tintOpacity: 0, warm: '#fff4d0', warmOpacity: 0.15, darken: 0 };
  if (t < 17.5) {
    const k = (t - 15) / 2.5;
    return { tint: mix('#ffffff', '#ffcc80', k), tintOpacity: k * 0.2, warm: '#ffb060', warmOpacity: 0.2 + k * 0.3, darken: 0 };
  }
  if (t < 19.5) {
    const k = (t - 17.5) / 2;
    return { tint: mix('#ffcc80', '#c4502a', k), tintOpacity: 0.2 + k * 0.3, warm: '#ff7040', warmOpacity: 0.5 + k * 0.1, darken: k * 0.15 };
  }
  if (t < 21) {
    const k = (t - 19.5) / 1.5;
    return { tint: mix('#c4502a', '#1a2245', k), tintOpacity: 0.5 + k * 0.25, warm: '#4a3a60', warmOpacity: 0.4, darken: 0.15 + k * 0.2 };
  }
  return { tint: '#1a2245', tintOpacity: 0.75, warm: '#2a3f7a', warmOpacity: 0.4, darken: 0.35 };
}

export function TimeOverlay() {
  const time = useGameStore((s) => s.timeOfDay);
  const speed = useGameStore((s) => s.timeSpeed);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);

  useEffect(() => {
    if (speed <= 0) return;
    const id = window.setInterval(() => {
      setTimeOfDay(useGameStore.getState().timeOfDay + 0.1 * speed);
    }, 250);
    return () => window.clearInterval(id);
  }, [speed, setTimeOfDay]);

  const grade = getTimeGrade(time);
  const isDay = time > 6 && time < 19;
  const isNight = time < 5 || time > 20;

  return (
    <>
      {/* Color tint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: grade.tint,
          mixBlendMode: 'multiply',
          opacity: grade.tintOpacity,
          transition: 'all 600ms',
          zIndex: 10,
        }}
      />
      {/* Warm/cool light layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: grade.warm,
          mixBlendMode: 'soft-light',
          opacity: grade.warmOpacity,
          transition: 'all 600ms',
          zIndex: 11,
        }}
      />
      {/* Darkness dimmer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: '#000',
          opacity: grade.darken,
          transition: 'all 600ms',
          zIndex: 12,
        }}
      />
      {/* Sun flare */}
      {isDay && time > 5.5 && time < 18.5 && (
        <div
          style={{
            position: 'absolute',
            left: `${10 + ((time - 6) / 12) * 80}%`,
            top: `${8 + Math.abs(12 - time) * 1.2}%`,
            width: 240,
            height: 240,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(255,240,200,0.35) 0%, rgba(255,200,120,0.15) 40%, transparent 70%)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            zIndex: 13,
          }}
        />
      )}
      {/* Moon */}
      {isNight && (
        <div
          style={{
            position: 'absolute',
            right: '16%',
            top: '10%',
            width: 70,
            height: 70,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, #f8f4de 0%, #d0c8a8 55%, #7a7458 100%)',
            boxShadow: '0 0 60px rgba(240,230,200,0.35)',
            pointerEvents: 'none',
            zIndex: 13,
          }}
        />
      )}
    </>
  );
}
