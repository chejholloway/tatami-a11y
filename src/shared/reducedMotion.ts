/**
 * Reduced motion detection utility.
 *
 * Returns true when the user has requested reduced motion via system settings.
 * Provides a callback registration for listening to changes.
 */

/**
 * Callback invoked when the user's reduced motion preference changes.
 *
 * @param prefersReduced - Whether the user now prefers reduced motion
 */
type ReducedMotionCallback = (prefersReduced: boolean) => void;

const listeners = new Set<ReducedMotionCallback>();
let currentValue = false;

/**
 * Check if the user prefers reduced motion.
 *
 * @returns Whether reduced motion is preferred
 */
export const checkReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
};

/**
 * Register a callback to be called when reduced motion preference changes.
 *
 * @param callback - Function to call on change
 * @returns Cleanup function to remove the listener
 */
export const onReducedMotionChange = (callback: ReducedMotionCallback): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  listeners.add(callback);

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handleChange = (event: MediaQueryListEvent) => {
    currentValue = event.matches;
    listeners.forEach((listener) => listener(currentValue));
  };

  mediaQuery.addEventListener('change', handleChange);

  return () => {
    listeners.delete(callback);
    mediaQuery.removeEventListener('change', handleChange);
  };
};

/**
 * Get the current reduced motion preference.
 *
 * @returns Boolean indicating if reduced motion is preferred
 */
export const getReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (listeners.size === 0) {
    currentValue = checkReducedMotion();
  }
  return currentValue;
};
