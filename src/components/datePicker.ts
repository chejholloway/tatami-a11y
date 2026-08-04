/**
 * Accessible Date Picker Component
 *
 * This is one of the most consistently broken components on the web from an
 * a11y perspective. Most implementations fail on at least one of these:
 *   - Screen readers don't know which day is "today" vs "selected"
 *   - Arrow keys don't navigate the calendar grid
 *   - The month/year nav buttons have no accessible names
 *   - Focus is silently dropped when the month changes
 *   - The input and calendar aren't connected via aria-controls
 *
 * This implementation follows the WAI-ARIA Date Picker Dialog pattern:
 *   https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
 *
 * Key ARIA semantics:
 *   - role="dialog" with focus trap when the calendar is open
 *   - role="grid" / role="row" / role="gridcell" for the calendar
 *   - aria-selected on the selected day
 *   - aria-current="date" on today
 *   - aria-label on every cell: "15 January 2026"
 *   - Live region announcement when the visible month changes
 *   - aria-live on the month heading so changes are announced
 */

import { activateFocusTrap, deactivateFocusTrap } from "../shared/focusTrap.js";
import { pushFocusStack, popFocusStack, setInitialFocusReference } from "../shared/focusStack.js";
import { announce } from "../shared/announcer.js";
import { checkReducedMotion } from "../shared/reducedMotion.js";
import { createRovingTabindex } from "../shared/rovingTabindex.js";
import type { RovingTabindexController } from "../shared/rovingTabindex.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Options for configuring the {@link DatePicker} component.
 */
