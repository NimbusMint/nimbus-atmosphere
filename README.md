# nimbus-atmosphere

Persistent animated atmospheric background for the Nimbus ecosystem. Renders drifting clouds and layered sky gradients as a `position: fixed` layer that survives route transitions without ever resetting.

## Features

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

## API

### `<AtmosphereLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `debug` | `boolean` | `false` | Renders a small dev overlay in the top-left corner showing engine status. |

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
import type { CloudConfig, AtmosphereLayerProps } from 'nimbus-atmosphere';
```
