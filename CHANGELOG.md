# Changelog

All notable changes to tatami-a11y are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
