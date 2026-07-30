/**
 * @module tatami-a11y
 *
 * Framework-agnostic, accessibility-first UI primitives for vanilla JavaScript.
 *
 * Provides shared utilities (announcer, focus management, reduced motion, roving tabindex)
 * and fully accessible UI components (accordion, carousel, combobox, command palette,
 * date picker, dialog, disclosure, dropdown, menu button, modal, multiselect listbox,
 * reorderable list, tabs, toast, tooltip, tree view).
 *
 * All components implement WAI-ARIA authoring practices and are designed to work
 * with any framework or no framework at all.
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
export { MultiselectListbox } from './components/multiselectListbox.js';
export type { MultiselectListboxOptions } from './components/multiselectListbox.js';
export { Combobox } from './components/combobox.js';
export { Tooltip } from './components/tooltip.js';
export { Carousel } from './components/carousel.js';
export { Dialog } from './components/dialog.js';
export { Disclosure } from './components/disclosure.js';
export { DatePicker } from './components/datePicker.js';
export { TreeView } from './components/treeView.js';
export { ReorderableList } from './components/reorderableList.js';
export { CommandPalette } from './components/commandPalette.js';
export type { DatePickerOptions } from './components/datePicker.js';
export type { CommandPaletteOptions, CommandItem } from './components/commandPalette.js';
