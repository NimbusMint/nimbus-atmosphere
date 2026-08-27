export interface CloudConfig {
  id: number;
  variant: 'large' | 'small';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width: number;
  color: string;
  /** Full cycle duration in seconds */
  period: number;
  /**
   * Fraction of `period` to add as an initial offset so clouds are staggered
   * across their cycle at t=0. Range [0, 1).
   */
  phaseOffset: number;
}

/** Colors for one atmospheric state. Geometry is shared; only color varies. */
export interface AtmosphereTheme {
  /** Full-bleed background layers, painted in order (first = lowest). */
  backdrops: readonly string[];
  /**
   * Per-cloud fill colors, indexed to CLOUD_CONFIGS. `null` uses each
   * CloudConfig's own `color`.
   */
  cloudColors: readonly string[] | null;
  /** Color the cloud body is lit with during a strike. */
  flashColor: string;
  /** Color of the faint sky bloom during a strike. */
  skyFlashColor: string;
  debugBackground: string;
  debugColor: string;
}

export interface LightningConfig {
  /** Seconds after page load before any strike may fire. Default: 20. */
  warmupSeconds: number;
  /** Length of each scheduling slot in seconds. Default: 45. */
  intervalSeconds: number;
  /** Probability a given slot contains a strike at all. Default: 0.65. */
  strikeChance: number;
  /** Length of one flash sequence in seconds. Default: 0.9. */
  durationSeconds: number;
  /** Peak opacity of the lit cloud core. Default: 0.5. */
  peakOpacity: number;
  /** Peak opacity of the ambient sky bloom. Default: 0.045. */
  skyOpacity: number;
  /** Indices into CLOUD_CONFIGS that are allowed to flash. Default: [0, 2, 5]. */
  cloudIndices: readonly number[];
}

/** Resolved lightning state for a single frame. */
export interface Strike {
  /** Index into CLOUD_CONFIGS of the cloud containing the discharge. */
  cloudIndex: number;
  /** A second cloud catching a dim reflection, or null. */
  neighborIndex: number | null;
  /** Envelope value in [0, 1]; multiply into peak opacities. */
  intensity: number;
}

export interface AtmosphereLayerProps {
  /** Renders a dev overlay with engine status. Default: false. */
  debug?: boolean;
  /**
   * Puts the atmosphere into its dark state — night sky gradients, dimmed
   * accents, storm-slate clouds — and enables infrequent lightning inside
   * the clouds. Default: false.
   */
  dark?: boolean;
  /**
   * Lightning control. Only applies in dark mode.
   * `false` disables it; an object overrides individual DEFAULT_LIGHTNING
   * fields. Default: enabled with defaults.
   */
  lightning?: boolean | Partial<LightningConfig>;
}
