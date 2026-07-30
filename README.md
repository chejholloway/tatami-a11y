# tatami-a11y

[![CI](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml/badge.svg)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![license](https://img.shields.io/npm/l/tatami-a11y)](LICENSE)

Framework-agnostic accessibility primitives for vanilla JavaScript. The shared foundation underneath [kanpai](https://www.npmjs.com/package/kanpai-toast) and every accessible component built after it.

## Why this exists

Building [kanpai](https://www.npmjs.com/package/kanpai-toast) surfaced the same handful of hard problems over and over, and none of them are specific to toast notifications:

- **Announcing something to a screen reader without stealing focus.** Getting `aria-live` regions right (polite vs. assertive, `aria-atomic`, avoiding re-announcement) is fiddly enough that most components either skip it or get it subtly wrong.
- **Handing focus back to the right place when transient UI closes.** Not just "focus something," but skipping stale references when the original element has since been removed from the DOM, and falling through a real chain of fallbacks instead of silently failing.
- **Trapping focus inside a container that only exists sometimes.** A different problem from the one above, and one that most homegrown modal implementations get wrong in a way that only shows up when you actually try to tab through one with a keyboard.
- **Surviving hot module reloads without leaking listeners or duplicating DOM nodes.** Not an accessibility concern on its own, but every one of the components above needs it, and getting it wrong quietly breaks the actual accessibility guarantees during development.

Every one of these was a real bug I hit and fixed while building kanpai, not a hypothetical. Rebuilding each of them from scratch for every new component is how accessibility bugs multiply: the tenth reimplementation of "restore focus on close" is exactly where someone forgets the stale-reference case and ships a dropdown that silently strands keyboard focus on `<body>`.

![Shared primitives problem](https://raw.githubusercontent.com/chejholloway/tatani-a11y/main/shared_a11y_primitives_problem.png)

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

### `Tooltip`

Accessible tooltip that appears on hover and keyboard focus. Wires `aria-describedby` between the trigger and the tooltip, dismisses on Escape, and respects reduced motion.

```js
import { Tooltip } from 'tatami-a11y';

const tooltip = new Tooltip({
  trigger: document.getElementById('tooltip-trigger'),
  tooltip: document.getElementById('tooltip-content'),
  onOpen: () => console.log('Tooltip shown'),
  onClose: () => console.log('Tooltip hidden'),
});

// Public API
tooltip.show();
tooltip.hide();
tooltip.destroy(); // remove all event listeners
```

**Required HTML:**
```html
<button id="tooltip-trigger">Hover or focus me</button>
<div id="tooltip-content">Helpful context about the button above</div>
```

The component auto-generates an `id` on the tooltip element if none is present, so `aria-describedby` always points at the right target.

**Keyboard:** `Escape` dismisses the tooltip when it is visible. No other key bindings are needed — the trigger retains its normal keyboard behaviour.

---

### `Carousel`

Accessible carousel built on WAI-ARIA's `region`/`group` pattern. Announces slide changes via the shared announcer, includes a play/pause control for auto-rotation, and disables auto-play automatically when `prefers-reduced-motion` is active.

```js
import { Carousel } from 'tatami-a11y';

const carousel = new Carousel({
  container: document.getElementById('carousel'),
  autoPlay: true,          // Optional: start rotating on init (default: false)
  autoPlayInterval: 4000,  // Optional: ms between slides (default: 5000)
  onSlideChange: (index) => console.log('Now on slide', index + 1),
});

// Public API
carousel.next();
carousel.prev();
carousel.goToSlide(2);
carousel.play();
carousel.pause();
carousel.togglePlay();
carousel.destroy();
```

**Required HTML structure** — the component finds its children by data attributes:
```html
<div id="carousel">
  <div data-carousel-track>
    <div data-carousel-slide>Slide 1</div>
    <div data-carousel-slide>Slide 2</div>
    <div data-carousel-slide>Slide 3</div>
  </div>
  <button data-carousel-prev>Previous</button>
  <button data-carousel-playpause>Pause / Play</button>
  <button data-carousel-next>Next</button>
</div>
```

Control buttons are optional — if absent the carousel still works, just without those interaction points. User interaction with next/prev automatically pauses auto-rotation.

---

### `Dialog` (non-modal)

An accessible floating panel that uses `role="dialog"` with `aria-modal="false"`. Unlike `Modal`, it does **not** trap focus — users can freely tab out. Uses the focus stack to restore focus gracefully when closed.

```js
import { Dialog } from 'tatami-a11y';

const dialog = new Dialog({
  trigger: document.getElementById('dialog-trigger'),
  dialog: document.getElementById('dialog-panel'),
  onOpen: () => console.log('Dialog opened'),
  onClose: () => console.log('Dialog closed'),
});

// Public API
dialog.open();
dialog.close();
dialog.destroy();
```

**When to use this vs `Modal`:** use `Modal` when you need to block interaction with the rest of the page (e.g. a confirmation prompt). Use `Dialog` for persistent floating panels — notification centres, side drawers, live chat widgets — where users need to be able to reference the rest of the page while the panel is open.

**Keyboard:** `Escape` closes the dialog. Focus is restored to the triggering element via the focus stack.

---

### `Disclosure`

The simplest accessible show/hide pattern: a button that expands and collapses a region. Correctly wires `aria-expanded` and `aria-controls` so screen readers announce the current state on every toggle — which most hand-rolled implementations forget to do.

```js
import { Disclosure } from 'tatami-a11y';

const disclosure = new Disclosure({
  trigger: document.getElementById('details-toggle'),
  content: document.getElementById('details-panel'),
  onToggle: (isExpanded) => console.log(isExpanded ? 'Expanded' : 'Collapsed'),
});

// Public API
disclosure.expand();
disclosure.collapse();
disclosure.toggle();
disclosure.destroy();
```

**Required HTML:**
```html
<button id="details-toggle">Show advanced settings</button>
<div id="details-panel">
  <!-- anything here -->
</div>
```

The component auto-generates an `id` on the content element if none is present, so `aria-controls` always resolves correctly.

**Keyboard:** no extra bindings needed — the trigger is a `<button>` so it responds to `Enter` and `Space` natively.

### `DatePicker`

Date pickers are the most consistently broken accessible component on the web. Most implementations fail on at least one of these: screen readers don't distinguish today from selected, arrow keys don't navigate the grid, the month navigation buttons have no accessible name, or focus is silently dropped when the month changes.

This implements the [WAI-ARIA Date Picker Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) fully: a `role="grid"` calendar with roving `tabindex`, `aria-current="date"` on today, `aria-selected` on the chosen day, a live region on the month heading, and focus trap + stack for the dialog.

```js
import { DatePicker } from 'tatami-a11y';

const dp = new DatePicker({
  input:           document.getElementById('dp-input'),
  dialog:          document.getElementById('dp-dialog'),
  toggleButton:    document.getElementById('dp-toggle'),
  monthYearLabel:  document.getElementById('dp-month-label'),
  prevMonthButton: document.getElementById('dp-prev'),
  nextMonthButton: document.getElementById('dp-next'),
  calendarGrid:    document.getElementById('dp-grid'),
  dateFormat: 'YYYY-MM-DD',   // or 'MM/DD/YYYY' or 'DD/MM/YYYY'
  minDate:    new Date(2020, 0, 1),
  maxDate:    new Date(2030, 11, 31),
  onOpen:  ()                  => console.log('Calendar opened'),
  onClose: ()                  => console.log('Calendar closed'),
  onSelect: (date, formatted)  => console.log('Selected:', formatted),
  onMonthChange: (year, month) => console.log('Now viewing:', year, month),
});

// Public API
dp.open();
dp.close();
dp.toggle();
dp.setValue(new Date(2025, 5, 15)); // programmatic selection
dp.clearValue();
dp.getSelectedDate();               // returns Date | null
dp.destroy();
```

**Required HTML skeleton:**
```html
<input type="text" id="dp-input" />
<button id="dp-toggle">Choose date</button>

<div id="dp-dialog">
  <button id="dp-prev">Previous month</button>
  <div id="dp-month-label"></div>
  <button id="dp-next">Next month</button>
  <div id="dp-grid"></div>
</div>
```

The component renders the column headers and day cells into `calendarGrid` on every month change. All ARIA attributes are managed automatically.

**Keyboard (inside calendar):**

| Key | Action |
|---|---|
| `Arrow` keys | Move one day in that direction |
| `Home` | First day of current week |
| `End` | Last day of current week |
| `Ctrl+Home` | First day of current month |
| `Ctrl+End` | Last day of current month |
| `PageUp` | Previous month |
| `PageDown` | Next month |
| `Shift+PageUp` | Previous year |
| `Shift+PageDown` | Next year |
| `Enter` / `Space` | Select focused date |
| `Escape` | Close without selecting |

---

### `CommandPalette`

The `Ctrl+K` pattern looks simple — search input, list of results — but the accessibility is genuinely hard. `aria-activedescendant` must track the highlighted result without moving DOM focus off the input, result counts need a live region, grouped results need `role="group"`, and the whole thing needs a focus trap that restores correctly when dismissed.

```js
import { CommandPalette } from 'tatami-a11y';

const palette = new CommandPalette({
  overlay:      document.getElementById('cp-overlay'),
  dialog:       document.getElementById('cp-dialog'),
  input:        document.getElementById('cp-input'),
  listbox:      document.getElementById('cp-listbox'),
  statusRegion: document.getElementById('cp-status'),
  backdrop:     document.getElementById('cp-backdrop'), // optional
  hotkey: 'k', // opens on Ctrl+K / Meta+K (default)
  commands: [
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file in the current directory',
      group: 'Files',
      shortcut: '⌘N',
      action: () => createFile(),
    },
    {
      id: 'settings',
      label: 'Open Settings',
      group: 'Application',
      action: () => openSettings(),
    },
  ],
  onSelect: (item) => console.log('Executed:', item.label),
  onOpen:   ()     => console.log('Palette opened'),
  onClose:  ()     => console.log('Palette closed'),
});

// Public API
palette.open();
palette.close();
palette.setCommands(newCommandList);   // replace the full list
palette.addCommand({ id, label, action });
palette.removeCommand('settings');
palette.destroy();
```

**Required HTML skeleton:**
```html
<div id="cp-overlay">
  <div id="cp-backdrop"></div>
  <div id="cp-dialog">
    <input type="text" id="cp-input" placeholder="Type a command…" />
    <div id="cp-status"></div>
    <div id="cp-listbox"></div>
  </div>
</div>
```

The component renders all result options into `listbox`. Items with a `group` property are wrapped in `role="group"` containers with `aria-labelledby` pointing at the group heading. Items with a `description` get `aria-describedby`.

**Keyboard:**

| Key | Action |
|---|---|
| `ArrowDown` | Move highlight down (wraps) |
| `ArrowUp` | Move highlight up (wraps) |
| `Enter` | Execute highlighted command |
| `Escape` | Close without executing |
| `Ctrl+K` / `Meta+K` | Toggle open/closed (configurable via `hotkey`) |

### `TreeView`

An accessible tree view with expand/collapse, keyboard navigation (Arrow keys, Home, End, typeahead), and single/multi-select. Uses `createRovingTabindex` with a custom `beforeKey` handler for tree-specific keys (ArrowRight/Left for expand/collapse, Enter/Space/typeahead for selection).

```js
import { TreeView } from 'tatami-a11y';

const tv = new TreeView({
  tree: document.getElementById('my-tree'),
  multiselect: true,                                     // optional, default false
  onSelect: (node, index) => console.log('Selected:', node.textContent, 'at', index),
});

// Public API
tv.getItems();              // visible treeitems
tv.selectNode(2);           // select by visual index
tv.getSelectedNodes();      // returns array of selected indices
tv.destroy();
```

**Required HTML structure — nested `<ul>`/`<li>` with `data-children` and optional `data-expanded`:**
```html
<ul id="my-tree">
  <li data-label="Fruits" data-children="true">
    <span class="label">Fruits</span>
    <ul>
      <li data-label="Apple"><span class="label">Apple</span></li>
      <li data-label="Cherry" data-expanded="true" data-children="true">
        <span class="label">Cherry</span>
        <ul>
          <li data-label="Sour"><span class="label">Sour</span></li>
        </ul>
      </li>
    </ul>
  </li>
  <li data-label="Grains"><span class="label">Grains</span></li>
</ul>
```

The component recursively walks the DOM to apply `role="treeitem"`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded`, and `aria-selected`. Expand/collapse state lives in the DOM via `aria-expanded`. Children of collapsed branches are hidden with `aria-hidden`.

**Keyboard:**

| Key | Action |
|---|---|
| `ArrowDown` / `ArrowUp` | Next / previous visible item |
| `ArrowRight` | Expand closed branch |
| `ArrowLeft` | Collapse open branch, or focus parent |
| `Home` / `End` | First / last visible item |
| `Enter` / `Space` | Select (single), replace selection (multi) |
| `Ctrl+Space` | (multi) Toggle focused item without affecting others |
| Character key | Typeahead — jump to matching visible node |

---

### `ReorderableList`

An accessible reorderable list that supports **keyboard reordering** (`Ctrl+ArrowUp/Down`, `Ctrl+Home/End`) and optional **drag-and-drop** with a visual drop indicator. Announces each move via the shared announcer so screen reader users always know where the item landed.

```js
import { ReorderableList } from 'tatami-a11y';

const list = new ReorderableList({
  list: document.getElementById('my-list'),
  orientation: 'vertical',                               // or 'horizontal'
  dragAndDrop: true,                                     // enable mouse drag-and-drop
  announce: (msg) => console.log(msg),                   // defaults to shared announce()
  onReorder: (items, movedItem, newIndex) => {
    console.log('Reordered:', movedItem.textContent, 'to index', newIndex);
  },
});

// Public API
list.getItems();    // current items in DOM order
list.destroy();
```

**Required HTML — simple `<ul>`/`<li>` list:**
```html
<ul id="my-list">
  <li>Apples</li>
  <li>Bananas</li>
  <li>Cherries</li>
</ul>
```

The component sets `role="list"` on the container, `role="listitem"` on each child, and keeps `aria-posinset`/`aria-setsize` in sync after every reorder. When `dragAndDrop: true`, items are made draggable and an absolute-positioned drop indicator shows the insertion point during drag operations. Screen reader announcements provide live feedback for both keyboard and drag reordering.

**Keyboard:**

| Key | Action |
|---|---|
| `ArrowUp` / `ArrowDown` | Navigate items |
| `Home` / `End` | First / last item |
| `Ctrl+ArrowUp` | Move focused item up |
| `Ctrl+ArrowDown` | Move focused item down |
| `Ctrl+Home` | Move focused item to start |
| `Ctrl+End` | Move focused item to end |

Boundary keys are no-ops at the limits (first item can't move up, last item can't move down). Drag-and-drop works with any pointing device — the drop indicator shows exactly where the item will land.

---

### `MultiselectListbox`

A WAI-ARIA compliant listbox with single-select and multi-select modes, keyboard navigation, Shift+Click range selection, Ctrl+Click toggle, and typeahead.

```js
import { MultiselectListbox } from 'tatami-a11y';

const msl = new MultiselectListbox({
  listbox: document.getElementById('my-listbox'),
  multiselect: true,
  onSelect: (indices) => {
    console.log('Selected indices:', indices);
  },
});

// Public API
msl.getItems();              // option elements
msl.getSelectedIndices();    // [0, 2, 3]
msl.selectAll();             // select all (multi only)
msl.clearSelection();        // deselect all
msl.destroy();
```

**Required HTML — container with `div` children:**
```html
<div id="my-listbox">
  <div>Apples</div>
  <div>Bananas</div>
  <div>Cherries</div>
</div>
```

The component sets `role="listbox"` on the container, `role="option"` and `aria-selected` on each child. In multi-select mode it also sets `aria-multiselectable="true"` on the container. Selection state lives entirely in `aria-selected` attributes on the DOM nodes.

**Keyboard — single-select (`multiselect: false`):**

| Key | Action |
|-----|--------|
| `ArrowDown` / `ArrowUp` | Move focus and select |
| `Home` / `End` | First / last, select |
| `Space` | Select focused |
| Character key | Typeahead |

**Keyboard — multi-select (`multiselect: true`):**

| Key | Action |
|-----|--------|
| `ArrowDown` / `ArrowUp` | Move focus only |
| `Ctrl+ArrowDown` / `Ctrl+ArrowUp` | Move focus only |
| `Space` | Toggle focused item |
| `Ctrl+Space` | Toggle focused item |
| `Shift+ArrowDown` / `Shift+ArrowUp` | Extend / contract selection range |
| `Shift+Click` | Range select from anchor to clicked |
| `Ctrl+Click` | Toggle clicked, preserve others |
| Plain click | Select only clicked, clear rest |
| `Ctrl+A` | Select all |
| `Shift+Home` / `Shift+End` | Extend range to first / last |
| Character key | Typeahead |

---

## Demo

Try the live demo at [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh)

Or run it locally:

```bash
# Option 1: Use a simple dev server
pnpm run serve

# Option 2: Open directly
open demo/index.html  # macOS
start demo/index.html # Windows
xdg-open demo/index.html # Linux
```

The demo includes interactive examples of all shared utilities and components.

## Storybook

Every component has a corresponding Storybook story for interactive development and visual regression testing:

```bash
pnpm run storybook    # Start Storybook on port 6006
pnpm run build-storybook  # Build static Storybook site
```

Stories are in [`stories/`](./stories/) and cover all components and shared utilities (announcer, focus stack, focus trap, roving tabindex).

## Documentation Site

Full API documentation is built with [Docusaurus](https://docusaurus.io/) and [TypeDoc](https://typedoc.org/):

```bash
pnpm run doc  # Build documentation site
```

## Publishing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) so versioning is automatic:

```bash
# Auto-detect next version from commit messages
pnpm run release

# Or specify the bump explicitly
pnpm run release:patch  # 0.2.0 → 0.2.1
pnpm run release:minor  # 0.2.0 → 0.3.0
pnpm run release:major  # 0.2.0 → 1.0.0
```

This updates `package.json`, generates the `CHANGELOG.md`, and creates a git tag. Then publish:

```bash
npm publish
```

The `prepublishOnly` script runs tests and build automatically before publishing.

## Development

```bash
pnpm install
pnpm run build        # Build to dist/ (ESM + CJS + types)
pnpm run dev          # Watch mode (re-build on changes)
pnpm run serve        # Serve demo locally on port 8080
pnpm run test         # Run tests (Vitest)
pnpm run test:watch   # Watch tests
pnpm run test:verbose # Run tests with verbose output
pnpm run typecheck    # TypeScript type checking (tsc --noEmit)
pnpm run lint         # Lint with oxlint
pnpm run format       # Format with Prettier
pnpm run storybook    # Storybook dev server
pnpm run build-storybook  # Build Storybook
pnpm run doc          # Build Docusaurus docs
```

### Code Quality

| Tool | Purpose |
|---|---|
| [oxlint](https://oxc.rs/) | Fast Rust-based linter (configured in `.oxlintrc.json`) |
| [Prettier](https://prettier.io/) | Code formatter (`.prettierrc`) |
| [Husky](https://typicode.github.io/husky/) | Git hooks (`.husky/pre-commit`) |
| [lint-staged](https://github.com/lint-staged/lint-staged) | Run linters only on staged files |
| [TypeScript](https://www.typescriptlang.org/) | Type checking with `tsc --noEmit` |
| [Vitest](https://vitest.dev/) | Unit tests with jsdom |
| [axe-core](https://www.deque.com/axe/) | Automated accessibility testing |
| [tsup](https://tsup.egoist.dev/) | ESM + CJS + DTS bundler |

### CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm run lint` (oxlint)
3. `pnpm run typecheck` (TypeScript)
4. `pnpm run test` (Vitest)

## License

MIT
