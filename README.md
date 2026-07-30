# tatami-a11y

[![CI](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml/badge.svg)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![license](https://img.shields.io/npm/l/tatami-a11y)](LICENSE)

Framework-agnostic accessibility primitives for vanilla JavaScript. The shared foundation underneath accessible components.

## Quick Start

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from 'tatami-a11y';

// Screen reader announcements
announce('Changes saved');

// Focus restoration for transient UI
pushFocusStack(triggerElement);
// ... component logic ...
popFocusStack();
```

## Deployed Sites

- **Storybook**: https://tatami-a11y-storybook.surge.sh - Interactive component examples
- **Documentation**: https://tatami-a11y-docs.surge.sh - Full API documentation
- **Demo**: https://tatami-a11y-demo.surge.sh - Live demo

## What's Included

**Shared Utilities:**
- `announce()` - Screen reader announcements with polite/assertive routing
- `checkReducedMotion()` / `onReducedMotionChange()` - Reduced motion detection
- `pushFocusStack()` / `popFocusStack()` - Focus restoration for transient UI
- `activateFocusTrap()` / `deactivateFocusTrap()` - Focus trapping for modals
- `createSingleton()` / `registerCleanup()` - HMR-safe singleton factory

**Components:**
- Dropdown, Tabs, Modal, Accordion, Toast, MenuButton, Combobox, Tooltip
- Carousel, Dialog, Disclosure, DatePicker, CommandPalette, TreeView
- ReorderableList, MultiselectListbox

See the [API documentation](https://tatami-a11y-docs.surge.sh) for detailed component usage.

## Development

```bash
pnpm install
pnpm run build        # Build to dist/ (ESM + CJS + types)
pnpm run dev          # Watch mode
pnpm run test         # Run tests
pnpm run storybook    # Start Storybook on port 6006
pnpm run doc          # Build documentation
```

## Deployment

```bash
pnpm run deploy:storybook  # Build and deploy Storybook
pnpm run deploy:docs       # Build and deploy documentation
```

## Why This Exists

Building accessible components repeatedly surfaces the same hard problems: screen reader announcements, focus restoration, focus trapping, and HMR-safe singletons. This library extracts those shared mechanics so you don't have to reimplement them for every component.

Framework-agnostic by design — works with vanilla JS, Vue, or any framework without virtual DOM assumptions.

## License

MIT
