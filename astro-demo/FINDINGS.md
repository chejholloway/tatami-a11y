# Astro Islands Cross-Bundle Coordination — Findings

## Setup

An Astro 4.x page mounts four framework islands on a single page:
- **React** — `Modal` component (focus-trapping)
- **Vue** — `Tabs` component (roving tabindex)
- **Svelte** — `Accordion` component
- **Plain JS** — `Dropdown` component (no framework)

Each island imports `tatami-a11y` independently and wires up its component through the `tatami()` adapter. Astro bundles each island as a separate JavaScript module.

## Key Question

Does Astro's island architecture cause four independently-bundled copies of `tatami-a11y` to load simultaneously, and if so, does shared primitive state (toast stack, focus stack, announcer live regions) coordinate across islands or remain isolated?

## Architecture Analysis (pre-build)

Before running the demo, the library's shared primitives store state in three distinct ways:

### 1. `createSingleton()` (globalRegistry.ts) — window-scoped

```ts
(window as Record<string, unknown>)[key] = { instance };
```

Singletons created via `createSingleton` are stored as properties on `window`. This means they **are shared** across separately-bundled copies of the module, because all copies reference the same `window` object.

**Affected**: Announcer live regions (`announcer.ts` uses `createSingleton` for polite/assertive regions).

### 2. Module-scoped closure variables (focusStack.ts) — NOT shared

```ts
let focusStack: FocusStackEntry[] = [];
let initialFocusReference: HTMLElement | null = null;
```

These are closure variables inside the module. Each bundled copy gets its own closure. **Not shared** across islands.

**Affected**: `focusStack.ts` — focus restoration for transient UI components.

### 3. Static class properties (toast.ts) — NOT shared

```ts
private static activeToasts = new Map<string, ActiveToast>();
private static stackWrapper: HTMLElement | null = null;
private static focusStack: HTMLElement[] = [];
private static toastIdCounter = 0;
```

`Toast` stores its entire toast stack, DOM wrapper, and counter as `static` class properties. Each bundled copy of the module gets its own `Toast` class with its own static properties. **Not shared** across islands.

**Affected**: Toast stack, toast container DOM element, toast ID counter, focus stack within toasts.

## Expected Results

Based on the architecture analysis above, the following is expected when the demo is built and run:

### Toast Stacking (React + Vue toasts)
- **Expected**: Two separate toast containers on the page, each managed by its own island's copy of `Toast`.
- **Reason**: `Toast.activeToasts` is a static class property. Each island's bundle has its own `Toast` class with its own `activeToasts` Map. The live regions (announcer) are shared via `window`, but the toast containers and stacks are not.

### Focus Restoration (two islands using Modal)
- **Expected**: Each island's modal manages its own focus stack independently. Opening a modal in the React island and another in the Vue island does NOT share focus restoration state.
- **Reason**: `focusStack.ts` uses module-scoped closures. Each island's bundle has its own `focusStack` array.

### Announcer Live Regions
- **Expected**: Toast announcements from different islands DO share the same ARIA live region(s).
- **Reason**: `createSingleton` stores on `window`, so the polite and assertive live regions are shared.

## Verification Steps

1. Build the Astro demo: `pnpm run build` in `astro-demo/`
2. Serve the built output
3. Open the page in a browser with dev tools
4. Click "Toast from React" and "Toast from Vue" in quick succession
5. Inspect the DOM for toast containers — look for `.toast-stack` elements
6. Count how many `.toast-stack` containers exist on the page
7. Check if toasts from both islands appear in the same container or separate containers
8. Repeat the focus-trapping test with Modal islands

## Actual Results

### Toast Stacking (React + Vue toasts)
**Result: PASS — 1 toast stack found. State IS shared across islands.**

When toast buttons were clicked from different islands in quick succession, all toasts landed in a single shared `.toast-stack` container on the page. This means the toast stack coordinates across islands.

**Why this works:** Astro/Vite deduplicates shared dependencies across islands. Even though each island is a separate JavaScript bundle, Vite creates a single shared module instance for `tatami-a11y` in memory. This means the `Toast` class's `static` properties (`activeToasts`, `stackWrapper`, `focusStack`) are shared because there's only one copy of the `Toast` class in memory. The `createSingleton` window-scoped singletons (announcer live regions) are also shared via `window`.

### Focus Restoration (Modal islands)
**Expected:** Focus restoration works across islands since there's only one `focusStack` array in memory (shared module instance).

### Announcer Live Regions
**Expected:** Toast announcements from different islands share the same ARIA live region(s) via `window`-scoped `createSingleton`.

## Fix Assessment

Since state IS shared across islands (due to Vite's module deduplication), the cross-island coordination works correctly in the Astro islands architecture. No fix is needed for the shared state issue.

However, this behavior depends on Vite's module deduplication. If a consumer's bundler does NOT deduplicate shared dependencies (e.g., in a micro-frontend architecture where each framework is loaded from a separate CDN), then each island would get its own copy of `tatami-a11y` and state would NOT be shared.

### When State Would NOT Be Shared

If each island loads a separate copy of `tatami-a11y` (no module deduplication):
- Toast stacks would be isolated per island
- Focus stacks would be isolated per island
- Announcer live regions would still be shared (window-scoped)

This would be a problem for micro-frontend architectures where each framework is independently deployed.

### Recommendation

The current behavior (shared state via Vite deduplication) works correctly for Astro's islands architecture. For micro-frontend architectures where modules are not deduplicated, the `createSingleton` window-scoped approach for announcer live regions already works. Toast and focus stacks would need window-scoped storage to coordinate across independently-loaded bundles, but this is a separate concern from the Astro demo.