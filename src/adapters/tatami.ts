/**
 * tatami(ComponentClass, options) — framework-agnostic lifecycle utility
 *
 * Instantiates any tatami-a11y component and returns a controller with a
 * stable `destroy()` and forwarded public instance methods. Works identically
 * from a React `useEffect`, Vue `onMounted`, Svelte `use:action`, or a plain
 * `<script>` tag — the framework only needs to know two things: call `tatami()`
 * when the DOM is ready, call `ctrl.destroy()` on cleanup.
 *
 * Unlike framework-specific wrappers, one function handles all 16 components.
 *
 * ## Instantiation contracts
 *
 * Fifteen of the sixteen components are instantiated with `new ComponentClass(options)`.
 * `Toast` is a static-only class — all its methods are called on the class itself, not
 * on instances. `tatami()` detects this at runtime: if the class has no instance
 * methods (all methods are on the constructor/class itself), it forwards static methods
 * directly instead.
 *
 * ## Method forwarding
 *
 * Forwarded methods are derived at runtime from the instantiated object (or, for
 * static classes, from the class itself). Every public method is forwarded except
 * `destroy`, which is handled by the controller's own `destroy()`. Private/internal
 * members (those whose names start with `_` or are preceded by TypeScript's `private`
 * keyword — observable only at the JS level as non-enumerable, underscore-prefixed, or
 * symbol keys) are excluded.
 *
 * ## Development-mode detection
 *
 * Dev-mode warnings (calling a forwarded method after `destroy()`, calling a method
 * that doesn't exist on the component) are controlled by a `DEV` flag resolved at
 * call time with this priority order:
 *
 * 1. **Manual override** — `setTatamiDebug(enabled)` always wins. This is the
 *    correct answer for bundler-free `<script>` tag usage, where no automatic
 *    detection is possible. Call `setTatamiDebug(true)` during development to
 *    enable warnings explicitly.
 * 2. **`import.meta.env?.DEV`** — works for Vite-based consumers.
 * 3. **`process.env.NODE_ENV !== "production"`** — fallback for webpack/Node-aware
 *    bundlers.
 * 4. **Default `false`** — if none of the above resolve to a definitive answer,
 *    silence-by-default is the safer failure mode than unexpectedly flooding a
 *    production console.
 *
 * @example — React
 * ```ts
 * import { tatami } from 'tatami-a11y/adapters/tatami.js';
 * useEffect(() => {
 *   const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
 *   return () => ctrl.destroy();
 * }, []);
 * ```
 *
 * @example — Vue
 * ```ts
 * import { tatami } from 'tatami-a11y/adapters/tatami.js';
 * let ctrl: ReturnType<typeof tatami>;
 * onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
 * onUnmounted(() => ctrl?.destroy());
 * ```
 *
 * @example — Svelte use: action
 * ```ts
 * import { tatami } from 'tatami-a11y/adapters/tatami.js';
 * export function dropdown(node: HTMLElement, { menu }: { menu: HTMLElement }) {
 *   const ctrl = tatami(Dropdown, { trigger: node, menu });
 *   return { destroy: () => ctrl.destroy() };
 * }
 * ```
 *
 * @example — plain JS, no framework
 * ```ts
 * import { tatami } from 'tatami-a11y/adapters/tatami.js';
 * const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
 * openBtn.addEventListener('click', () => ctrl.open());
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClass = new (...args: any[]) => object;
type StaticClass = { destroy?: () => void };

/** Resolved set of forwarded method names on the controller. */
type ForwardedMethods = Record<string, (...args: unknown[]) => unknown>;

/** The controller object returned by `tatami()`. */
export interface TatamiController extends ForwardedMethods {
  /** Destroy the component and release all listeners. Idempotent — safe to call more than once. */
  destroy(): void;
}

// ─── Dev-mode detection ──────────────────────────────────────────

let _manualDebugOverride: boolean | null = null;

/**
 * Manually enable or disable tatami dev-mode warnings.
 *
 * This is the only reliable way to get warnings in a bundler-free
 * `<script>` tag environment where `import.meta.env` and
 * `process.env.NODE_ENV` are both unavailable. It always takes
 * priority over automatic detection.
 */
export function setTatamiDebug(enabled: boolean): void {
  _manualDebugOverride = enabled;
}

declare const process: { env?: { NODE_ENV?: string } } | undefined;

function isDevMode(): boolean {
  if (_manualDebugOverride !== null) return _manualDebugOverride;
  // Vite provides import.meta.env.DEV at build time.
  // Access it safely because import.meta may not exist in all environments (e.g. jsdom).
  try {
    const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    if (metaEnv?.DEV === true) return true;
  } catch {
    // import.meta is not available in this environment
  }
  if (typeof process !== "undefined" && (process as unknown as { env?: { NODE_ENV?: string } }).env?.NODE_ENV !== "production") return true;
  return false;
}

/**
 * Determines whether `name` looks like a private or internal member.
 * Excludes: underscore-prefixed names, symbol keys, constructor, built-in Object
 * prototype methods, and anything that isn't a function.
 */
function isPublicMethod(name: string, value: unknown): boolean {
  if (typeof value !== "function") return false;
  if (name === "constructor" || name === "destroy") return false;
  if (name.startsWith("_")) return false;
  // Exclude names that are inherited from Object.prototype
  if (name in Object.prototype) return false;
  return true;
}

