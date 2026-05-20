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

export interface AtmosphereLayerProps {
  /** Renders a dev overlay with engine status. Default: false. */
  debug?: boolean;
}
