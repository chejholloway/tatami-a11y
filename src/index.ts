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
export { createRovingTabindex } from './shared/rovingTabindex.js';
export type { RovingTabindexController, RovingTabindexOptions } from './shared/rovingTabindex.js';

// Components
export { Dropdown } from './components/dropdown.js';
export { Tabs } from './components/tabs.js';
export { Modal } from './components/modal.js';
export { Accordion } from './components/accordion.js';
export { Toast } from './components/toast.js';
export { MenuButton } from './components/menuButton.js';
export { Combobox } from './components/combobox.js';
export { Tooltip } from './components/tooltip.js';
export { Carousel } from './components/carousel.js';
export { Dialog } from './components/dialog.js';
export { Disclosure } from './components/disclosure.js';
export { DatePicker } from './components/datePicker.js';
export { TreeView } from './components/treeView.js';
export { CommandPalette } from './components/commandPalette.js';
export type { DatePickerOptions } from './components/datePicker.js';
export type { CommandPaletteOptions, CommandItem } from './components/commandPalette.js';
