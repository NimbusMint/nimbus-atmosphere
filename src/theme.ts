import type { AtmosphereTheme } from './types';

/**
 * Palettes for the atmospheric layer.
 *
 * Both themes describe the exact same scene — the same gradient stack, the
 * same six clouds, the same geometry. Only the colors differ, so switching
 * `dark` on never moves anything; the sky just changes state.
 *
 * `backdrops` are painted as stacked full-bleed layers, first entry lowest.
 * `cloudColors` is indexed to CLOUD_CONFIGS; an entry of `null` falls back to
 * the color declared on the CloudConfig itself.
 */

export const LIGHT_THEME: AtmosphereTheme = {
  backdrops: [
    // Sky-to-white linear gradient (top → bottom)
    'linear-gradient(to bottom, #f0f9ff 0%, rgba(255,255,255,0) 40%)',
    // Centered top radial glow — replicates nimbus-fe's blur-3xl sky-100/40 element
    'radial-gradient(ellipse 95% 90% at 50% -10%, rgba(224,242,254,0.45) 0%, transparent 70%)',
    // Mint + sky side atmospheric accents
    [
      'radial-gradient(ellipse 50% 50% at 10% 90%, rgba(78,205,196,0.10) 0%, transparent 70%)',
      'radial-gradient(ellipse 40% 30% at 90% 60%, rgba(56,189,248,0.08) 0%, transparent 60%)',
    ].join(', '),
  ],
  cloudColors: null,
  flashColor: 'rgba(255,255,255,0)',
  skyFlashColor: 'rgba(255,255,255,0)',
  debugBackground: 'rgba(0,0,0,0.10)',
  debugColor: 'rgba(0,0,0,0.45)',
};

export const DARK_THEME: AtmosphereTheme = {
  backdrops: [
    // Deep night sky fading into the page background
    'linear-gradient(to bottom, #0b1220 0%, rgba(11,18,32,0) 45%)',
    // Overcast haze pressing down from above
    'radial-gradient(ellipse 95% 90% at 50% -10%, rgba(30,41,59,0.55) 0%, transparent 70%)',
    // The same mint + sky accents, dimmed to a night reading
    [
      'radial-gradient(ellipse 50% 50% at 10% 90%, rgba(45,212,191,0.07) 0%, transparent 70%)',
      'radial-gradient(ellipse 40% 30% at 90% 60%, rgba(56,189,248,0.06) 0%, transparent 60%)',
    ].join(', '),
  ],
  // Indexed to CLOUD_CONFIGS — storm-slate, keeping each cloud's relative weight
  cloudColors: [
    'rgba(51,65,85,0.62)',
    'rgba(51,65,85,0.52)',
    'rgba(71,85,105,0.52)',
    'rgba(51,65,85,0.44)',
    'rgba(71,85,105,0.42)',
    'rgba(51,65,85,0.34)',
  ],
  // Cool white-blue core light, as if the discharge is inside the cloud body
  flashColor: 'rgba(199,228,255,1)',
  skyFlashColor: 'rgba(186,220,255,1)',
  debugBackground: 'rgba(255,255,255,0.08)',
  debugColor: 'rgba(226,232,240,0.55)',
};

export function getTheme(dark: boolean): AtmosphereTheme {
  return dark ? DARK_THEME : LIGHT_THEME;
}
