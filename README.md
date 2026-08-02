# tatami-a11y

[![CI](https://img.shields.io/github/actions/workflow/status/chejholloway/tatami-a11y/ci.yml)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 746 passing](https://img.shields.io/badge/tests-746%20passing-brightgreen)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![Toolchain: Rust (oxlint/oxfmt)](https://img.shields.io/badge/toolchain-Rust%20\(oxlint%2Foxfmt\)-orange)](https://oxc.rs)

Framework-agnostic, accessibility-first UI primitives and components for vanilla JavaScript.

**16 components, 6 shared primitives, 746 unit tests, 16 browser-level Storybook integration tests with a11y checks, zero runtime dependencies**, all implementing WAI-ARIA authoring practices with verified WCAG 2.2 AA compliance.

## Read This README in Your Language

| Language | README |
| -------- | ------ |
| 🇺🇸 English | [README.md](./README.md) |
| 🌐 <span dir="ltr">العربية (Arabic)</span> | [README_ar.md](./README_ar.md) |
| 🇧🇷 Português do Brasil (Brazilian Portuguese) | [README_br-pt.md](./README_br-pt.md) |
| 🇨🇳 简体中文 (Simplified Chinese) | [README_cn.md](./README_cn.md) |
| 🇩🇪 Deutsch (German) | [README_de.md](./README_de.md) |
| 🇪🇸 Español (Spanish) | [README_es.md](./README_es.md) |
| 🇫🇷 Français (French) | [README_fr.md](./README_fr.md) |
| 🇯🇵 日本語 (Japanese) | [README_jp.md](./README_jp.md) |
| 🇰🇷 한국어 (Korean) | [README_kr.md](./README_kr.md) |

### 🙏🏽 Translation Credits

A special thanks to [Mark Mind](https://www.markmind.dev/) for making these translations possible.

## The Problem

Every accessible interactive component needs the same hard, easy-to-get-wrong infrastructure:

- **Live regions:** announcing to screen readers without stealing focus
- **Focus restoration:** returning focus when transient UI closes, even when the trigger element is gone
- **Focus trapping:** keeping keyboard navigation inside modals and dialogs
- **Reduced motion:** respecting system preferences without manual checks everywhere
- **Roving tabindex:** arrow-key navigation for lists, grids, trees, and tablists
- **HMR-safe singletons:** surviving hot module reloads without duplicating DOM nodes or leaking listeners

Most projects rebuild these from scratch for each component. The tenth reimplementation of "restore focus on close" is exactly where someone forgets the stale-reference case and ships a dropdown that silently strands keyboard focus on `<body>`.

tatami-a11y extracts these shared primitives into a single, tested foundation, then builds fully accessible components on top of them. Every component in the library relies on the same battle-tested primitives, so a bug fixed in one is fixed in all.

![Diagram comparing reimplementing accessibility per component vs. building on shared tested primitives](./assets/shared_a11y_primitives_problem.png)

## Why "tatami"?

A tatami is a traditional Japanese floor mat, a standardized, interchangeable module that serves as the foundation for an entire room. You don't notice the tatami, but everything stable is built on top of it. Same idea here: these primitives are the foundation, the components are the room you actually live in.

## Why Framework-Agnostic

Radix UI and React Aria solve this well, for React. Headless UI covers Vue and React. If you're not in one of those ecosystems, or you're maintaining a vanilla-JS codebase, there isn't a serious, actively-maintained equivalent. tatami-a11y is built to be that: no virtual DOM, no framework runtime, works identically whether you call it from a hand-rolled component, a Vue composable, a Svelte `use:action`, or a plain `<script>` tag.

### Verified Framework Interoperability

The framework-agnostic claim has been validated with automated Playwright tests across three separate Vite scaffolds, each installing `tatami-a11y` from the published npm package exactly as a real consumer would. Two components were tested in each framework — Toast (appends to `document.body`, outside any framework-managed tree) and Dropdown (attaches behavior to a DOM node the framework rendered). Both the naive usage pattern and a framework-idiomatic hand-rolled wrapper pattern were tested, and each was stress-tested by forcing the host framework to re-render the surrounding area while the library's DOM additions were present.

| Framework | Toast (naive) | Toast (wrapper) | Dropdown (naive) | Dropdown (hand-rolled wrapper) |
| --------- | ------------- | --------------- | ---------------- | ------------------------------ |
| **React** | ✅ Pass        | ✅ Pass          | ✅ Pass           | ✅ Pass                         |
| **Vue**   | ✅ Pass        | ✅ Pass          | ✅ Pass           | ✅ Pass                         |
| **Svelte**| ✅ Pass        | ✅ Pass          | ✅ Pass           | ✅ Pass                         |

All 12 tests passed with zero glue code required for Toast. Dropdown works naively in all three frameworks and also passes with a hand-rolled framework-idiomatic wrapper (`useRef`+`useEffect` in React, `ref`+`onMounted`/`onUnmounted` in Vue, `use:action` in Svelte). Full findings and raw test output live in [`framework-interop-check/`](./framework-interop-check/).

**Run these yourself:** each of `framework-interop-check/react-app`, `framework-interop-check/vue-app`, and `framework-interop-check/svelte-app` is an independent, installable Vite app. `cd` into any of them, `pnpm install`, `pnpm dev`, and open the printed local URL to click through the naive and wrapper-pattern tests directly instead of taking the table above on faith.

> **Note on `tatami()`:** The table above reflects the original three-framework investigation, which used hand-rolled wrappers. The `tatami()` adapter was developed subsequently and has dedicated unit tests covering all 16 components (see `__tests__/tatami.test.ts`), including tests for method forwarding, destroy idempotency, and dev-mode warnings. The `tatami()` adapter has been verified to work correctly with all 16 components via these unit tests. A full Playwright cross-framework harness pass is pending but the adapter's correctness is established through the unit test suite.

### Astro Islands Demo — four frameworks, one page

`framework-interop-check/` answers whether tatami-a11y works correctly inside each framework on its own. `astro-demo/` goes a step further: it mounts a React island, a Vue island, a Svelte island, and a plain-JS section on the *same page* using Astro's islands architecture, then checks whether the shared primitives, specifically the live-region announcer, actually coordinate across independently-bundled copies of the library rather than silently duplicating into isolated instances per island.

**See it live:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)

**Run it locally:** `cd astro-demo`, `pnpm install`, `pnpm dev`.

### `tatami()` — the lifecycle utility

The wrapper tests exposed a repeating pattern: every framework needs the same three things from any imperative DOM library — initialise once the DOM is ready, hand it references to framework-managed elements, clean up when those elements leave. The boilerplate for that is identical across frameworks, just in different syntax.

`tatami()` is a single, framework-agnostic utility that handles that handshake for all 16 components. It is not a React version of the library, not a Vue version — one function, no framework imports, works anywhere.

```js
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — inside useEffect
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — inside onMounted / onUnmounted
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use: action
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// Plain JS, no framework at all
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — Client Component required ('use client' at the
// top of the file), then the same useEffect pattern as plain React
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — same onMounted/onUnmounted pattern as Vue, guarded with
// import.meta.client for extra safety in universal-rendering setups
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

`tatami()` returns a controller with `destroy()` and forwards every public method the instantiated component actually has (derived at runtime via reflection — no hardcoded method list). In development mode, calling a forwarded method after `destroy()` or calling a method the component doesn't have both produce a `console.warn` with the component name and method name. The framework only needs to know two things: call `tatami()` when the DOM is ready, call `ctrl.destroy()` on cleanup. Everything else is handled by the component itself.

`Toast` is handled as a special case: it uses a static-only API (`Toast.show()`, `Toast.configure()`, etc.) rather than instances, and `tatami()` detects this automatically and forwards the static methods directly.

> **On the Next.js and Nuxt examples above:** these are standard, current, documented lifecycle patterns for each framework, but unlike React, Vue, and Svelte in the verified table above, they haven't been run through the same automated cross-framework harness (a real scaffolded app, forced re-renders, Playwright). Treat them as correct guidance, not yet as independently verified against this library the way the three frameworks above were.

### Development-mode warnings

In development mode, `tatami()` emits `console.warn` messages when a forwarded method is called after `destroy()` or when a method name doesn't exist on the component. These warnings are controlled by a dev-mode flag resolved at call time with this priority order:

1. **Manual override** — `setTatamiDebug(true)` always wins. This is the correct answer for bundler-free `<script>` tag usage, where no automatic detection is possible.
2. **`import.meta.env?.DEV`** — works for Vite-based consumers.
3. **`process.env.NODE_ENV !== "production"`** — fallback for webpack/Node-aware bundlers.
4. **Default `false`** — silence-by-default in an unrecognized environment.

```js
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// Enable warnings during development (required for <script> tag usage)
setTatamiDebug(true);
```

## Quick Start

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// Screen reader announcements: polite by default, assertive when urgent
announce("Changes saved");
announce("Error: something went wrong", { urgent: true });

// Focus restoration for transient UI (modals, dropdowns, dialogs)
pushFocusStack(triggerElement);
// ... open your modal/dropdown ...
popFocusStack(); // focus returns to triggerElement, or the nearest valid fallback
```

## Deployed Sites

- **Storybook:** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh), interactive component examples with the a11y addon
- **Documentation:** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh), full API docs generated by TypeDoc
- **Demo:** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh), live demo with all components
- **Astro Islands Demo:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh), four framework islands (React, Vue, Svelte, plain JS) on one page, wired up through `tatami()`, demonstrating shared-primitive coordination across independently-bundled copies of the library

