/**
 * Roving tabindex navigation primitive.
 *
 * Manages the WAI-ARIA roving tabindex pattern for lists and grids:
 * exactly one child has tabindex="0", all others have tabindex="-1".
 * Arrow keys move focus between items.
 *
 * Supports:
 *   - Vertical lists (ArrowUp/ArrowDown)
 *   - Horizontal lists (ArrowLeft/ArrowRight)
 *   - Grids (ArrowUp/Down moves by column count, ArrowLeft/Right by 1)
 *   - Home/End navigation
 *   - Custom key overrides via beforeKey callback
 *   - Dynamic item list changes via refresh()
 */

export interface RovingTabindexOptions {
  /** The container element that receives keyboard events */
  container: HTMLElement;
  /** CSS selector for focusable child items */
  selector: string;
  /** Navigation direction. Defaults to 'vertical' */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** For grid layouts: number of columns (ArrowDown = +columns, ArrowUp = -columns) */
  columns?: number;
  /** Wrap around at boundaries (first→last, last→first). Defaults to true */
  wrap?: boolean;
  /** Called when the active index changes, after tabindex is updated */
  onActiveChange?: (index: number, element: HTMLElement) => void;
  /**
   * Called before each key is handled. Return true to prevent default handling
   * (the component handles it instead). Receives the original event and the
   * current active index.
   */
  beforeKey?: (e: KeyboardEvent, activeIndex: number) => boolean;
}

export interface RovingTabindexController {
  readonly activeIndex: number;
  /** Get current list of matching child elements */
  getItems(): HTMLElement[];
  /** Set the active item by index and optionally focus it */
  setActiveIndex(index: number, focus?: boolean): void;
  /** Refresh the cached item list (call after children change) */
  refresh(): void;
  /** Remove keyboard listener and clean up */
  destroy(): void;
}

/**
 * Creates a roving tabindex controller for the given container.
 *
 * Manages the WAI-ARIA roving tabindex pattern: exactly one child element has
 * {@code tabindex="0"} at any time, while all others have {@code tabindex="-1"}.
 * Arrow keys, Home, and End navigate between items.
 *
 * @param options - Configuration for the roving tabindex
 * @returns A controller object for managing the roving tabindex
 *
 * @example
 * ```typescript
 * const roving = createRovingTabindex({
 *   container: myList,
 *   selector: '[role="tab"]',
 *   orientation: 'horizontal',
 * });
 * ```
 */
export function createRovingTabindex(options: RovingTabindexOptions): RovingTabindexController {
  const {
    container,
    selector,
    columns = 0,
    orientation = columns > 0 ? 'both' : 'vertical',
    wrap = true,
  } = options;

  let items = queryItems();
  let activeIndex = findInitialIndex();

  const keyHandler = (e: KeyboardEvent): void => {
    // Give the component first dibs
    if (options.beforeKey?.(e, activeIndex)) return;

    if (items.length === 0) return;

    let handled = true;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          moveBy(columns > 0 ? columns : 1);
        } else {
          handled = false;
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          moveBy(-(columns > 0 ? columns : 1));
        } else {
          handled = false;
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          moveBy(1);
        } else {
          handled = false;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          moveBy(-1);
        } else {
          handled = false;
        }
        break;

      case 'Home':
        e.preventDefault();
        goTo(0);
        break;

      case 'End':
        e.preventDefault();
        goTo(items.length - 1);
        break;

      default:
        handled = false;
    }

    if (handled) {
      refresh(); // Re-query in case DOM changed during handler
    }
  };

  container.addEventListener('keydown', keyHandler);

  // Set initial tabindex
  applyTabindex();

  return {
    get activeIndex() { return activeIndex; },

    getItems(): HTMLElement[] {
      return [...items];
    },

    setActiveIndex(index: number, focus: boolean = true): void {
      if (index < 0 || index >= items.length) return;
      activeIndex = index;
      applyTabindex();
      if (focus) {
        items[activeIndex].focus();
      }
      options.onActiveChange?.(activeIndex, items[activeIndex]);
    },

    refresh,

    destroy(): void {
      container.removeEventListener('keydown', keyHandler);
      items = [];
      activeIndex = -1;
    },
  };

  // ─── Internal helpers ──────────────────────────────────────────────────────

  function refresh(): void {
    items = queryItems();
    if (activeIndex >= items.length) {
      activeIndex = items.length > 0 ? items.length - 1 : -1;
    }
    applyTabindex();
  }

  function queryItems(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(selector));
  }

  function findInitialIndex(): number {
    const idx = items.findIndex(el => el.getAttribute('tabindex') === '0');
    return idx >= 0 ? idx : 0;
  }

  function applyTabindex(): void {
    items.forEach((el, i) => {
      el.setAttribute('tabindex', i === activeIndex ? '0' : '-1');
    });
  }

  function moveBy(delta: number): void {
    const next = wrap
      ? ((activeIndex + delta) % items.length + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, activeIndex + delta));

    if (next !== activeIndex) {
      activeIndex = next;
      applyTabindex();
      items[activeIndex].focus();
      options.onActiveChange?.(activeIndex, items[activeIndex]);
    }
  }

  function goTo(index: number): void {
    if (index >= 0 && index < items.length && index !== activeIndex) {
      activeIndex = index;
      applyTabindex();
      items[activeIndex].focus();
      options.onActiveChange?.(activeIndex, items[activeIndex]);
    }
  }
}
