# tatami-a11y

Framework-agnostic accessibility primitives for vanilla JavaScript. The shared foundation underneath [kanpai](https://www.npmjs.com/package/kanpai-toast) and every accessible component built after it.

## Why this exists

Building [kanpai](https://www.npmjs.com/package/kanpai-toast) surfaced the same handful of hard problems over and over, and none of them are specific to toast notifications:

- **Announcing something to a screen reader without stealing focus.** Getting `aria-live` regions right (polite vs. assertive, `aria-atomic`, avoiding re-announcement) is fiddly enough that most components either skip it or get it subtly wrong.
- **Handing focus back to the right place when transient UI closes.** Not just "focus something," but skipping stale references when the original element has since been removed from the DOM, and falling through a real chain of fallbacks instead of silently failing.
- **Trapping focus inside a container that only exists sometimes.** A different problem from the one above, and one that most homegrown modal implementations get wrong in a way that only shows up when you actually try to tab through one with a keyboard.
- **Surviving hot module reloads without leaking listeners or duplicating DOM nodes.** Not an accessibility concern on its own, but every one of the components above needs it, and getting it wrong quietly breaks the actual accessibility guarantees during development.

Every one of these was a real bug I hit and fixed while building kanpai, not a hypothetical. Rebuilding each of them from scratch for every new component is how accessibility bugs multiply: the tenth reimplementation of "restore focus on close" is exactly where someone forgets the stale-reference case and ships a dropdown that silently strands keyboard focus on `<body>`.

![Shared primitives problem](./shared_a11y_primitives_problem.png)

The top panel is the state before tatami-a11y: three components, each with its own from-scratch implementation of focus handling and live-region announcing. Nothing enforces consistency between them, which is exactly how kanpai's bugs happened, and how the same class of bug would've quietly reappeared in a modal or dropdown built the same way.

The bottom panel is the state after: one shared, tested foundation, and each component just composes it instead of reinventing it. The arrows aren't decorative, they're the actual dependency: Toast, Modal, and Dropdown don't know or care how focus restoration works internally, they just call into the same primitive that's already been through the stale-reference and blur-fallback bugs once.

This library pulls out the pieces that are genuinely shared, and only those. It's deliberately not a component library and not a framework. There's no `<Toast>` or `<Modal>` here, those still get built per-component, on top of this. What's shared is the underlying mechanics that every accessible interactive component needs, regardless of what it looks like or which framework (if any) renders it.

## Why framework-agnostic

Radix UI and React Aria solved this problem well, for React. Headless UI covers Vue and React. If you're not in one of those ecosystems, or you're maintaining a vanilla-JS codebase, there isn't a serious, actively-maintained equivalent. This is built to be that: no virtual DOM, no framework runtime assumption, works the same whether you're calling it from a hand-rolled component, a Vue composable, or a plain script tag.

## Install

```bash
pnpm install tatami-a11y
```

## Shared Utilities

### `announce(message, options)`

Screen reader announcer using ARIA live regions. Routes urgent messages to an assertive region, everything else to a polite one, so routine updates don't interrupt what someone's already listening to, and urgent ones don't get missed.

```js
import { announce } from 'tatami-a11y';

announce('Changes saved'); // polite region
announce('Error occurred', { urgent: true }); // assertive region
```

### `checkReducedMotion()`, `onReducedMotionChange(callback)`

Detect and react to the `prefers-reduced-motion` system preference, so components can skip animations for people who've asked not to see them, without every component reimplementing its own `matchMedia` listener.

```js
import { checkReducedMotion, onReducedMotionChange } from 'tatami-a11y';

const prefersReduced = checkReducedMotion();

const cleanup = onReducedMotionChange((prefersReduced) => {
  console.log('Reduced motion preference changed:', prefersReduced);
});

cleanup();
```

### `pushFocusStack(element)`, `popFocusStack()`, `setInitialFocusReference(element)`, `clearFocusStack()`

Focus restoration for transient, non-modal UI, dropdowns, popovers, anything that temporarily takes focus and needs to hand it back correctly on close. Pushes the triggering element on entry, restores it on exit, and skips over stale entries if that element's since been removed from the DOM instead of silently failing.

```js
import { pushFocusStack, popFocusStack, setInitialFocusReference } from 'tatami-a11y';

// Before opening a dropdown
setInitialFocusReference(document.activeElement);
pushFocusStack(triggerElement);

// When closing the dropdown
popFocusStack();
```

This is *not* the same problem `activateFocusTrap` solves, see below.

### `activateFocusTrap(container)`, `deactivateFocusTrap()`

Focus trapping for modal/dialog components. Unlike the focus stack above, a trap actively prevents Tab and Shift+Tab from leaving the container while it's active, wrapping at the boundaries and accounting for focusable children that get added or removed while the trap is live.

```js
import { activateFocusTrap, deactivateFocusTrap } from 'tatami-a11y';

const modalElement = document.getElementById('modal');
activateFocusTrap(modalElement);

// When closing the modal
deactivateFocusTrap();
```

### `createSingleton(factory, key)`, `registerCleanup(key, cleanup)`

An HMR-safe singleton factory. Any component with module-level state (a live region, a global event listener) needs this or it'll duplicate itself on every hot reload during development. This has nothing to do with accessibility specifically, it's a general DOM-singleton problem, but every component above depends on it.

```js
import { createSingleton, registerCleanup } from 'tatami-a11y';

const instance = createSingleton(() => ({ data: [] }), '__mySingleton__');

registerCleanup('__mySingleton__', () => {
  // Cleanup logic before HMR replacement
});
```

## Building Custom Components

The real power of `tatami-a11y` is using these shared primitives to build your own accessible components, without worrying about edge cases like stale DOM nodes or hot module reloading breaking your live regions. 

Here is an example of how you might compose them to build a custom accessible slide-over panel:

```js
import { 
  activateFocusTrap, 
  deactivateFocusTrap,
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
  announce 
} from 'tatami-a11y';

class CustomSlideOver {
  constructor(triggerElement, panelElement) {
    this.trigger = triggerElement;
    this.panel = panelElement;
    
    this.trigger.addEventListener('click', () => this.open());
    this.panel.querySelector('.close-btn').addEventListener('click', () => this.close());
  }

  open() {
    this.panel.classList.add('is-open');
    
    // 1. Tell the screen reader
    announce('Slide-over opened');
    
    // 2. Remember where focus came from
    setInitialFocusReference(this.trigger);
    pushFocusStack(this.trigger);
    
    // 3. Keep keyboard users inside the panel
    activateFocusTrap(this.panel);
  }

  close() {
    this.panel.classList.remove('is-open');
    
    // 1. Let keyboard users back out
    deactivateFocusTrap();
    
    // 2. Restore focus gracefully (even if the trigger was removed from DOM)
    popFocusStack();
    
    // 3. Tell the screen reader
    announce('Slide-over closed');
  }
}
```

## Components

### `Dropdown`

Accessible dropdown menu component with keyboard navigation, focus trap, and announcements.

```js
import { Dropdown } from 'tatami-a11y';

const dropdown = new Dropdown({
  trigger: document.getElementById('dropdown-trigger'),
  menu: document.getElementById('dropdown-menu'),
  onOpen: () => console.log('Dropdown opened'),
  onClose: () => console.log('Dropdown closed'),
});
```

### `Tabs`

Accessible tabs component with keyboard navigation and announcements.

```js
import { Tabs } from 'tatami-a11y';

const tabs = new Tabs({
  tabList: document.getElementById('tablist'),
  onTabChange: (index) => console.log('Tab changed to', index),
});
```

### `Modal`

Accessible modal dialog with backdrop, focus trap, and announcements.

```js
import { Modal } from 'tatami-a11y';

const modal = new Modal({
  trigger: document.getElementById('modal-trigger'),
  modal: document.getElementById('modal'),
  backdrop: document.getElementById('modal-backdrop'),
  onOpen: () => console.log('Modal opened'),
  onClose: () => console.log('Modal closed'),
});
```

### `Accordion`

Accessible accordion with keyboard navigation and announcements.

```js
import { Accordion } from 'tatami-a11y';

const accordion = new Accordion({
  container: document.getElementById('accordion'),
  allowMultiple: false, // Optional: allow multiple panels open
  onToggle: (index, isExpanded) => console.log(`Panel ${index} ${isExpanded ? 'expanded' : 'collapsed'}`),
});
```

### `Toast`

Accessible toast notifications with auto-dismissal, focus management, and keyboard shortcuts (Alt+T to jump to toasts).

```js
import { Toast } from 'tatami-a11y';

// Show toast with variant
Toast.info('This is an info message');
Toast.success('Changes saved successfully');
Toast.warning('Please review your changes');
Toast.error('Something went wrong');

// Custom options
Toast.show('Custom message', { variant: 'success', duration: 3000 });

// Dismiss toasts
Toast.dismiss('toast-id');
Toast.dismissAll();

// Configure position
Toast.configure({ position: 'top-right' });
```

### `MenuButton`

Accessible menu button with keyboard navigation, focus trap, and announcements.

```js
import { MenuButton } from 'tatami-a11y';

const menuButton = new MenuButton({
  trigger: document.getElementById('menu-trigger'),
  menu: document.getElementById('menu'),
  onOpen: () => console.log('Menu opened'),
  onClose: () => console.log('Menu closed'),
});
```

### `Combobox`

Accessible combobox/autocomplete with filtering, keyboard navigation, and announcements.

```js
import { Combobox } from 'tatami-a11y';

const combobox = new Combobox({
  input: document.getElementById('combobox-input'),
  listbox: document.getElementById('combobox-listbox'),
  onSelect: (value, index) => console.log('Selected:', value),
  filter: (item, query) => item.toLowerCase().includes(query.toLowerCase()), // Optional custom filter
});
```

## Demo

Try the live demo at [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh)

Or run it locally:

```bash
# Option 1: Open directly
open demo/index.html  # macOS
start demo/index.html # Windows
xdg-open demo/index.html # Linux

# Option 2: Use a simple dev server
pnpm run serve
```

The demo includes interactive examples of all shared utilities and components.

## Development

```bash
pnpm install
pnpm run build      # Build to dist/
pnpm run dev        # Watch mode
pnpm run test       # Run tests
pnpm run test:watch # Watch tests
pnpm run typecheck  # TypeScript type checking
```

## License

MIT
