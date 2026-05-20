import type { CloudConfig } from './types';

/**
 * Six-cloud layout matching nimbus-fe page.tsx exactly.
 * Positions, sizes, colors, and phase offsets are the canonical
 * Nimbus atmospheric configuration — shared across all ecosystem apps.
 *
 * Phase offsets encode the original CSS animation-delay values
 * (0s, 1s, 2s, 3s, 5s, 8s) as fractions of the 120s period.
 */
export const CLOUD_CONFIGS: readonly CloudConfig[] = [
  {
    id: 0, variant: 'large',
    top: '8%', left: '5%',
    width: 192, color: 'rgba(186,230,253,0.70)',
    period: 120, phaseOffset: 0 / 120,
  },
  {
    id: 1, variant: 'small',
    top: '15%', right: '10%',
    width: 112, color: 'rgba(186,230,253,0.60)',
    period: 120, phaseOffset: 3 / 120,
  },
  {
    id: 2, variant: 'large',
    bottom: '12%', right: '3%',
    width: 224, color: 'rgba(224,242,254,0.60)',
    period: 120, phaseOffset: 5 / 120,
  },
  {
    id: 3, variant: 'small',
    bottom: '25%', left: '8%',
    width: 128, color: 'rgba(186,230,253,0.50)',
    period: 120, phaseOffset: 8 / 120,
  },
  {
    id: 4, variant: 'small',
    top: '45%', left: '2%',
    width: 96, color: 'rgba(224,242,254,0.50)',
    period: 120, phaseOffset: 2 / 120,
  },
  {
    id: 5, variant: 'large',
    top: '5%', right: '30%',
    width: 160, color: 'rgba(186,230,253,0.40)',
    period: 120, phaseOffset: 1 / 120,
  },
] as const;
