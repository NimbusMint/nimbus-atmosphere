# nimbus-atmosphere

Persistent animated atmospheric background for the Nimbus ecosystem. Renders drifting clouds and layered sky gradients as a `position: fixed` layer that survives route transitions without ever resetting.

## Features

- **Two states** — the same scene in light or dark. `dark` swaps the sky gradients, atmospheric accents, and cloud fills; nothing moves or re-times.
- **Lightning** — in dark mode, clouds occasionally light from within. Roughly one strike a minute or two, ~0.9s each, on a schedule derived from elapsed time so it is navigation-stable like everything else.
- **Navigation-stable** — cloud positions are derived from `performance.now()` since page load, not from component mount time. Navigating never causes a position snap or reset.
- **Tab-aware** — the RAF loop suspends automatically when the tab is hidden and resumes at the correct time-derived position when it becomes visible again.
- **SSR-safe** — returns a no-op stub in server environments (Next.js server components, Node.js). No `window`/`performance` crashes at import time.
- **GPU-composited** — all cloud movement uses `transform: translateX(...)` with `will-change: transform`. Zero layout work per frame.
- **Zero dependencies** — React 18+ is the only peer dependency.

## Installation

```bash
npm install nimbus-atmosphere
```

**Peer dependencies** (must be installed in your app):

```bash
npm install react@>=18
```

## Usage

Mount `AtmosphereLayer` once in your root layout, before page content. It renders as `position: fixed` and stays in place for the lifetime of the page.

### Next.js App Router

```tsx
// app/layout.tsx
import { AtmosphereLayer } from 'nimbus-atmosphere';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AtmosphereLayer />
        {children}
      </body>
    </html>
  );
}
```

### Any React app

```tsx
// index.tsx or App.tsx
import { AtmosphereLayer } from 'nimbus-atmosphere';

function App() {
  return (
    <>
      <AtmosphereLayer />
      <main>{/* your content */}</main>
    </>
  );
}
```

## Dark mode

The component holds no theme state of its own — drive `dark` from whatever already decides your app's theme:

```tsx
<AtmosphereLayer dark={theme === 'dark'} />
```

Toggling it mid-session is safe: cloud positions come from the engine clock, so only colors change.

In dark mode, a strike lights one cloud from the inside — an inset core in the
cloud's own silhouette, plus a dim reflection on a second cloud and a very faint
sky bloom. The envelope is a leading stroke, one or two return flickers, and a
short afterglow.

It is tuned to stay out of the way. With the defaults, a strike fires roughly
every 70 seconds on average — gaps range from about 10 seconds to three minutes —
and the sky is lit for well under 1% of frames. Nothing fires in the first 20
seconds after load, when the reader is still finding the page.

The schedule is a pure function of elapsed time, not `Math.random()`. Time is cut
into `intervalSeconds` slots; each slot either stays quiet or holds one strike at
a hashed offset. Remounting, navigating, or suspending the loop in a hidden tab
cannot desynchronize it or dump a burst of missed strikes on resume.

Flashing is switched off entirely when the user has `prefers-reduced-motion:
reduce` set. Cloud drift is left alone.

```tsx
// Rarer and dimmer
<AtmosphereLayer dark lightning={{ intervalSeconds: 90, peakOpacity: 0.35 }} />

// Dark sky, no lightning at all
<AtmosphereLayer dark lightning={false} />
```

## API

### `<AtmosphereLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `debug` | `boolean` | `false` | Renders a small dev overlay in the top-left corner showing engine status. |
| `dark` | `boolean` | `false` | Puts the atmosphere into its dark state — night sky gradients, dimmed accents, storm-slate clouds — and enables lightning. |
| `lightning` | `boolean \| Partial<LightningConfig>` | `true` | Only applies in dark mode. `false` disables flashes; an object overrides individual `DEFAULT_LIGHTNING` fields. |

### `LightningConfig`

| Field | Default | Description |
|-------|---------|-------------|
| `warmupSeconds` | `20` | Seconds after page load before any strike may fire. |
| `intervalSeconds` | `45` | Length of each scheduling slot. |
| `strikeChance` | `0.65` | Probability a given slot contains a strike at all. |
| `durationSeconds` | `0.9` | Length of one flash sequence. |
| `peakOpacity` | `0.5` | Peak opacity of the lit cloud core. |
| `skyOpacity` | `0.045` | Peak opacity of the ambient sky bloom. |
| `cloudIndices` | `[0, 2, 5]` | Which `CLOUD_CONFIGS` entries may flash — the three large clouds. |

`computeStrike(elapsedSeconds, config)` is exported if you want to drive your own
element from the same schedule; it returns `Strike | null`.

### `getAtmosphereEngine()`

Returns the singleton `AtmosphereEngineImpl` in browser environments, or `null` in SSR. Use this if you need to hook your own animation into the same RAF loop.

```ts
import { getAtmosphereEngine } from 'nimbus-atmosphere';

const engine = getAtmosphereEngine();
if (engine) {
  const id = Symbol('my-animation');
  engine.subscribe(id, (elapsedSeconds) => {
    // runs every frame, synchronized with cloud movement
  });
  // later:
  engine.unsubscribe(id);
}
```

### `CLOUD_CONFIGS`

The canonical six-cloud configuration used by `AtmosphereLayer`. Positions, sizes, colors, and phase offsets match the original Nimbus design system. Import it if you need to reference the layout in your own components.

```ts
import { CLOUD_CONFIGS } from 'nimbus-atmosphere';
// readonly CloudConfig[]
```

### `LIGHT_THEME` / `DARK_THEME` / `getTheme(dark)`

The two palettes — background layers, per-cloud fills, flash colors, and debug
overlay colors. Import them to match surrounding UI to the sky.

## How it works

The engine is a module-level singleton created on first import. Its `epoch` is set once to `performance.now()` and never changes. Each animation frame, every subscriber receives `(performance.now() - epoch) / 1000` as `elapsedSeconds`.

Each cloud's horizontal position is computed as:

```
progress = ((elapsedSeconds + phaseOffset * period) % period) / period
x = -100vw + progress * 200vw   // sweeps left-to-right across the viewport
```

Phase offsets encode the original CSS `animation-delay` values as fractions of the 120-second period, so clouds are staggered at `t=0` exactly as they were in the original CSS implementation.

## TypeScript

Full types are included. No `@types/` package needed.

```ts
import type {
  CloudConfig,
  AtmosphereLayerProps,
  AtmosphereTheme,
  LightningConfig,
  Strike,
} from 'nimbus-atmosphere';
```