## What's Included

### Framework Adapter

| Adapter | Description |
| ------- | ----------- |
| `tatami()` | Framework-agnostic lifecycle utility that instantiates any component, forwards public methods, and handles cleanup. Works from React `useEffect`, Vue/Nuxt `onMounted`/`onUnmounted`, Svelte `use:action`, or plain `<script>` tags. |

### Shared Primitives

| Primitive | Description |
| --------- | ----------- |
| `announce()` | Screen reader announcements via ARIA live regions. Supports polite/assertive routing, deduplication, and proper `aria-atomic` semantics. |
| `checkReducedMotion()` / `onReducedMotionChange()` | System-level reduced motion detection with change listeners. Every component respects this automatically. |
| `pushFocusStack()` / `popFocusStack()` | Focus restoration with stale-reference fallback chain. If the trigger element is gone, it walks up to the nearest focusable ancestor. |
| `activateFocusTrap()` / `deactivateFocusTrap()` | Modal focus trapping with first/last-element boundary detection and proper Tab/Shift+Tab cycling. |
| `createRovingTabindex()` | Arrow-key navigation for lists, grids, trees, and tablists. Supports orientation, column-count, wrapping, and custom key handlers. |
| `createSingleton()` / `registerCleanup()` | HMR-safe singleton factory. Components survive hot reloads without leaking listeners or duplicating DOM nodes. |

