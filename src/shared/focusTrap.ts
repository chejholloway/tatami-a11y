/**
 * Focus trap implementation for modal/dialog components.
 *
 * Traps focus within a container element, ensuring Tab/Shift+Tab cycles
 * through focusable elements without escaping. Handles dynamically added/removed
 * focusable children.
 */

/**
 * Get all focusable elements within a container.
 *
 * @param container - The container element
 * @returns Array of focusable elements
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
};

/**
 * Get the first and last focusable elements.
 *
 * @param container - The container element
 * @returns Object with first and last focusable elements
 */
const getFocusBoundary = (
  container: HTMLElement,
): { first: HTMLElement | null; last: HTMLElement | null } => {
  const focusable = getFocusableElements(container);

  return {
    first: focusable[0] ?? null,
    last: focusable[focusable.length - 1] ?? null,
  };
};

/**
 * Handle Tab key press to trap focus.
 *
 * @param event - The keyboard event
 * @param container - The container element
 */
const handleTabKey = (event: KeyboardEvent, container: HTMLElement): void => {
  const { first, last } = getFocusBoundary(container);

  if (!first || !last) return;

  if (event.shiftKey) {
    // Shift+Tab: wrap from first to last
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else {
    // Tab: wrap from last to first
    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
};

/**
 * Internal state for the focus trap.
 */
type FocusTrapState = {
  /** The container element currently trapping focus, or null if inactive. */
  container: HTMLElement | null;
  /** The element that had focus before the trap was activated. */
  previousActiveElement: HTMLElement | null;
  /** Whether the focus trap is currently active. */
  isActive: boolean;
  /** The bound keydown event handler, or null if inactive. */
  keydownHandler: ((event: KeyboardEvent) => void) | null;
};

const trapState: FocusTrapState = {
  container: null,
  previousActiveElement: null,
  isActive: false,
  keydownHandler: null,
};

/**
 * Activate focus trap for a container.
 *
 * @param container - The container element to trap focus within
 */
export const activateFocusTrap = (container: HTMLElement): void => {
  if (trapState.isActive || trapState.container === container) return;

  // Store the element that had focus before trapping
  trapState.previousActiveElement = document.activeElement as HTMLElement;

  // Move focus to the first focusable element
  const { first } = getFocusBoundary(container);
  first?.focus();

  trapState.container = container;
  trapState.isActive = true;

  // Set up keyboard handler
  trapState.keydownHandler = (event: KeyboardEvent) => {
    if (event.key === "Tab" && trapState.isActive) {
      handleTabKey(event, container);
    }
  };

  container.addEventListener("keydown", trapState.keydownHandler);
};

/**
 * Deactivate the current focus trap.
 *
 * Restores focus to the element that had it before trapping.
 */
export const deactivateFocusTrap = (): void => {
  if (!trapState.isActive) return;

  // Remove keyboard handler
  if (trapState.container && trapState.keydownHandler) {
    trapState.container.removeEventListener("keydown", trapState.keydownHandler);
  }

  // Restore focus to the element that had it before trapping
  trapState.previousActiveElement?.focus();
  trapState.previousActiveElement = null;

  trapState.container = null;
  trapState.isActive = false;
  trapState.keydownHandler = null;
};
