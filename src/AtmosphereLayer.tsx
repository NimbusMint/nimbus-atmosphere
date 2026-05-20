'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { getAtmosphereEngine } from './engine';
import { CLOUD_CONFIGS } from './config';
import type { AtmosphereLayerProps } from './types';

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
 */
export function AtmosphereLayer({ debug = false }: AtmosphereLayerProps) {
  // Stable per-instance ID persists across re-renders but is created once.
  const engineId = useRef<symbol | null>(null);
  if (engineId.current === null) engineId.current = Symbol('atmosphere');

  const cloudRefs = useRef<(SVGSVGElement | null)[]>([]);

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
    });

    return () => engine.unsubscribe(id);
  }, []); // empty: stable refs, engine is a singleton, CLOUD_CONFIGS is const

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

      {/* Sky-to-white linear gradient (top → bottom) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, #f0f9ff 0%, rgba(255,255,255,0) 40%)',
      }} />

      {/* Centered top radial glow — replicates nimbus-fe's blur-3xl sky-100/40 element */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 95% 90% at 50% -10%, rgba(224,242,254,0.45) 0%, transparent 70%)',
      }} />

      {/* Mint + sky side atmospheric accents */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse 50% 50% at 10% 90%, rgba(78,205,196,0.10) 0%, transparent 70%)',
          'radial-gradient(ellipse 40% 30% at 90% 60%, rgba(56,189,248,0.08) 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* ── Drifting clouds ── */}
      {CLOUD_CONFIGS.map((cloud, i) => {
        const svgStyle: CSSProperties = {
          position: 'absolute',
          top: cloud.top,
          bottom: cloud.bottom,
          left: cloud.left,
          right: cloud.right,
          width: cloud.width,
          color: cloud.color,
          // GPU-composited transform — no layout involvement per frame
          willChange: 'transform',
          // Initial off-screen state — RAF fires on next frame and positions correctly
          transform: 'translateX(-100vw)',
        };

        return (
          <svg
            key={cloud.id}
            ref={(el) => { cloudRefs.current[i] = el; }}
            viewBox={cloud.variant === 'large' ? '0 0 200 100' : '0 0 120 60'}
            fill="none"
            aria-hidden="true"
            style={svgStyle}
          >
            {cloud.variant === 'large' ? (
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
            )}
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
          background: 'rgba(0,0,0,0.10)',
          backdropFilter: 'blur(4px)',
          borderRadius: 4,
          fontSize: 10,
          color: 'rgba(0,0,0,0.45)',
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}>
          ◎ nimbus-atmosphere
        </div>
      )}
    </div>
  );
}