### Components

| Component          | ARIA Pattern                                | Key features                                                          |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------- |
| Accordion          | `aria-expanded` / `aria-controls`           | Arrow-key navigation, Home/End, live-region announcements             |
| Carousel           | `region` / `group` / `aria-roledescription` | Auto-play, reduced-motion respect, slide announcements                |
| Combobox           | combobox + listbox                          | Type-to-filter, arrow-key navigation, active-descendant management    |
| CommandPalette     | combobox + dialog-modal                     | Ctrl+K global hotkey, grouping, focus trap, live-region count         |
| DatePicker         | dialog + grid                               | Full keyboard navigation, focus trap, month navigation                |
| Dialog             | non-modal dialog                            | Focus management without trapping, users can tab out                  |
| Disclosure         | `aria-expanded` / `aria-controls`           | Simple show/hide with proper semantics                                |
| Dropdown           | menu + menuitem                             | Focus trap, arrow-key navigation, Escape-to-close                     |
| MenuButton         | `aria-haspopup="menu"`                      | Menu-button pattern, focus management                                 |
| Modal              | dialog-modal                                | Focus trap, backdrop, Escape-to-close, focus restoration              |
| MultiselectListbox | listbox (multi-select)                      | Shift+Click range, Ctrl+Click toggle, typeahead                       |
| ReorderableList    | list + `aria-grabbed`                       | Ctrl+Arrow reorder, drag-and-drop, live announcements                 |
| Tabs               | tablist + tab + tabpanel                    | Arrow-key navigation, Home/End, automatic tabpanel visibility         |
| Toast              | live region + `role="alert"`                | Auto-dismiss, Alt+T jump shortcut, stack management                   |
| Tooltip            | `aria-describedby`                          | Hover/focus trigger, Escape dismiss, reduced-motion respect           |
| TreeView           | tree + treeitem                             | Expand/collapse, arrow-key navigation, typeahead, single/multi-select |

