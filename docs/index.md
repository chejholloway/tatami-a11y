---
sidebar_position: 1
---

# tatami-a11y

Framework-agnostic accessibility primitives for vanilla JavaScript. The shared foundation underneath [kanpai](https://www.npmjs.com/package/kanpai-toast) and every accessible component built after it.

## Install

```bash
pnpm install tatami-a11y
```

## Quick Start

```js
import { announce, Dropdown, Modal } from "tatami-a11y";

// Screen reader announcements
announce("Changes saved");

// Accessible dropdown
const dropdown = new Dropdown({
  trigger: document.getElementById("dropdown-trigger"),
  menu: document.getElementById("dropdown-menu"),
});

// Accessible modal
const modal = new Modal({
  trigger: document.getElementById("modal-trigger"),
  modal: document.getElementById("modal"),
  backdrop: document.getElementById("modal-backdrop"),
});
```

## Components

- **Dropdown** - Accessible dropdown menu with keyboard navigation
- **Tabs** - Accessible tabs with arrow key navigation
- **Modal** - Modal dialog with focus trap and backdrop
- **Accordion** - Expandable sections with keyboard support
- **Toast** - Notification toasts with variants
- **MenuButton** - Menu button with aria-haspopup
- **Combobox** - Autocomplete with filtering
- **Tooltip** - Hover and focus tooltips
- **Carousel** - Slide carousel with auto-play
- **Dialog** - Non-modal floating panel
- **Disclosure** - Show/hide toggle
- **DatePicker** - Full WAI-ARIA date picker
- **TreeView** - Hierarchical tree with expand/collapse
- **ReorderableList** - Keyboard-reorderable list
- **MultiselectListbox** - Multi-select listbox
- **CommandPalette** - Ctrl+K command palette

## Shared Utilities

- **announce** - ARIA live region announcements
- **checkReducedMotion** - Reduced motion detection
- **pushFocusStack / popFocusStack** - Focus restoration
- **activateFocusTrap / deactivateFocusTrap** - Focus trapping
- **createSingleton / registerCleanup** - HMR-safe singletons
- **createRovingTabindex** - Roving tabindex controller

## Development

```bash
pnpm install
pnpm run build
pnpm run test
pnpm run doc
```

## License

MIT
