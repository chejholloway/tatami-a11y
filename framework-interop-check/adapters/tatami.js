/**
 * tatami(ComponentClass, options) — framework-agnostic lifecycle utility
 *
 * Instantiates any tatami-a11y component and returns a Controller with a
 * stable destroy() and forwarded instance methods. Works identically from a
 * React useEffect, Vue onMounted, Svelte use: action, or a plain <script> tag.
 *
 * Unlike framework-specific wrappers, this is one function for all 16 components.
 * The framework only needs to know two things: call tatami() when the DOM is
 * ready, call ctrl.destroy() on cleanup.
 *
 * @example — React
 *   import { tatami } from '../../adapters/tatami.js';
 *   useEffect(() => {
 *     const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
 *     return () => ctrl.destroy();
 *   }, []);
 *
 * @example — Vue
 *   import { tatami } from '../../adapters/tatami.js';
 *   let ctrl;
 *   onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
 *   onUnmounted(() => ctrl?.destroy());
 *
 * @example — Svelte use: action
 *   import { tatami } from '../../adapters/tatami.js';
 *   export function dropdown(node, { menu }) {
 *     const ctrl = tatami(Dropdown, { trigger: node, menu });
 *     return { destroy: () => ctrl.destroy() };
 *   }
 *
 * @example — plain JS, no framework
 *   import { tatami } from '../../adapters/tatami.js';
 *   const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
 *   openBtn.addEventListener('click', () => ctrl.open());
 */
export function tatami(ComponentClass, options) {
  let instance = new ComponentClass(options);

  const controller = {
    /**
     * Destroy the component instance and release all listeners.
     * Safe to call more than once — subsequent calls are no-ops.
     */
    destroy() {
      instance?.destroy?.();
      instance = null;
    },
  };

  // Forward every known public method name as a delegating function.
  // Silently no-ops if the underlying instance doesn't have that method,
  // or after destroy() has been called.
  const FORWARDED = [
    'open', 'close', 'toggle',
    'expand', 'collapse',
    'show', 'hide',
    'enable', 'disable',
    'focus', 'reset',
    'next', 'prev',
    'selectTab', 'activateTab',
  ];

  for (const method of FORWARDED) {
    controller[method] = (...args) => instance?.[method]?.(...args);
  }

  return controller;
}
