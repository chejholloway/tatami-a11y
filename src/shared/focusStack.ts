/**
 * Focus stack restoration logic.
 *
 * Manages a stack of focus targets for transient UI components that temporarily
 * steal focus and need to restore it correctly on exit. Skips stale entries
 * (elements removed from DOM) and falls through to blur as last resort.
 */

const MAX_STACK_SIZE = 20;

/**
 * A single entry in the focus restoration stack.
 * Each entry is an {@link HTMLElement} that should receive focus when popped.
 */
type FocusStackEntry = HTMLElement;

let focusStack: FocusStackEntry[] = [];
let initialFocusReference: HTMLElement | null = null;

/**
 * Push an element onto the focus stack.
 *
 * @param element - The element to push
 */
export const pushFocusStack = (element: HTMLElement): void => {
  focusStack.push(element);

  // Cap the stack size to prevent unbounded growth
  if (focusStack.length > MAX_STACK_SIZE) {
    focusStack.shift();
  }
};

/**
 * Pop and restore focus from the stack.
 *
 * Skips stale entries (elements no longer in DOM) and falls through to
 * the initial focus reference or body if needed.
 */
export const popFocusStack = (): void => {
  let restored = false;

  // Try to restore from stack, skipping stale entries
  while (focusStack.length > 0 && !restored) {
    const candidate = focusStack.pop();
    if (candidate?.isConnected) {
      candidate.focus();
      restored = true;
    }
  }

  // Fall through to initial reference if stack was empty or all stale
  if (!restored && initialFocusReference?.isConnected) {
    initialFocusReference.focus();
    restored = true;
  }

  // Last resort: release focus to body (blur active element)
  if (!restored) {
    (document.activeElement as HTMLElement)?.blur();
  }
};

/**
 * Set the initial focus reference.
 *
 * This is the element that had focus before any transient UI stole it.
 *
 * @param element - The element to set as initial reference
 */
export const setInitialFocusReference = (element: HTMLElement): void => {
  initialFocusReference = element;
};

/**
 * Clear the focus stack.
 *
 * Useful for cleanup or when the entire stack should be discarded.
 */
export const clearFocusStack = (): void => {
  focusStack = [];
};
