/**
 * HMR-safe singleton factory.
 *
 * During development with Vite/Next.js hot module reload, singletons can
 * duplicate if the module is re-evaluated without cleanup. This factory
 * queries for an existing instance on the global window object before creating
 * a new one, and swaps out any cleanup functions on reload.
 *
 * @template T - The singleton instance type
 * @param factory - Function that creates a new instance
 * @param key - Unique key to store the instance on window
 * @returns The singleton instance
 */
export const createSingleton = <T>(factory: () => T, key: string = "__singleton__"): T => {
  if (typeof window === "undefined") {
    return factory();
  }

  const existing = (window as unknown as Record<string, unknown>)[key] as {
    instance?: T;
    cleanup?: () => void;
  };

  if (existing?.instance) {
    return existing.instance;
  }

  const instance = factory();
  (window as unknown as Record<string, unknown>)[key] = { instance };

  return instance;
};

/**
 * Register a cleanup function to run when the singleton is replaced during HMR.
 *
 * @param key - The singleton's unique key
 * @param cleanup - Function to run before replacement
 */
export const registerCleanup = (key: string, cleanup: () => void): void => {
  if (typeof window === "undefined") return;

  const existing = (window as unknown as Record<string, unknown>)[key] as {
    instance?: unknown;
    cleanup?: () => void;
  };

  if (existing) {
    existing.cleanup?.();
    existing.cleanup = cleanup;
  }
};
