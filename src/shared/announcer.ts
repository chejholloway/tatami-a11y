/**
 * Live-region announcer singleton.
 *
 * Creates and manages ARIA live regions for screen reader announcements.
 * Uses polite/assertive routing based on urgency, with aria-atomic="false"
 * to ensure each message announces once without re-reading the entire region.
 */

import { createSingleton } from './globalRegistry.js';

const POLITE_KEY = '__a11y_announcer_polite__';
const ASSERTIVE_KEY = '__a11y_announcer_assertive__';

type AnnounceOptions = {
  urgent?: boolean;
};

/**
 * Create a live region element.
 *
 * @param liveType - Either 'polite' or 'assertive'
 * @returns The live region element
 */
const createLiveRegion = (liveType: 'polite' | 'assertive'): HTMLElement => {
  const region = document.createElement('div');
  region.setAttribute('aria-live', liveType);
  region.setAttribute('aria-atomic', 'false');
  region.setAttribute('aria-label', 'Notifications');
  region.style.position = 'absolute';
  region.style.left = '-10000px';
  region.style.width = '1px';
  region.style.height = '1px';
  region.style.overflow = 'hidden';
  document.body.appendChild(region);

  return region;
};

/**
 * Get or create the polite live region.
 *
 * @returns The polite live region element
 */
const getPoliteRegion = (): HTMLElement => {
  return createSingleton(
    () => createLiveRegion('polite'),
    POLITE_KEY
  );
};

/**
 * Get or create the assertive live region.
 *
 * @returns The assertive live region element
 */
const getAssertiveRegion = (): HTMLElement => {
  return createSingleton(
    () => createLiveRegion('assertive'),
    ASSERTIVE_KEY
  );
};

/**
 * Announce a message to screen readers.
 *
 * Urgent messages go to the assertive region (immediate announcement),
 * non-urgent go to the polite region (announced when user is idle).
 *
 * @param message - The message to announce
 * @param options - Configuration options
 * @param options.urgent - Whether this is urgent (assertive region)
 */
export const announce = (message: string, options: AnnounceOptions = {}): void => {
  if (typeof document === 'undefined') return;

  const { urgent = false } = options;
  const region = urgent ? getAssertiveRegion() : getPoliteRegion();

  // Clear previous content to ensure fresh announcement
  region.textContent = '';

  // Small delay to ensure screen reader picks up the change
  requestAnimationFrame(() => {
    region.textContent = message;
  });
};

/**
 * React hook for using the announcer.
 *
 * @returns The announce function
 */
export const useAnnouncer = (): typeof announce => {
  return announce;
};
