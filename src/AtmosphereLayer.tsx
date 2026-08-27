'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { getAtmosphereEngine } from './engine';
import { CLOUD_CONFIGS } from './config';
import { getTheme } from './theme';
import { computeStrike, resolveLightning } from './lightning';
import type { AtmosphereLayerProps, LightningConfig } from './types';

/**
 * Persistent atmospheric background layer for the Nimbus ecosystem.
 *
 * Renders as `position: fixed` so it persists through all route transitions
 * without remounting. Cloud positions are derived from global elapsed time
 * (performance.now() since page load), not from component mount time, so
 * navigation never causes positions to reset or snap.
 *
 * Usage — mount once in the root layout, before page content:
 *
 *   <body>
 *     <AtmosphereLayer />
 *     {children}
 *   </body>
 *
 * Pass `dark` to put the atmosphere into its night state: dark sky gradients,
 * dimmed accents, storm-slate clouds, and infrequent lightning flashing inside
 * the cloud bodies.
 */
export function AtmosphereLayer({
  debug = false,
  dark = false,
  lightning = true,
}: AtmosphereLayerProps) {
  // Stable per-instance ID persists across re-renders but is created once.
  const engineId = useRef<symbol | null>(null);
  if (engineId.current === null) engineId.current = Symbol('atmosphere');

  const cloudRefs = useRef<(SVGSVGElement | null)[]>([]);
  const flashRefs = useRef<(SVGGElement | null)[]>([]);
  const skyFlashRef = useRef<HTMLDivElement | null>(null);
  const boltRef = useRef<HTMLSpanElement | null>(null);
  // Last opacity written per cloud, so a quiet frame touches no DOM at all.
  const lastFlash = useRef<number[]>([]);

  const theme = getTheme(dark);

  // Lightning only exists in the dark state; `lightning={false}` opts out.
  const lightningEnabled = dark && lightning !== false;
  const lightningCfg = resolveLightning(
    typeof lightning === 'object' ? lightning : undefined,
  );

  // Read by the frame callback so prop changes take effect without ever
  // resubscribing to the engine.
  const frameCfg = useRef<{ enabled: boolean; cfg: LightningConfig }>({
    enabled: lightningEnabled,
    cfg: lightningCfg,
  });
  frameCfg.current = { enabled: lightningEnabled, cfg: lightningCfg };

  // Flashing is a photosensitivity concern, so it is the one part of the
  // scene that reduced-motion switches off. Drifting is left alone.
  const reducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => { reducedMotion.current = e.matches; };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const engine = getAtmosphereEngine();
    if (!engine) return;
    const id = engineId.current!;

    engine.subscribe(id, (t) => {
      for (let i = 0; i < CLOUD_CONFIGS.length; i++) {
        const el = cloudRefs.current[i];
        if (!el) continue;
        const cloud = CLOUD_CONFIGS[i];
        // Position = f(global_time + per-cloud phase offset)
        // Identical to CSS: translateX(-100vw → +100vw) over `period` seconds.
        const elapsed = t + cloud.phaseOffset * cloud.period;
        const progress = (elapsed % cloud.period) / cloud.period;
        const x = -100 + progress * 200;
        el.style.transform = `translateX(${x.toFixed(3)}vw)`;
      }

      const { enabled, cfg } = frameCfg.current;
      const strike = enabled && !reducedMotion.current ? computeStrike(t, cfg) : null;

      for (let i = 0; i < CLOUD_CONFIGS.length; i++) {
        let value = 0;
        if (strike) {
          if (i === strike.cloudIndex) value = strike.intensity * cfg.peakOpacity;
          else if (i === strike.neighborIndex) value = strike.intensity * cfg.peakOpacity * 0.28;
        }
        // Round before comparing so imperceptible drift never touches the DOM.
        const next = Math.round(value * 1000) / 1000;
        if (lastFlash.current[i] === next) continue;
        lastFlash.current[i] = next;
        const g = flashRefs.current[i];
        if (g) g.style.opacity = String(next);
      }

      const bloom = skyFlashRef.current;
      if (bloom) {
        const v = strike ? Math.round(strike.intensity * cfg.skyOpacity * 1000) / 1000 : 0;
        if (bloom.style.opacity !== String(v)) bloom.style.opacity = String(v);
      }
      const bolt = boltRef.current;
      if (bolt) {
        const v = strike ? Math.round(strike.intensity * 1000) / 1000 : 0;
        if (bolt.style.opacity !== String(v)) bolt.style.opacity = String(v);
      }
    });

    return () => engine.unsubscribe(id);
  }, []); // empty: stable refs, engine is a singleton, config is read via refs

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Background atmosphere ── */}
      {theme.backdrops.map((background, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, background }} />
      ))}

      {/* ── Sky bloom — the room-lighting half of a strike ── */}
      {lightningEnabled && <div
        ref={skyFlashRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          willChange: 'opacity',
          background: `radial-gradient(ellipse 120% 80% at 50% 20%, ${theme.skyFlashColor} 0%, transparent 65%)`,
        }}
      />}

      {/* ── Drifting clouds ── */}
      {CLOUD_CONFIGS.map((cloud, i) => {
        const svgStyle: CSSProperties = {
          position: 'absolute',
          top: cloud.top,
          bottom: cloud.bottom,
          left: cloud.left,
          right: cloud.right,
          width: cloud.width,
          color: theme.cloudColors?.[i] ?? cloud.color,
          // GPU-composited transform — no layout involvement per frame
          willChange: 'transform',
          // Initial off-screen state — RAF fires on next frame and positions correctly
          transform: 'translateX(-100vw)',
        };

        const large = cloud.variant === 'large';

        return (
          <svg
            key={cloud.id}
            ref={(el) => { cloudRefs.current[i] = el; }}
            viewBox={large ? '0 0 200 100' : '0 0 120 60'}
            fill="none"
            aria-hidden="true"
            style={svgStyle}
          >
            <CloudShapes large={large} />
            {/*
              Illuminated core, mounted only when lightning is live so light
              mode carries no extra compositing layers. Inset via scale so the
              cloud's outer edge stays dark and the discharge reads as light
              *inside* the body rather than the whole shape blinking. Only its
              opacity changes per frame.
            */}
            {lightningEnabled && <g
              ref={(el) => { flashRefs.current[i] = el; }}
              transform={large ? 'translate(15,7.5) scale(0.85)' : 'translate(9,4.5) scale(0.85)'}
              style={{
                color: theme.flashColor,
                opacity: 0,
                mixBlendMode: 'screen',
                willChange: 'opacity',
              }}
            >
              <CloudShapes large={large} />
            </g>}
          </svg>
        );
      })}

      {/* ── Dev overlay ── */}
      {debug && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '3px 8px',
          background: theme.debugBackground,
          backdropFilter: 'blur(4px)',
          borderRadius: 4,
          fontSize: 10,
          color: theme.debugColor,
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}>
          ◎ nimbus-atmosphere{dark ? ' · dark' : ''}
          {lightningEnabled && (
            <span ref={boltRef} style={{ opacity: 0, marginLeft: 4 }}>⚡</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Cloud silhouette. Fills with `currentColor` so the caller sets the color. */
function CloudShapes({ large }: { large: boolean }) {
  return large ? (
    <>
      <ellipse cx="70"  cy="60" rx="60" ry="30" fill="currentColor" />
      <ellipse cx="120" cy="55" rx="50" ry="35" fill="currentColor" />
      <ellipse cx="50"  cy="65" rx="40" ry="22" fill="currentColor" />
      <ellipse cx="100" cy="40" rx="35" ry="28" fill="currentColor" />
      <ellipse cx="140" cy="62" rx="35" ry="20" fill="currentColor" />
    </>
  ) : (
    <>
      <ellipse cx="40" cy="35" rx="35" ry="18" fill="currentColor" />
      <ellipse cx="70" cy="30" rx="30" ry="22" fill="currentColor" />
      <ellipse cx="55" cy="25" rx="20" ry="16" fill="currentColor" />
    </>
  );
}
