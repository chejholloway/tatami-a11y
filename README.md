# tatami-a11y

[![CI](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml/badge.svg)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![license](https://img.shields.io/npm/l/tatami-a11y)](LICENSE)

Framework-agnostic accessibility primitives for vanilla JavaScript. The shared foundation underneath accessible components.

## Why This Exists

Building accessible components repeatedly surfaces the same hard problems:

- **Announcing something to a screen reader without stealing focus.** Getting `aria-live` regions right (polite vs. assertive, `aria-atomic`, avoiding re-announcement) is fiddly enough that most components either skip it or get it subtly wrong.
- **Handing focus back to the right place when transient UI closes.** Not just "focus something," but skipping stale references when the original element has since been removed from the DOM, and falling through a real chain of fallbacks instead of silently failing.
- **Trapping focus inside a container that only exists sometimes.** A different problem from the one above, and one that most homegrown modal implementations get wrong in a way that only shows up when you actually try to tab through one with a keyboard.
- **Surviving hot module reloads without leaking listeners or duplicating DOM nodes.** Not an accessibility concern on its own, but every one of the components above needs it, and getting it wrong quietly breaks the actual accessibility guarantees during development.

Every one of these was a real bug I hit and fixed while building kanpai, not a hypothetical. Rebuilding each of them from scratch for every new component is how accessibility bugs multiply: the tenth reimplementation of "restore focus on close" is exactly where someone forgets the stale-reference case and ships a dropdown that silently strands keyboard focus on `<body>`.

![Shared primitives problem](https://raw.githubusercontent.com/chejholloway/tatani-a11y/main/shared_a11y_primitives_problem.png)

The top panel is the state before tatami-a11y: three components, each with its own from-scratch implementation of focus handling and live-region announcing. Nothing enforces consistency between them, which is exactly how kanpai's bugs happened, and how the same class of bug would've quietly reappeared in a modal or dropdown built the same way.

The bottom panel is the state after: one shared, tested foundation, and each component just composes it instead of reinventing it. The arrows aren't decorative, they're the actual dependency: Toast, Modal, and Dropdown don't know or care how focus restoration works internally, they just call into the same primitive that's already been through the stale-reference and blur-fallback bugs once.

This library pulls out the pieces that are genuinely shared, and only those. It's deliberately not a component library and not a framework. There's no `<Toast>` or `<Modal>` here, those still get built per-component, on top of this. What's shared is the underlying mechanics that every accessible interactive component needs, regardless of what it looks like or which framework (if any) renders it.

## Why Framework-Agnostic

Radix UI and React Aria solved this problem well, for React. Headless UI covers Vue and React. If you're not in one of those ecosystems, or you're maintaining a vanilla-JS codebase, there isn't a serious, actively-maintained equivalent. This is built to be that: no virtual DOM, no framework runtime assumption, works the same whether you're calling it from a hand-rolled component, a Vue composable, or a plain script tag.

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

See the [Storybook](https://tatami-a11y-storybook.surge.sh) for interactive examples and the [API documentation](https://tatami-a11y-docs.surge.sh) for detailed usage.

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

## License

MIT