/**
 * Collect all public method names from an instance by walking its prototype chain
 * up to (but not including) Object.prototype.
 */
function collectInstanceMethods(instance: object): string[] {
  const names = new Set<string>();
  let proto = Object.getPrototypeOf(instance) as object | null;

  while (proto !== null && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      if (descriptor && isPublicMethod(name, descriptor.value)) {
        names.add(name);
      }
    }
    proto = Object.getPrototypeOf(proto) as object | null;
  }

  return [...names];
}

/**
 * Collect all public static method names from a class (static-only pattern, e.g. Toast).
 * Walks the class's own properties only — does not include inherited Function.prototype methods.
 */
function collectStaticMethods(klass: StaticClass): string[] {
  const names: string[] = [];
  for (const name of Object.getOwnPropertyNames(klass)) {
    const value = (klass as Record<string, unknown>)[name];
    if (isPublicMethod(name, value)) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Detect whether a class follows the static-only pattern.
 *
 * A class is considered "static-only" when its prototype has no enumerable or
 * own methods beyond `constructor` — meaning it was never designed to be
 * instantiated. Toast is the canonical example: every method is `static`.
 */
function isStaticOnlyClass(klass: AnyClass): boolean {
  const proto = klass.prototype as object;
  const ownNames = Object.getOwnPropertyNames(proto).filter(
    (n) => {
      if (n === "constructor") return false;
      const descriptor = Object.getOwnPropertyDescriptor(proto, n);
      return descriptor && "value" in descriptor && typeof descriptor.value === "function";
    },
  );
  return ownNames.length === 0;
}

// ─── tatami() ─────────────────────────────────────────────────────────────────

/**
 * Create a tatami controller for a tatami-a11y component.
 *
 * @param ComponentClass - The component class to instantiate (or a static-only class like Toast)
 * @param options - Options forwarded directly to the component constructor
 * @returns A controller with `destroy()` and all forwarded public methods
 */
export function tatami<O extends object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ComponentClass: (new (...args: any[]) => object) & StaticClass,
  options: O,
): TatamiController {
  const componentName = ComponentClass.name ?? "UnknownComponent";

  // ── Static-only path (Toast) ──────────────────────────────────────────────
  if (isStaticOnlyClass(ComponentClass)) {
    const staticMethods = collectStaticMethods(ComponentClass);

    const controller: TatamiController = {
      destroy() {
        (ComponentClass as StaticClass).destroy?.();
      },
    };

    for (const method of staticMethods) {
      controller[method] = (...args: unknown[]) => {
        return (ComponentClass as unknown as Record<string, unknown>)[method] instanceof Function
          ? (ComponentClass as unknown as Record<string, (...a: unknown[]) => unknown>)[method](...args)
          : undefined;
      };
    }

    return controller;
  }

  // ── Instance path (all other 15 components) ───────────────────────────────
  let instance: object | null = new ComponentClass(options as unknown);
  const instanceMethods = collectInstanceMethods(instance);

  let destroyed = false;

  const controller: TatamiController = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      // Call the component's destroy() with proper `this` binding.
      // Using a separate variable + typeof check lets TypeScript narrow
      // to Function (which has .call()), avoiding "Property 'call' does
      // not exist on type '{}'" errors from optional chaining.
      const inst = instance as Record<string, unknown> | null;
      const destroyMethod = inst?.["destroy"];
      if (typeof destroyMethod === "function") {
        destroyMethod.call(inst);
      }
      instance = null;
    },
  };

  for (const method of instanceMethods) {
    controller[method] = (...args: unknown[]) => {
      if (destroyed || instance === null) {
        if (isDevMode()) {
          console.warn(
            `[tatami] "${method}" was called on ${componentName} after destroy() — this is a no-op. ` +
            `Check that you are not calling controller methods after the component has been cleaned up.`,
          );
        }
        return undefined;
      }

      const fn = (instance as Record<string, unknown>)[method];
      if (typeof fn !== "function") {
        if (isDevMode()) {
          console.warn(
            `[tatami] "${method}" does not exist on ${componentName}. ` +
            `Available methods: ${instanceMethods.join(", ")}`,
          );
        }
        return undefined;
      }

      return (fn as (...a: unknown[]) => unknown).apply(instance, args);
    };
  }

  // ── Dynamic proxy for typo detection (dev only) ───────────────────────────
  // If a consumer calls a method that was never on the component at all, the
  // controller property will be undefined (not a forwarded wrapper). Provide a
  // clear warning in that case by using a Proxy in development.
  // Underscore-prefixed properties are treated as private and return undefined
  // silently, matching the isPublicMethod convention.
  if (isDevMode() && typeof Proxy !== "undefined") {
    return new Proxy(controller, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (
          typeof prop === "string" &&
          prop !== "destroy" &&
          !instanceMethods.includes(prop) &&
          value === undefined &&
          !prop.startsWith("_")
        ) {
          return (..._args: unknown[]) => {
            console.warn(
              `[tatami] "${prop}" is not a method on ${componentName}. ` +
              `Available methods: ${instanceMethods.join(", ")}`,
            );
            return undefined;
          };
        }
        return value;
      },
    }) as TatamiController;
  }

  return controller;
}
