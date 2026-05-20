type UpdateFn = (elapsedSeconds: number) => void;

/**
 * Singleton RAF engine for the Nimbus atmospheric system.
 *
 * The epoch is set once at construction (first browser import) and NEVER
 * resets. This means cloud positions are always derived from wall-clock time
 * since page load, independent of React component lifecycle. When a component
 * unmounts and remounts (e.g. during route navigation), it resubscribes and
 * receives the current elapsed time — clouds continue from where they were.
 */
class AtmosphereEngineImpl {
  private readonly epoch: number;
  private readonly subscribers = new Map<symbol, UpdateFn>();

  constructor() {
    this.epoch = performance.now();
    // RAF loop starts immediately and runs for the page's lifetime.
    // It is intentionally never stopped — cloud positions must always be live.
    requestAnimationFrame(this.tick);
  }

  getElapsedSeconds = (): number => {
    return (performance.now() - this.epoch) / 1000;
  };

  /** Register a callback that receives elapsed seconds each animation frame. */
  subscribe = (id: symbol, cb: UpdateFn): void => {
    this.subscribers.set(id, cb);
  };

  /**
   * Remove a callback. The engine itself keeps running so that the epoch
   * remains continuous for the next mount of any AtmosphereLayer instance.
   */
  unsubscribe = (id: symbol): void => {
    this.subscribers.delete(id);
  };

  private tick = (): void => {
    const t = this.getElapsedSeconds();
    this.subscribers.forEach(fn => fn(t));
    requestAnimationFrame(this.tick);
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