export interface DatePickerOptions {
  /** The text input that shows the selected date. */
  input: HTMLInputElement;
  /** The calendar dialog container. */
  dialog: HTMLElement;
  /** Button that opens and closes the calendar. */
  toggleButton: HTMLElement;
  /** The element where the month/year heading renders — updated dynamically. */
  monthYearLabel: HTMLElement;
  /** Button to go to the previous month. */
  prevMonthButton: HTMLElement;
  /** Button to go to the next month. */
  nextMonthButton: HTMLElement;
  /** The grid element that receives the day cells. */
  calendarGrid: HTMLElement;
  /**
   * Date format for the input value.
   * @default 'YYYY-MM-DD'
   */
  dateFormat?: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  /** Earliest selectable date. */
  minDate?: Date;
  /** Latest selectable date. */
  maxDate?: Date;
  /** Called when the calendar dialog opens. */
  onOpen?: () => void;
  /** Called when the calendar dialog closes. */
  onClose?: () => void;
  /**
   * Called when a date is committed (Enter key or click).
   *
   * @param date - The selected Date object
   * @param formatted - The formatted date string
   */
  onSelect?: (date: Date, formatted: string) => void;
  /**
   * Called when the visible month changes.
   *
   * @param year - The new view year
   * @param month - The new view month (0-based)
   */
  onMonthChange?: (year: number, month: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS_IN_WEEK = 7;

// Full month names — used in aria-labels and announcements
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_NAMES_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const clamp = (date: Date, min?: Date, max?: Date): Date => {
  if (min && date < min) return new Date(min);
  if (max && date > max) return new Date(max);
  return date;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// ─── DatePicker class ────────────────────────────────────────────────────────

/**
 * An accessible date picker component following the WAI-ARIA Date Picker Dialog pattern.
 *
 * Displays a calendar grid in a modal dialog with:
 * - `role="grid"` / `role="gridcell"` for the calendar layout
 * - `aria-selected` on the selected day
 * - `aria-current="date"` on today's cell
 * - Descriptive `aria-label` on every cell (e.g. "15 January 2026")
 * - Live region announcements when the visible month changes
 * - Focus trapping when the dialog is open
 * - Roving tabindex for grid keyboard navigation
 *
 * @example
 * ```typescript
 * const picker = new DatePicker({
 *   input: document.getElementById('date-input'),
 *   dialog: document.getElementById('date-dialog'),
 *   toggleButton: document.getElementById('date-toggle'),
 *   monthYearLabel: document.getElementById('date-heading'),
 *   prevMonthButton: document.getElementById('date-prev'),
 *   nextMonthButton: document.getElementById('date-next'),
 *   calendarGrid: document.getElementById('date-grid'),
 * });
 * ```
 */
export class DatePicker {
  private input: HTMLInputElement;
  private dialog: HTMLElement;
  private toggleButton: HTMLElement;
  private monthYearLabel: HTMLElement;
  private prevMonthButton: HTMLElement;
  private nextMonthButton: HTMLElement;
  private calendarGrid: HTMLElement;
  private dateFormat: NonNullable<DatePickerOptions["dateFormat"]>;
  private minDate?: Date;
  private maxDate?: Date;
  private onSelect?: (date: Date, formatted: string) => void;
  private onMonthChange?: (year: number, month: number) => void;
  private onOpen?: () => void;
  private onClose?: () => void;

  // State
  private isOpen: boolean = false;
  private selectedDate: Date | null = null;
  private focusedDate: Date = new Date(); // the day cell that has keyboard focus
  private viewYear: number = new Date().getFullYear();
  private viewMonth: number = new Date().getMonth(); // 0-based

  // Roving tabindex controller — manages grid keyboard navigation
  private roving!: RovingTabindexController;

  // Bound handlers — critical so removeEventListener works
  private toggleClickHandler = () => this.toggle();
  private prevMonthClickHandler = () => this.shiftMonth(-1);
  private nextMonthClickHandler = () => this.shiftMonth(1);
  private dialogKeydownHandler = (e: KeyboardEvent) => this.handleDialogKeyDown(e);
  private gridClickHandler = (e: MouseEvent) => this.handleGridClick(e);
  private inputChangeHandler = () => this.syncFromInput();

  /**
   * @param options - Configuration options for the date picker
   */
  constructor(options: DatePickerOptions) {
    this.input = options.input;
    this.dialog = options.dialog;
    this.toggleButton = options.toggleButton;
    this.monthYearLabel = options.monthYearLabel;
    this.prevMonthButton = options.prevMonthButton;
    this.nextMonthButton = options.nextMonthButton;
    this.calendarGrid = options.calendarGrid;
    this.dateFormat = options.dateFormat ?? "YYYY-MM-DD";
    this.minDate = options.minDate;
    this.maxDate = options.maxDate;
    this.onSelect = options.onSelect;
    this.onMonthChange = options.onMonthChange;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;

    this.init();
  }

  // ─── Setup ─────────────────────────────────────────────────────────────────

  private init(): void {
    this.dialog.setAttribute("data-tatami-component", "datePicker");
    // Input: type="text" with combobox role so it reads like a date field
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-haspopup", "dialog");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("autocomplete", "off");

    // Wire input to dialog via aria-controls
    if (!this.dialog.id) {
      this.dialog.id = `datepicker-dialog-${Math.random().toString(36).slice(2, 9)}`;
    }
    this.input.setAttribute("aria-controls", this.dialog.id);

    // Dialog
    this.dialog.setAttribute("role", "dialog");
    this.dialog.setAttribute("aria-modal", "true");

    // Month/year heading is a live region so navigating months announces
    this.monthYearLabel.setAttribute("role", "status");
    this.monthYearLabel.setAttribute("aria-live", "polite");
    this.monthYearLabel.setAttribute("aria-atomic", "true");

    // Prev/next buttons get meaningful labels (if not already set)
    if (!this.prevMonthButton.getAttribute("aria-label")) {
      this.prevMonthButton.setAttribute("aria-label", "Previous month");
    }
    if (!this.nextMonthButton.getAttribute("aria-label")) {
      this.nextMonthButton.setAttribute("aria-label", "Next month");
    }

    // Grid
    this.calendarGrid.setAttribute("role", "grid");
    this.buildColumnHeaders();

    // Roving tabindex — handles Arrow / Home / End grid navigation.
    // DatePicker overrides via beforeKey for keys that need month-boundary
    // awareness (PageUp/Down, Ctrl+Home/End) and for Enter/Escape.
    this.roving = createRovingTabindex({
      container: this.calendarGrid,
      selector: '[role="gridcell"]:not([aria-disabled="true"]):not([aria-hidden="true"])',
      orientation: "both",
      columns: 7,
      wrap: false,
      beforeKey: (e) => {
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            this.moveFocus(1);
            return true;
          case "ArrowLeft":
            e.preventDefault();
            this.moveFocus(-1);
            return true;
          case "ArrowDown":
            e.preventDefault();
            this.moveFocus(7);
            return true;
          case "ArrowUp":
            e.preventDefault();
            this.moveFocus(-7);
            return true;
          case "Home":
            e.preventDefault();
            if (e.ctrlKey) {
              this.moveToMonthBoundary(true);
            } else {
              this.moveToWeekBoundary(true);
            }
            return true;
          case "End":
            e.preventDefault();
            if (e.ctrlKey) {
              this.moveToMonthBoundary(false);
            } else {
              this.moveToWeekBoundary(false);
            }
            return true;
          case "PageUp":
            e.preventDefault();
            this.shiftMonth(e.shiftKey ? -12 : -1);
            return true;
          case "PageDown":
            e.preventDefault();
            this.shiftMonth(e.shiftKey ? 12 : 1);
            return true;
          case "Enter":
          case " ":
            e.preventDefault();
            this.commitDate(this.focusedDate);
            return true;
        }
        return false;
      },
      onActiveChange: (_index, element) => {
        const iso = element.getAttribute("data-date");
        if (iso) {
          const [y, m, d] = iso.split("-").map(Number);
          this.focusedDate = new Date(y, m - 1, d);
        }
      },
    });

    this.renderMonth();

    // Try to parse any existing input value
    this.syncFromInput();

    // Event listeners
    this.toggleButton.addEventListener("click", this.toggleClickHandler);
    this.prevMonthButton.addEventListener("click", this.prevMonthClickHandler);
    this.nextMonthButton.addEventListener("click", this.nextMonthClickHandler);
    this.dialog.addEventListener("keydown", this.dialogKeydownHandler);
    this.calendarGrid.addEventListener("click", this.gridClickHandler);
    this.input.addEventListener("change", this.inputChangeHandler);

    // Initially close
    this.closeDialog();
  }

  // ─── Column headers ─────────────────────────────────────────────────────────

  private buildColumnHeaders(): void {
    // Only build once — these never change
    const existing = this.calendarGrid.querySelector('[role="row"][data-header]');
    if (existing) return;

    const headerRow = document.createElement("div");
    headerRow.setAttribute("role", "row");
    headerRow.setAttribute("data-header", "true");

    DAY_NAMES_SHORT.forEach((short, i) => {
      const cell = document.createElement("div");
      cell.setAttribute("role", "columnheader");
      cell.setAttribute("aria-label", DAY_NAMES_LONG[i]);
      cell.textContent = short;
      headerRow.appendChild(cell);
    });

    // Prepend so it always sits above the day rows
    this.calendarGrid.insertBefore(headerRow, this.calendarGrid.firstChild);
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  private renderMonth(): void {
    // Remove old day rows, keep the column header
    const dayRows = Array.from(
      this.calendarGrid.querySelectorAll('[role="row"]:not([data-header])'),
    );
    dayRows.forEach((r) => r.remove());

    const today = new Date();
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const startDow = firstOfMonth.getDay(); // 0=Sun

    // Update the heading
    this.monthYearLabel.textContent = `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;

    // Update toggle button aria-label
    this.toggleButton.setAttribute(
      "aria-label",
      `Choose date, selected date is ${this.selectedDate ? this.formatDateLong(this.selectedDate) : "none"}`,
    );

    // Build a flat list of Date | null for the grid cells
    const cells: Array<Date | null> = [
      ...Array.from({ length: startDow }, () => null), // leading empty cells
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(this.viewYear, this.viewMonth, i + 1),
      ),
    ];

    // Pad to a full grid (multiple of 7)
    while (cells.length % DAYS_IN_WEEK !== 0) cells.push(null);

    // Render rows
    let row: HTMLElement | null = null;
    cells.forEach((date, i) => {
      if (i % DAYS_IN_WEEK === 0) {
        row = document.createElement("div");
        row.setAttribute("role", "row");
        this.calendarGrid.appendChild(row);
      }

      const cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");

      if (!date) {
        // Empty cell — outside the current month
        cell.setAttribute("aria-disabled", "true");
        cell.setAttribute("aria-hidden", "true");
      } else {
        const isDisabled = this.isDateDisabled(date);
        const isSelected = this.selectedDate ? isSameDay(date, this.selectedDate) : false;
        const isToday = isSameDay(date, today);

        cell.textContent = String(date.getDate());
        cell.setAttribute("aria-label", this.formatDateLong(date));
        cell.setAttribute("data-date", this.formatISO(date));

        if (isSelected) cell.setAttribute("aria-selected", "true");
        if (isToday) cell.setAttribute("aria-current", "date");
        if (isDisabled) {
          cell.setAttribute("aria-disabled", "true");
          cell.setAttribute("tabindex", "-1");
        }
        // Tabindex for enabled cells is managed by the roving tabindex primitive
      }

      row!.appendChild(cell);
    });

    // Update prevMonth / nextMonth button disabled states
    this.updateNavButtonStates();

    // Sync the roving tabindex with the new DOM
    this.roving.refresh();
    const cellIndex = this.findCellIndex(this.focusedDate);
    if (cellIndex >= 0) {
      this.roving.setActiveIndex(cellIndex, false);
    }
  }

  private findCellIndex(date: Date): number {
    const iso = this.formatISO(date);
    return this.roving.getItems().findIndex((el) => el.getAttribute("data-date") === iso);
  }

  private updateNavButtonStates(): void {
    if (this.minDate) {
      const firstOfView = new Date(this.viewYear, this.viewMonth, 1);
      const firstOfMin = new Date(this.minDate.getFullYear(), this.minDate.getMonth(), 1);
      const atMin = firstOfView <= firstOfMin;
      this.prevMonthButton.setAttribute("aria-disabled", atMin ? "true" : "false");
      if (atMin) {
        (this.prevMonthButton as HTMLButtonElement).disabled = true;
      } else {
        (this.prevMonthButton as HTMLButtonElement).disabled = false;
      }
    }

    if (this.maxDate) {
      const firstOfView = new Date(this.viewYear, this.viewMonth, 1);
      const firstOfMax = new Date(this.maxDate.getFullYear(), this.maxDate.getMonth(), 1);
      const atMax = firstOfView >= firstOfMax;
      this.nextMonthButton.setAttribute("aria-disabled", atMax ? "true" : "false");
      if (atMax) {
        (this.nextMonthButton as HTMLButtonElement).disabled = true;
      } else {
        (this.nextMonthButton as HTMLButtonElement).disabled = false;
      }
    }
  }

  // ─── Date utilities ─────────────────────────────────────────────────────────

  private isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) return true;
    if (this.maxDate && date > this.maxDate) return true;
    return false;
  }

  private formatDateLong(date: Date): string {
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }

  private formatISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private formatForInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    switch (this.dateFormat) {
      case "MM/DD/YYYY":
        return `${m}/${d}/${y}`;
      case "DD/MM/YYYY":
        return `${d}/${m}/${y}`;
      default:
        return `${y}-${m}-${d}`;
    }
  }

  private parseInputValue(value: string): Date | null {
    if (!value.trim()) return null;

    // Try to parse common formats in order
    const patterns: Array<[RegExp, (m: RegExpMatchArray) => Date]> = [
      [/^(\d{4})-(\d{2})-(\d{2})$/, (m) => new Date(+m[1], +m[2] - 1, +m[3])],
      [/^(\d{2})\/(\d{2})\/(\d{4})$/, (m) => new Date(+m[3], +m[1] - 1, +m[2])], // MM/DD/YYYY
      [/^(\d{2})\/(\d{2})\/(\d{4})$/, (m) => new Date(+m[3], +m[2] - 1, +m[1])], // DD/MM/YYYY — try both
    ];

    for (const [pattern, builder] of patterns) {
      const match = value.match(pattern);
      if (match) {
        const d = builder(match);
        // isNaN check: `new Date(2026, 1, 30)` silently overflows — that's a user error
        if (!isNaN(d.getTime())) return d;
      }
    }

    return null;
  }

  private syncFromInput(): void {
    const parsed = this.parseInputValue(this.input.value);
    if (parsed) {
      this.selectedDate = parsed;
      this.focusedDate = new Date(parsed);
      this.viewYear = parsed.getFullYear();
      this.viewMonth = parsed.getMonth();
      if (this.isOpen) this.renderMonth();
    }
  }

  // ─── Open / close ───────────────────────────────────────────────────────────

  /**
   * Open the calendar dialog.
   *
   * Syncs the view to the selected date (or today if nothing is selected),
   * activates the focus trap, and focuses the appropriate day cell.
   */
  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    // Sync view to selected date (or today if nothing selected)
    if (this.selectedDate) {
      this.focusedDate = new Date(this.selectedDate);
      this.viewYear = this.selectedDate.getFullYear();
      this.viewMonth = this.selectedDate.getMonth();
    } else {
      const today = new Date();
      this.focusedDate = today;
      this.viewYear = today.getFullYear();
      this.viewMonth = today.getMonth();
    }

    this.input.setAttribute("aria-expanded", "true");
    this.showDialog();
    this.renderMonth();

    setInitialFocusReference(this.input);
    pushFocusStack(this.input);
    activateFocusTrap(this.dialog);

    // Focus the focused date cell (or the first available day)
    requestAnimationFrame(() => {
      const idx = this.findCellIndex(this.focusedDate);
      if (idx >= 0) this.roving.setActiveIndex(idx, true);
    });

    announce(
      `Calendar opened. ${MONTH_NAMES[this.viewMonth]} ${this.viewYear}. Use arrow keys to navigate.`,
      { urgent: false },
    );

    this.onOpen?.();
  }

  /**
   * Close the calendar dialog and restore focus.
   */
  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.input.setAttribute("aria-expanded", "false");
    this.closeDialog();

    deactivateFocusTrap();
    popFocusStack();

    announce("Calendar closed", { urgent: false });

    this.onClose?.();
  }

  /**
   * Toggle the calendar dialog open or closed.
   */
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private showDialog(): void {
    this.dialog.setAttribute("aria-hidden", "false");
    const reduced = checkReducedMotion();
    this.dialog.style.display = "block";

    if (!reduced) {
      this.dialog.style.transition = "opacity 0.15s ease";
      this.dialog.style.opacity = "0";
      requestAnimationFrame(() => {
        this.dialog.style.opacity = "1";
      });
    }
  }

  private closeDialog(): void {
    this.dialog.setAttribute("aria-hidden", "true");
    const reduced = checkReducedMotion();

    if (!reduced) {
      this.dialog.style.opacity = "0";
      setTimeout(() => {
        if (!this.isOpen) this.dialog.style.display = "none";
      }, 150);
    } else {
      this.dialog.style.display = "none";
    }
  }

  // ─── Month navigation ────────────────────────────────────────────────────────

  /**
   * Shift the visible month by a relative number of months.
   *
   * Positive values advance forward, negative values go backward.
   * Rolls over year boundaries cleanly.
   *
   * @param delta - Number of months to shift (can be negative)
   */
  public shiftMonth(delta: number): void {
    let month = this.viewMonth + delta;
    let year = this.viewYear;

    // Roll over the year boundary cleanly
    if (month < 0) {
      month += 12;
      year -= 1;
    }
    if (month > 11) {
      month -= 12;
      year += 1;
    }

    this.viewMonth = month;
    this.viewYear = year;

    // Keep focusedDate in the new month (clamp to valid days in month)
    const daysInNewMonth = new Date(year, month + 1, 0).getDate();
    this.focusedDate = new Date(year, month, Math.min(this.focusedDate.getDate(), daysInNewMonth));
    if (this.minDate || this.maxDate) {
      this.focusedDate = clamp(this.focusedDate, this.minDate, this.maxDate);
    }

    this.renderMonth();
    announce(`${MONTH_NAMES[month]} ${year}`, { urgent: false });

    // Re-focus after render so keyboard users stay oriented
    requestAnimationFrame(() => {
      const idx = this.findCellIndex(this.focusedDate);
      if (idx >= 0) this.roving.setActiveIndex(idx, true);
    });

    this.onMonthChange?.(year, month);
  }

  // ─── Focus management ───────────────────────────────────────────────────────

  private focusCell(date: Date): void {
    const idx = this.findCellIndex(date);
    if (idx >= 0) {
      this.roving.setActiveIndex(idx, true);
    }
  }

  private moveFocus(days: number): void {
    let candidate = addDays(this.focusedDate, days);
    if (this.minDate && candidate < this.minDate) candidate = new Date(this.minDate);
    if (this.maxDate && candidate > this.maxDate) candidate = new Date(this.maxDate);

    // Navigate to a different month if needed
    if (candidate.getMonth() !== this.viewMonth || candidate.getFullYear() !== this.viewYear) {
      this.viewMonth = candidate.getMonth();
      this.viewYear = candidate.getFullYear();
      this.renderMonth();
      this.onMonthChange?.(this.viewYear, this.viewMonth);
    }

    this.focusedDate = candidate;
    this.focusCell(candidate);
  }

  private moveToWeekBoundary(toStart: boolean): void {
    const dow = this.focusedDate.getDay();
    const daysToMove = toStart ? -dow : DAYS_IN_WEEK - 1 - dow;
    this.moveFocus(daysToMove);
  }

  private moveToMonthBoundary(toStart: boolean): void {
    const target = toStart
      ? new Date(this.viewYear, this.viewMonth, 1)
      : new Date(this.viewYear, this.viewMonth + 1, 0); // last day

    this.focusedDate = target;
    this.focusCell(target);
  }

  // ─── Keyboard handling ───────────────────────────────────────────────────────

  private handleDialogKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        this.close();
        this.toggleButton.focus();
        break;

      case "Tab":
        // Focus trap handles boundary — let Tab move naturally inside dialog
        break;
    }
  }

  private handleGridClick(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest('[role="gridcell"]') as HTMLElement;
    if (!target) return;

    const iso = target.getAttribute("data-date");
    const disabled = target.getAttribute("aria-disabled") === "true";
    if (!iso || disabled) return;

    const [year, month, day] = iso.split("-").map(Number);
    this.commitDate(new Date(year, month - 1, day));
  }

  // ─── Date commitment ─────────────────────────────────────────────────────────

  private commitDate(date: Date): void {
    if (this.isDateDisabled(date)) return;

    this.selectedDate = new Date(date);
    const formatted = this.formatForInput(date);
    this.input.value = formatted;

    // Announce the selection before closing so screen readers hear it
    announce(`Selected ${this.formatDateLong(date)}`, { urgent: false });

    this.close();
    this.onSelect?.(new Date(date), formatted);
  }

  // ─── Public helpers ──────────────────────────────────────────────────────────

  /**
   * Programmatically select a date without opening the calendar.
   *
   * The date is clamped to the {@link DatePickerOptions.minDate} / {@link DatePickerOptions.maxDate} range.
   *
   * @param date - The date to select
   */
  public setValue(date: Date): void {
    const clamped = clamp(date, this.minDate, this.maxDate);
    this.selectedDate = clamped;
    this.input.value = this.formatForInput(clamped);
    this.focusedDate = new Date(clamped);
    this.viewYear = clamped.getFullYear();
    this.viewMonth = clamped.getMonth();
    if (this.isOpen) this.renderMonth();
  }

  /**
   * Clear the selected date and input value.
   */
  public clearValue(): void {
    this.selectedDate = null;
    this.input.value = "";
    if (this.isOpen) this.renderMonth();
  }

  /**
   * Get the currently selected date, or null if none is selected.
   *
   * @returns A copy of the selected date, or null
   */
  public getSelectedDate(): Date | null {
    return this.selectedDate ? new Date(this.selectedDate) : null;
  }

  /**
   * Remove all event listeners and clean up the date picker.
   *
   * Closes the dialog and destroys the roving tabindex controller.
   */
  public destroy(): void {
    this.toggleButton.removeEventListener("click", this.toggleClickHandler);
    this.prevMonthButton.removeEventListener("click", this.prevMonthClickHandler);
    this.nextMonthButton.removeEventListener("click", this.nextMonthClickHandler);
    this.dialog.removeEventListener("keydown", this.dialogKeydownHandler);
    this.calendarGrid.removeEventListener("click", this.gridClickHandler);
    this.input.removeEventListener("change", this.inputChangeHandler);

    if (this.isOpen) this.close();
    this.roving.destroy();
  }
}
