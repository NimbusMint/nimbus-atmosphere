import type { LightningConfig, Strike } from './types';

/**
 * Deterministic, time-derived lightning schedule.
 *
 * Like cloud position, a strike is a pure function of elapsed time — no
 * Math.random(), no accumulated state. Navigating, remounting, or suspending
 * the RAF loop in a hidden tab cannot desynchronize it or fire a burst of
 * missed strikes on resume.
 *
 * Time is divided into `intervalSeconds` slots. Each slot either stays quiet
 * or contains exactly one strike, placed at a hashed offset that always leaves
 * room for the flash to finish inside the slot. Consecutive strikes can
 * therefore land anywhere from back-to-back to two-plus intervals apart, which
 * reads as weather rather than as a metronome.
 */

export const DEFAULT_LIGHTNING: LightningConfig = {
  warmupSeconds: 20,
  intervalSeconds: 45,
  strikeChance: 0.65,
  durationSeconds: 0.9,
  peakOpacity: 0.5,
  skyOpacity: 0.045,
  cloudIndices: [0, 2, 5], // the three large clouds
};

/** Integer hash → [0, 1). Deterministic across reloads and machines. */
function hash01(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Flash envelope over u ∈ [0, 1] (fraction of `durationSeconds`).
 *
 * A leading stroke, one or two return flickers, and a soft afterglow — the
 * shape of a real discharge rather than a single fade. Tapered so it is
 * exactly 0 at u = 1 and never leaves a cloud stuck lit.
 */
function envelope(u: number, seed: number): number {
  if (u < 0 || u >= 1) return 0;

  // Decaying spike starting at `at`
  const spike = (at: number, decay: number) =>
    u < at ? 0 : Math.exp(-(u - at) / decay);

  let v = 0.55 * spike(0.0, 0.035);
  v += 0.9 * spike(0.06 + seed * 0.05, 0.05);
  // Third flicker on roughly half of all strikes — some are single-stroke
  if (seed > 0.5) v += 0.4 * spike(0.19 + seed * 0.06, 0.09);
  // Afterglow inside the cloud as the channel cools
  v += 0.16 * Math.exp(-u / 0.3);

  const taper = (1 - u) * (1 - u);
  return Math.min(1, v) * taper;
}

/**
 * Resolve the strike state at `t` seconds of elapsed engine time.
 * Returns `null` when nothing is firing, which is the overwhelming majority
 * of frames.
 *
 * `since` is the elapsed time at which lightning became live. It matters when
 * dark mode is entered mid-session: the schedule runs off the engine clock, so
 * without this a strike already halfway through its envelope would appear the
 * instant the flash nodes mount — a pop at mid-brightness rather than a stroke.
 * Strikes that began before `since` are skipped; the next one fires normally.
 */
export function computeStrike(t: number, cfg: LightningConfig, since = 0): Strike | null {
  const floor = Math.max(cfg.warmupSeconds, since);
  if (t < floor || cfg.cloudIndices.length === 0) return null;
  if (cfg.intervalSeconds <= 0 || cfg.durationSeconds <= 0) return null;

  const slot = Math.floor(t / cfg.intervalSeconds);
  if (hash01(slot * 3 + 1) >= cfg.strikeChance) return null;

  // Keep the whole flash inside its slot so only one slot is ever live.
  const window = Math.max(0, cfg.intervalSeconds - cfg.durationSeconds);
  const start = slot * cfg.intervalSeconds + hash01(slot * 5 + 2) * window;

  // A flash in the first seconds after load is the most distracting one there
  // is — the reader is still finding the page. Skip it entirely. Same for one
  // already in flight when lightning went live.
  if (start < floor) return null;

  const u = (t - start) / cfg.durationSeconds;
  if (u < 0 || u >= 1) return null;

  const seed = hash01(slot * 7 + 3);
  const intensity = envelope(u, seed);
  if (intensity <= 0.001) return null;

  const pick = hash01(slot * 11 + 4);
  const cloudIndex = cfg.cloudIndices[Math.floor(pick * cfg.cloudIndices.length) % cfg.cloudIndices.length];

  // A second cloud catches a dim reflection of the same discharge, so a strike
  // reads as weather across the sky rather than one blinking shape.
  let neighborIndex: number | null = null;
  if (cfg.cloudIndices.length > 1) {
    const offset = 1 + Math.floor(hash01(slot * 13 + 5) * (cfg.cloudIndices.length - 1));
    neighborIndex = cfg.cloudIndices[(cfg.cloudIndices.indexOf(cloudIndex) + offset) % cfg.cloudIndices.length];
  }

  return { cloudIndex, neighborIndex, intensity };
}

/** Merge a partial override onto the defaults. */
export function resolveLightning(
  override: Partial<LightningConfig> | undefined,
): LightningConfig {
  return override ? { ...DEFAULT_LIGHTNING, ...override } : DEFAULT_LIGHTNING;
}
