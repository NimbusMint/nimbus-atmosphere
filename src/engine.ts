type UpdateFn = (elapsedSeconds: number) => void;

/**
 * Singleton RAF engine for the Nimbus atmospheric system.
 *
 * The epoch is set once at construction (first browser import) and NEVER
 * resets. Cloud positions are derived from wall-clock time since page load,
 * independent of React lifecycle. Navigation never causes positions to reset.
 *
 * The RAF loop is suspended when the browser tab is hidden (visibilitychange)
 * and resumed when it becomes visible. The epoch is never modified during
 * suspension — cloud positions resume at the correct time-derived location.
 */
class AtmosphereEngineImpl {
  private readonly epoch: number;
  private readonly subscribers = new Map<symbol, UpdateFn>();
  private rafHandle: number | null = null;

  constructor() {
    this.epoch = performance.now();
    // Only start the loop if the tab is already visible; avoids burning CPU
    // on pages opened in background tabs.
    if (!document.hidden) this.start();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  getElapsedSeconds = (): number => {
    return (performance.now() - this.epoch) / 1000;
  };

  subscribe = (id: symbol, cb: UpdateFn): void => {
    this.subscribers.set(id, cb);
  };

  unsubscribe = (id: symbol): void => {
    this.subscribers.delete(id);
  };

  private start = (): void => {
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(this.tick);
  };

  private stop = (): void => {
    if (this.rafHandle === null) return;
    cancelAnimationFrame(this.rafHandle);
    this.rafHandle = null;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  };

  private tick = (): void => {
    const t = this.getElapsedSeconds();
    this.subscribers.forEach(fn => fn(t));
    this.rafHandle = requestAnimationFrame(this.tick);
  };
}

// ── Browser-only module singleton ────────────────────────────────────────────
// The singleton is created lazily on first access. In SSR environments
// (Next.js server components, Node.js) window/performance are unavailable,
// so we return a no-op stub to prevent import-time crashes.

let _instance: AtmosphereEngineImpl | null = null;

export function getAtmosphereEngine(): AtmosphereEngineImpl | null {
  if (typeof window === 'undefined') return null;
  if (!_instance) _instance = new AtmosphereEngineImpl();
  return _instance;
}
