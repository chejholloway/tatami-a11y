# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.2](https://github.com/chejholloway/tatami-a11y/compare/v1.2.1...v1.2.2) (2026-08-04)

### [1.2.1](https://github.com/chejholloway/tatami-a11y/compare/v1.2.0...v1.2.1) (2026-08-04)


### Features

* **a11y:** 🏷️ add data-tatami-component attribute to all 16 components, 🧪 add attribute verification tests for all 16 components, 📝 add README warning about unreleased core library dependency ([afe0db6](https://github.com/chejholloway/tatami-a11y/commit/afe0db6bf2caef2898b897e64c3221c67aeed9d6))
* migrate favicon to SVG and enhance docs with logo ([f19c0bd](https://github.com/chejholloway/tatami-a11y/commit/f19c0bd75fa2e0397382ae6d8d76c62e41a2c43b))

## [1.2.0](https://github.com/chejholloway/tatami-a11y/compare/v1.1.0...v1.2.0) (2026-08-02)

### [1.0.6](https://github.com/chejholloway/tatami-a11y/compare/v1.0.5...v1.0.6) (2026-07-31)

### [1.0.5](https://github.com/chejholloway/tatami-a11y/compare/v1.0.4...v1.0.5) (2026-07-31)

### [1.0.4](https://github.com/chejholloway/tatami-a11y/compare/v1.0.3...v1.0.4) (2026-07-31)

### [1.0.3](https://github.com/chejholloway/tatami-a11y/compare/v1.0.2...v1.0.3) (2026-07-31)

### Features

- **a11y:** 🎭 add Storybook test-runner with axe-core browser-level a11y checks, ♿ fix combobox missing `role="combobox"`, 🧪 update unit test assertion, 🔧 add orchestration and verbose scripts ([da62949](https://github.com/chejholloway/tatami-a11y/commit/da629491d1405c23b89a3d6fd2767b665c475f19))
- **a11y:** 🎭 add Storybook test-runner with axe-core browser-level a11y checks, ♿ fix combobox missing `role="combobox"`, 🧪 update unit test assertion, 🔧 add orchestration and verbose scripts ([fcdc23c](https://github.com/chejholloway/tatami-a11y/commit/fcdc23c50f4ce8601631f3e8295b4f125eadab90))

### [1.0.2](https://github.com/chejholloway/tatami-a11y/compare/v1.0.1...v1.0.2) (2026-07-30)

### [1.0.1](https://github.com/chejholloway/tatami-a11y/compare/v1.0.0...v1.0.1) (2026-07-30)

### Bug Fixes

- **a11y:** 🎨 fix WCAG AA color contrast on toast buttons, carousel slides, dark mode tabs, and command palette, ♿ add aria-expanded init, manage datepicker aria-hidden, add live region roles, 🔄 migrate all story imports and test script to .mjs, 🗑️ remove redundant aria-expanded from a11y test fixture ([502c706](https://github.com/chejholloway/tatami-a11y/commit/502c70655a3b4258bb93f5e1f96b766a0014115b))
- **demo:** 🎨 fix kbd opacity contrast in demo/index.html, 🔧 update package.json entry points and metadata, 📝 polish README ([4863042](https://github.com/chejholloway/tatami-a11y/commit/4863042f308dea5efe1b67186b53b411eefa8df7))
- **storybook:** 🎭 fix version mismatch and JavaScript functionality across 16 components ([3129f31](https://github.com/chejholloway/tatami-a11y/commit/3129f31885d1871168fc0f449627dcba2ab7734b))

## [1.0.0](https://github.com/chejholloway/tatami-a11y/compare/v0.2.1...v1.0.0) (2026-07-30)

### Features

- **components:** ✨ add MultiselectListbox component with tests and demo, 🔀 add drag-and-drop to ReorderableList, 📝 document MultiselectListbox in README, 🎨 add MSL + DnD demo styles, 🐛 fix missing Reorderable List demo section, 🐛 fix draggable attribute reset ([35c11ee](https://github.com/chejholloway/tatami-a11y/commit/35c11ee5a58634654b56cbb61f9d31b4821d2443))
- **components:** ✨ add MultiselectListbox with tests, Storybook stories, and demo, 🔀 add drag-and-drop to ReorderableList, 📝 set up Docusaurus docs site, 🎨 add retro themes (Win2K/98/7) and demo styles, 🐛 fix missing ReorderableList import in demo index.html, 🔧 add CI, ESLint, Prettier, Husky, and pnpm workspace config ([f23308c](https://github.com/chejholloway/tatami-a11y/commit/f23308c17b8a5974a685480a5b3122688b32047b))
- **components:** 🔀 add ReorderableList with tests and demo, 📝 add TreeView + ReorderableList docs to README, 🐛 fix ComboBox click selection with filtered list, 📅 update DatePicker demo to MM/DD/YYYY, 🎨 add reorderable list styles ([ff4f3ed](https://github.com/chejholloway/tatami-a11y/commit/ff4f3edfdee1331ac12cba207d566abbeb288984))
- **components:** 🔀 add ReorderableList with tests and demo, 📝 add TreeView + ReorderableList docs to README, 🐛 fix ComboBox click selection with filtered list, 📅 update DatePicker demo to MM/DD/YYYY, 🎨 add reorderable list styles ([3764b25](https://github.com/chejholloway/tatami-a11y/commit/3764b25dbd85585b9d937b995746d14224b96748))
- **docs:** 📝 add Storybook, Docusaurus, CI, and retro theme documentation to README, 🐛 fix drag-and-drop not working in demo by enabling dragAndDrop option, 🔥 comment out theme switcher in demo until font assets are ready, 🔀 document ReorderableList drag-and-drop usage in README, 📋 add code quality and CI pipeline sections to README, 🎨 expand development section with all project commands and tooling ([976b564](https://github.com/chejholloway/tatami-a11y/commit/976b564c55e99169f02485739f8b312c09b6ffc4))

### Bug Fixes

- **tree-view:** 🐛 fix ctrl+click test for post-expansion indices, 🌳 add demo section with single/multi-select, 🎨 add tree view styles ([30ba5c4](https://github.com/chejholloway/tatami-a11y/commit/30ba5c43094a28576a7ea58f860cc1db06575c60))

### 0.2.1 (2026-07-29)

### Features

- add accessible Dropdown and Tabs components ([ca151de](https://github.com/chejholloway/tatami-a11y/commit/ca151ded971ef15820ab58fe8f2208cb0441fa95))
- **components:** 🍞 Add Toast notification component ([e842eca](https://github.com/chejholloway/tatami-a11y/commit/e842eca9a12ee01129572d2259724408ac8558fa))
- **components:** add Tooltip, Carousel, Dialog, and Disclosure components ([1171394](https://github.com/chejholloway/tatami-a11y/commit/1171394d4ba2d28ad7f59d036a15414983dfc81f))

### Bug Fixes

- **components:** 🔧 fix event listener cleanup in dropdown and tabs components ([8ae006a](https://github.com/chejholloway/tatami-a11y/commit/8ae006a1cc503c895953dc8a08a07c94f26f8aa9))
- **demo:** 🎨 toast button colors, disclosure purple, carousel display reset ([f4fff86](https://github.com/chejholloway/tatami-a11y/commit/f4fff86d2fbbdc49717942410b0353e9c9887af4)), closes [#7c3](https://github.com/chejholloway/tatami-a11y/issues/7c3)

## [0.3.0] — 2026-07-29

### Added

- **`DatePicker`** — Full WAI-ARIA Date Picker Dialog pattern. `role="grid"` calendar with roving `tabindex`, `aria-current="date"` on today, `aria-selected` on the chosen day, live region on the month heading, focus trap + focus stack. Keyboard: all Arrow keys for 2D grid navigation, `PageUp`/`PageDown` for month, `Shift+Page` for year, `Home`/`End` for week boundary, `Ctrl+Home`/`Ctrl+End` for month boundary. Supports `minDate`/`maxDate`, `dateFormat` (`YYYY-MM-DD` | `MM/DD/YYYY` | `DD/MM/YYYY`), `onOpen`/`onClose`/`onSelect`/`onMonthChange` callbacks, and public `setValue`/`clearValue`/`getSelectedDate` API.
- **`CommandPalette`** — Accessible `Ctrl+K` command palette. `aria-activedescendant` tracks the highlighted result without moving DOM focus off the input (the hard part). Live region announces result counts as you type. Grouped commands use `role="group"` + `aria-labelledby`. Descriptions get `aria-describedby`. Full keyboard navigation (Arrow, Enter, Escape), focus trap + stack, configurable hotkey, backdrop support. Public `setCommands`/`addCommand`/`removeCommand` API for async command loading.

### Tests

- Total tests: 428 → 560 (31% increase).
- `DatePicker`: 66 tests covering constructor ARIA setup, open/close lifecycle, idempotency, month navigation (including year wrap and Shift+Page year jump), day selection via click and Enter, all Arrow/Home/End/PageUp/PageDown keyboard patterns, min/max constraint enforcement, public API (`setValue`/`clearValue`/`getSelectedDate`), leap year handling, reduced motion, and destroy.
- `CommandPalette`: 66 tests covering constructor ARIA setup, open/close lifecycle, idempotency, filtering (default + custom filter + description match), status region updates, "No results" state, option ARIA semantics (unique ids, aria-describedby, role="group"), keyboard navigation (Arrow wrapping, Enter execution, Escape), click interaction, hotkey (Ctrl+K, Meta+K, custom), public command management API, reduced motion, destroy, and edge cases.

## [0.2.0] — 2026-07-29

### Added

- **`Tooltip`** — Accessible tooltip component. Wires `aria-describedby`, handles hover + keyboard focus, dismisses on `Escape`, auto-generates `id` when none is present, respects `prefers-reduced-motion`.
- **`Carousel`** — Accessible carousel/slider. WAI-ARIA `region`/`group` pattern, play/pause control, screen reader announcements via the shared announcer, auto-disables rotation when `prefers-reduced-motion` is active.
- **`Dialog`** (non-modal) — Accessible floating panel using `role="dialog"` with `aria-modal="false"`. Does not trap focus (unlike `Modal`), uses focus stack for graceful focus restoration on close, dismisses on `Escape`.
- **`Disclosure`** — Accessible show/hide toggle. Correctly wires `aria-expanded` + `aria-controls`, auto-generates `id` on the content element, respects `prefers-reduced-motion`.

### Changed

- **`Tooltip`** — `onShow`/`onHide` options renamed to `onOpen`/`onClose` for consistency with all other components. The old names are kept as deprecated aliases and will be removed in a future major version.
- **`Accordion`** — Added defensive null-checks when resolving `aria-controls` panel references. Previously threw when panels were missing from the DOM; now handles gracefully.
- **`Tabs`** — Added defensive null-checks when resolving `aria-controls` panel references (same fix as Accordion).

### Documentation

- Added full API documentation for `Tooltip`, `Carousel`, `Dialog`, and `Disclosure` in the README, including required HTML structure, keyboard behaviour, and public method tables.
- Added "Building Custom Components" section to the README with a concrete slide-over panel example showing how to compose the shared primitives directly.

### Tests

- Expanded test suite from 315 → 428 tests (36% increase).
- `Tooltip`: 9 → 33 tests. Added coverage for: idempotent show/hide, keyboard navigation (Escape + unrelated keys), callback conventions, destroy cleanup, reduced motion, and edge cases (rapid cycles, multiple instances).
- `Carousel`: 7 → 44 tests. Added coverage for: ARIA attribute setup, `goToSlide` wrapping, button click interactions, play/pause state management, `setInterval`/`clearInterval` lifecycle, single/multi-slide edge cases, missing control buttons.
- `Dialog`: 7 → 35 tests. Added coverage for: ARIA attribute setup, open/close idempotency, focus management (first focusable child, fallback to dialog itself), focus restoration, Escape key, non-trapping focus assertion, callbacks, destroy cleanup, edge cases.
- `Disclosure`: 6 → 30 tests. Added coverage for: `expand`/`collapse`/`toggle` public API, idempotency, callback ordering, destroy cleanup, reduced motion, auto-id generation uniqueness, edge cases (rapid cycles, nested focusable children).

---

## [0.1.0] — Initial release

### Added

- **`announce(message, options)`** — Screen reader announcer using ARIA live regions. Routes to polite or assertive region based on urgency.
- **`checkReducedMotion()`** / **`onReducedMotionChange(callback)`** — Detect and react to `prefers-reduced-motion`.
- **`pushFocusStack`** / **`popFocusStack`** / **`setInitialFocusReference`** / **`clearFocusStack`** — Focus restoration stack with stale-reference fallback chain.
- **`activateFocusTrap(container)`** / **`deactivateFocusTrap()`** — Focus trapping for modal/dialog containers.
- **`createSingleton(factory, key)`** / **`registerCleanup(key, fn)`** — HMR-safe singleton factory to prevent listener/DOM duplication during development.
- **`Dropdown`** — Accessible dropdown menu with keyboard navigation, focus trap, focus stack, and announcements.
- **`Tabs`** — Accessible tabs with keyboard navigation (Arrow, Home, End) and announcements.
- **`Modal`** — Accessible modal dialog with backdrop, focus trap, body scroll lock, and announcements.
- **`Accordion`** — Accessible accordion with single/multiple panel modes and keyboard navigation.
- **`Toast`** — Accessible toast notifications with auto-dismissal, hover/focus pause, Alt+T keyboard shortcut, configurable position, and HMR-safe singleton pattern.
- **`MenuButton`** — Accessible menu button following the ARIA `button` + `menu` pattern.
- **`Combobox`** — Accessible combobox/autocomplete with filtering, keyboard navigation, and announcements.

[Unreleased]: https://github.com/your-username/tatami-a11y/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-username/tatami-a11y/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-username/tatami-a11y/releases/tag/v0.1.0
