/**
 * a11y-primitives - Framework-agnostic, accessibility-first UI primitives for vanilla JavaScript.
 *
 * Exports shared utilities for building accessible UIs without framework lock-in.
 */

// Shared utilities
export { createSingleton, registerCleanup } from './shared/globalRegistry.js';
export { announce } from './shared/announcer.js';
export {
  checkReducedMotion,
  onReducedMotionChange,
  getReducedMotion,
} from './shared/reducedMotion.js';
export {
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
  clearFocusStack,
} from './shared/focusStack.js';
export {
  activateFocusTrap,
  deactivateFocusTrap,
} from './shared/focusTrap.js';

// Components
export { Dropdown } from './components/dropdown.js';
export { Tabs } from './components/tabs.js';