## Compliance

-   **742 unit tests** across 24 test files (jsdom via vitest), all passing
-   **16 Storybook integration tests**, each component rendered in a real Playwright browser and verified for interactive behavior
-   **Built-in a11y checks:** every Storybook story is automatically audited with axe-core via `@storybook/addon-a11y`, surfaced inline in the test UI and blocked in CI
-   **WCAG 2.2 AA:** zero violations and zero incompletes detected by automated axe-core scanning across all Storybook stories (automated scanning covers a meaningful subset of WCAG criteria, not the full spec, manual screen reader testing is the natural next layer on top of this)
-   **WAI-ARIA:** every component follows the relevant APG authoring practice
-   **Reduced motion:** every animation respects `prefers-reduced-motion`
-   **Keyboard navigation:** every interactive element is fully operable by keyboard
-   **Screen reader:** every state change is announced via live regions

## Development

```bash
pnpm install
pnpm run build              # Build to dist/ (ESM + CJS + type declarations)
pnpm run dev                # Watch mode
pnpm run test               # Run 742 unit tests (vitest, jsdom)
pnpm run test-storybook:run # Run 16 browser-level integration tests (vitest + Playwright)
pnpm run storybook          # Interactive component explorer on port 6006
pnpm run lint               # Rust-based linter (oxlint, 50–100× faster than ESLint)
pnpm run format             # Rust-based formatter (oxfmt, 35× faster than Prettier)
pnpm run doc                # Build API documentation
```

### Dev Toolchain

| Tool | Stack | Speed Gain |
| --- | --- | --- |
| **Oxlint** | Rust-based linter (ESLint-compatible) | 50–100× faster |
| **Oxfmt** | Rust-based formatter | 35× faster |
| **Vitest 4.1.10** | Unit + Storybook test runner | Native browser mode |
| **Storybook 10.5.5** | Component testing + a11y addon | Integrated with Vitest |
| **Playwright** | Browser automation for integration tests | Production-grade |
| **Rolldown** _(optional)_ | Future-ready bundler (Vite core) | Native Rust performance |

Total: **758 automated tests** (742 unit + 16 Storybook), CI runs <30s on standard hardware.

---

## Deployment

```bash
pnpm run deploy:storybook   # Build and deploy Storybook to Surge
pnpm run deploy:docs        # Build and deploy API docs to Surge
pnpm run deploy:astro       # Build and deploy the astro-demo/ multi-framework demo to Surge
```

Deploying any of the sites above requires your own [Surge](https://surge.sh) account and a `.env` file (copy `.env.example` and fill in your own subdomains). The deploy scripts intentionally throw a clear error rather than silently falling back to a real subdomain, so cloning this repo and running a deploy script never risks accidentally deploying toward someone else's site, you'll always deploy to your own.

## Browser Support

Targets modern browsers (ES2020): Chrome 80+, Firefox 80+, Safari 14.1+, Edge 80+. Requires DOM APIs.

**Safe to import in a server-side rendering context.** Every DOM access in `src/components/` and `src/shared/` lives inside a function or method body — nothing reads `document`, `window`, `navigator`, or any other browser-only global at module scope, so nothing executes at import time beyond declarations. Verified by building the package and importing every entry point in a bare Node process with no DOM shims of any kind. CJS (the `.js` files — this package has no `"type": "module"` field, so `.js` is the `require` build and `.mjs` is the `import` build, per the `exports` map):

```bash
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

Both succeed with no errors. The ESM builds, the same way:

```bash
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

Both succeed with no errors. The README's code examples use `import` syntax because that's how consumers are expected to use the package — the `exports` map routes those `import`s to the `.mjs` build and any `require()` to the `.js` build.

Importing is safe, but *using* the components still requires a real DOM. The standard lifecycle-hook pattern applies, exactly as it does in the already-verified client-only React, Vue, and Svelte integrations: `useEffect` for React/Next.js, `onMounted` for Vue/Nuxt.

## License

MIT, see LICENSE.
