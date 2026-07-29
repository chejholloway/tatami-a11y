import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatePicker } from '../src/components/datePicker.js';

// ─── DOM builder ─────────────────────────────────────────────────────────────
// Centralising this avoids 40+ lines of duplicated setup in every test.
function buildDatePicker() {
  const input          = document.createElement('input');
  const dialog         = document.createElement('div');
  const toggleButton   = document.createElement('button');
  const monthYearLabel = document.createElement('div');
  const prevMonthButton = document.createElement('button');
  const nextMonthButton = document.createElement('button');
  const calendarGrid   = document.createElement('div');

  input.id           = 'dp-input';
  input.type         = 'text';
  dialog.id          = 'dp-dialog';
  toggleButton.id    = 'dp-toggle';
  toggleButton.textContent = 'Choose date';
  prevMonthButton.id = 'dp-prev';
  nextMonthButton.id = 'dp-next';
  calendarGrid.id    = 'dp-grid';

  [input, dialog, toggleButton, monthYearLabel, prevMonthButton, nextMonthButton, calendarGrid]
    .forEach(el => document.body.appendChild(el));

  return { input, dialog, toggleButton, monthYearLabel, prevMonthButton, nextMonthButton, calendarGrid };
}

describe('DatePicker', () => {
  let els: ReturnType<typeof buildDatePicker>;
  let dp: DatePicker;

  beforeEach(() => {
    els = buildDatePicker();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });
    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: any[]) => void) => {
      cb();
      return 0 as any;
    });
  });

  afterEach(() => {
    if (dp) dp.destroy();
    Object.values(els).forEach(el => el.remove());
    vi.restoreAllMocks();
  });

  // ─── Constructor / ARIA setup ────────────────────────────────────────────

  describe('constructor', () => {
    it('stamps role="combobox" and aria-haspopup="dialog" on the input', () => {
      dp = new DatePicker({ ...els });
      expect(els.input.getAttribute('role')).toBe('combobox');
      expect(els.input.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('stamps aria-expanded="false" on the input initially', () => {
      dp = new DatePicker({ ...els });
      expect(els.input.getAttribute('aria-expanded')).toBe('false');
    });

    it('connects input to dialog via aria-controls', () => {
      dp = new DatePicker({ ...els });
      expect(els.input.getAttribute('aria-controls')).toBe(els.dialog.id);
    });

    it('auto-generates a dialog id when none is present', () => {
      const noId = document.createElement('div');
      document.body.appendChild(noId);
      const localEls = { ...els, dialog: noId };
      dp = new DatePicker(localEls);
      expect(noId.id).toBeTruthy();
      noId.remove();
    });

    it('stamps role="dialog" and aria-modal="true" on the dialog', () => {
      dp = new DatePicker({ ...els });
      expect(els.dialog.getAttribute('role')).toBe('dialog');
      expect(els.dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('makes the month/year label a polite live region', () => {
      dp = new DatePicker({ ...els });
      expect(els.monthYearLabel.getAttribute('aria-live')).toBe('polite');
      expect(els.monthYearLabel.getAttribute('aria-atomic')).toBe('true');
    });

    it('gives prev/next buttons default aria-labels if none exist', () => {
      dp = new DatePicker({ ...els });
      expect(els.prevMonthButton.getAttribute('aria-label')).toBe('Previous month');
      expect(els.nextMonthButton.getAttribute('aria-label')).toBe('Next month');
    });

    it('leaves existing aria-label on nav buttons alone', () => {
      els.prevMonthButton.setAttribute('aria-label', 'Go back');
      dp = new DatePicker({ ...els });
      expect(els.prevMonthButton.getAttribute('aria-label')).toBe('Go back');
    });

    it('stamps role="grid" on the calendar grid', () => {
      dp = new DatePicker({ ...els });
      expect(els.calendarGrid.getAttribute('role')).toBe('grid');
    });

    it('renders column headers with role="columnheader"', () => {
      dp = new DatePicker({ ...els });
      const headers = els.calendarGrid.querySelectorAll('[role="columnheader"]');
      expect(headers.length).toBe(7);
    });

    it('hides the dialog initially', () => {
      dp = new DatePicker({ ...els });
      expect(els.dialog.style.display).toBe('none');
    });
  });

  // ─── open ────────────────────────────────────────────────────────────────

  describe('open', () => {
    it('shows the dialog', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      expect(els.dialog.style.display).toBe('block');
    });

    it('sets aria-expanded="true" on the input', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      expect(els.input.getAttribute('aria-expanded')).toBe('true');
    });

    it('renders the current month heading', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      expect(els.monthYearLabel.textContent).toBeTruthy();
    });

    it('renders day cells with role="gridcell"', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      const cells = els.calendarGrid.querySelectorAll('[role="gridcell"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('marks today with aria-current="date"', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      const today = els.calendarGrid.querySelector('[aria-current="date"]');
      expect(today).toBeTruthy();
    });

    it('is idempotent — calling open() twice only fires onOpen once', () => {
      const onOpen = vi.fn();
      dp = new DatePicker({ ...els, onOpen });
      dp.open();
      dp.open();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('invokes the onOpen callback', () => {
      const onOpen = vi.fn();
      dp = new DatePicker({ ...els, onOpen });
      dp.open();
      expect(onOpen).toHaveBeenCalledOnce();
    });

    it('opens to the selected date month when a date is set', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2020, 5, 15)); // June 2020
      dp.open();
      expect(els.monthYearLabel.textContent).toContain('June');
      expect(els.monthYearLabel.textContent).toContain('2020');
    });
  });

  // ─── close ───────────────────────────────────────────────────────────────

  describe('close', () => {
    it('hides the dialog', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      dp.close();
      expect(els.dialog.style.display).toBe('none');
    });

    it('sets aria-expanded="false" on the input', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      dp.close();
      expect(els.input.getAttribute('aria-expanded')).toBe('false');
    });

    it('is idempotent — calling close() twice only fires onClose once', () => {
      const onClose = vi.fn();
      dp = new DatePicker({ ...els, onClose });
      dp.open();
      dp.close();
      dp.close();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('invokes the onClose callback', () => {
      const onClose = vi.fn();
      dp = new DatePicker({ ...els, onClose });
      dp.open();
      dp.close();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // ─── toggle ──────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('opens on first call', () => {
      dp = new DatePicker({ ...els });
      dp.toggle();
      expect(els.dialog.style.display).toBe('block');
    });

    it('closes on second call', () => {
      dp = new DatePicker({ ...els });
      dp.toggle();
      dp.toggle();
      expect(els.dialog.style.display).toBe('none');
    });

    it('toggle button click opens the dialog', () => {
      dp = new DatePicker({ ...els });
      els.toggleButton.click();
      expect(els.dialog.style.display).toBe('block');
    });
  });

  // ─── Month navigation ─────────────────────────────────────────────────────

  describe('month navigation', () => {
    it('advances one month on nextMonthButton click', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      const before = els.monthYearLabel.textContent!;
      els.nextMonthButton.click();
      const after = els.monthYearLabel.textContent!;
      expect(before).not.toBe(after);
    });

    it('goes back one month on prevMonthButton click', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      // go forward first so we have room to go back
      els.nextMonthButton.click();
      const mid = els.monthYearLabel.textContent!;
      els.prevMonthButton.click();
      expect(els.monthYearLabel.textContent).not.toBe(mid);
    });

    it('wraps December → January across a year boundary', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 11, 1)); // December 2025
      dp.open();
      dp.shiftMonth(1);
      expect(els.monthYearLabel.textContent).toContain('January');
      expect(els.monthYearLabel.textContent).toContain('2026');
    });

    it('wraps January → December across a year boundary', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 0, 1)); // January 2025
      dp.open();
      dp.shiftMonth(-1);
      expect(els.monthYearLabel.textContent).toContain('December');
      expect(els.monthYearLabel.textContent).toContain('2024');
    });

    it('fires onMonthChange with the new year and month', () => {
      const onMonthChange = vi.fn();
      dp = new DatePicker({ ...els, onMonthChange });
      dp.setValue(new Date(2025, 5, 1));
      dp.open();
      dp.shiftMonth(1);
      expect(onMonthChange).toHaveBeenCalledWith(2025, 6);
    });

    it('PageDown key advances one month', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      const before = els.monthYearLabel.textContent!;
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
      expect(els.monthYearLabel.textContent).not.toBe(before);
    });

    it('PageUp key goes back one month', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      els.nextMonthButton.click(); // move forward first
      const mid = els.monthYearLabel.textContent!;
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
      expect(els.monthYearLabel.textContent).not.toBe(mid);
    });

    it('Shift+PageDown advances 12 months (one year)', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2024, 0, 1)); // January 2024
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', shiftKey: true, bubbles: true }));
      expect(els.monthYearLabel.textContent).toContain('2025');
    });
  });

  // ─── Date selection ────────────────────────────────────────────────────────

  describe('date selection', () => {
    it('clicking a day cell commits the date and closes the calendar', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      const firstCell = els.calendarGrid.querySelector<HTMLElement>('[role="gridcell"][data-date]');
      firstCell?.click();
      expect(els.dialog.style.display).toBe('none');
    });

    it('sets the input value on selection (YYYY-MM-DD format)', () => {
      dp = new DatePicker({ ...els, dateFormat: 'YYYY-MM-DD' });
      dp.setValue(new Date(2025, 5, 15)); // June 15 2025
      expect(els.input.value).toBe('2025-06-15');
    });

    it('sets the input value in MM/DD/YYYY format', () => {
      dp = new DatePicker({ ...els, dateFormat: 'MM/DD/YYYY' });
      dp.setValue(new Date(2025, 5, 15));
      expect(els.input.value).toBe('06/15/2025');
    });

    it('sets the input value in DD/MM/YYYY format', () => {
      dp = new DatePicker({ ...els, dateFormat: 'DD/MM/YYYY' });
      dp.setValue(new Date(2025, 5, 15));
      expect(els.input.value).toBe('15/06/2025');
    });

    it('fires onSelect with the Date and formatted string', () => {
      const onSelect = vi.fn();
      dp = new DatePicker({ ...els, onSelect });
      dp.open();
      const firstCell = els.calendarGrid.querySelector<HTMLElement>('[role="gridcell"][data-date]');
      firstCell?.click();
      expect(onSelect).toHaveBeenCalledOnce();
      const [date, formatted] = onSelect.mock.calls[0];
      expect(date).toBeInstanceOf(Date);
      expect(typeof formatted).toBe('string');
    });

    it('Enter key commits the focused date', () => {
      const onSelect = vi.fn();
      dp = new DatePicker({ ...els, onSelect });
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('marks the selected cell aria-selected="true" on next open', () => {
      dp = new DatePicker({ ...els, dateFormat: 'YYYY-MM-DD' });
      dp.setValue(new Date(2025, 5, 15));
      dp.open();
      const selected = els.calendarGrid.querySelector('[aria-selected="true"]');
      expect(selected).toBeTruthy();
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('Escape closes the dialog', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      els.dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(els.dialog.style.display).toBe('none');
    });

    it('ArrowRight moves focused date forward one day', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 10)); // June 10
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-11');
    });

    it('ArrowLeft moves focused date back one day', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 10));
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-09');
    });

    it('ArrowDown moves focused date forward one week', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 10));
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-17');
    });

    it('ArrowUp moves focused date back one week', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 10));
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-03');
    });

    it('ArrowRight crossing month boundary navigates to the next month', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 30)); // June 30
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(els.monthYearLabel.textContent).toContain('July');
    });

    it('Home moves focus to start of week', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 11)); // Wednesday
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      // June 11 is a Wednesday (dow=3), so Home → June 8 (Sunday)
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-08');
    });

    it('Ctrl+Home moves focus to first day of month', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 15));
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', ctrlKey: true, bubbles: true }));
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-01');
    });

    it('Ctrl+End moves focus to last day of month', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 1));
      dp.open();
      els.calendarGrid.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', ctrlKey: true, bubbles: true }));
      const focused = els.calendarGrid.querySelector<HTMLElement>('[tabindex="0"]');
      expect(focused?.getAttribute('data-date')).toBe('2025-06-30');
    });
  });

  // ─── Min / max date constraints ────────────────────────────────────────────

  describe('min/max date constraints', () => {
    it('marks dates before minDate as aria-disabled', () => {
      dp = new DatePicker({ ...els, minDate: new Date(2025, 5, 15) });
      dp.setValue(new Date(2025, 5, 15));
      dp.open();
      const cell = els.calendarGrid.querySelector<HTMLElement>('[data-date="2025-06-10"]');
      expect(cell?.getAttribute('aria-disabled')).toBe('true');
    });

    it('marks dates after maxDate as aria-disabled', () => {
      dp = new DatePicker({ ...els, maxDate: new Date(2025, 5, 20) });
      dp.setValue(new Date(2025, 5, 15));
      dp.open();
      const cell = els.calendarGrid.querySelector<HTMLElement>('[data-date="2025-06-25"]');
      expect(cell?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not commit a disabled date when clicked', () => {
      const onSelect = vi.fn();
      dp = new DatePicker({ ...els, minDate: new Date(2025, 5, 15), onSelect });
      dp.setValue(new Date(2025, 5, 15));
      dp.open();
      const disabledCell = els.calendarGrid.querySelector<HTMLElement>('[data-date="2025-06-10"]');
      disabledCell?.click();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  // ─── Public API ────────────────────────────────────────────────────────────

  describe('public API', () => {
    it('setValue sets the input value and internal state', () => {
      dp = new DatePicker({ ...els, dateFormat: 'YYYY-MM-DD' });
      dp.setValue(new Date(2025, 0, 20));
      expect(els.input.value).toBe('2025-01-20');
      expect(dp.getSelectedDate()?.toDateString()).toBe(new Date(2025, 0, 20).toDateString());
    });

    it('clearValue clears the input and internal state', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 0, 20));
      dp.clearValue();
      expect(els.input.value).toBe('');
      expect(dp.getSelectedDate()).toBeNull();
    });

    it('getSelectedDate returns null when nothing is selected', () => {
      dp = new DatePicker({ ...els });
      expect(dp.getSelectedDate()).toBeNull();
    });

    it('getSelectedDate returns a copy (mutating it does not affect state)', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 5, 15));
      const copy = dp.getSelectedDate()!;
      copy.setFullYear(1900);
      expect(dp.getSelectedDate()?.getFullYear()).toBe(2025);
    });
  });

  // ─── Reduced motion ────────────────────────────────────────────────────────

  describe('reduced motion', () => {
    it('still opens the dialog regardless of motion preference', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      expect(els.dialog.style.display).toBe('block');
    });

    it('still closes the dialog regardless of motion preference', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      dp.close();
      expect(els.dialog.style.display).toBe('none');
    });
  });

  // ─── Destroy ──────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('removes toggle button listener — clicking no longer opens the dialog', () => {
      dp = new DatePicker({ ...els });
      dp.destroy();
      els.toggleButton.click();
      expect(els.dialog.style.display).toBe('none');
    });

    it('closes an open dialog on destroy', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      dp.destroy();
      expect(els.dialog.style.display).toBe('none');
    });

    it('removes prev/next month listeners after destroy', () => {
      dp = new DatePicker({ ...els });
      dp.open();
      const before = els.monthYearLabel.textContent;
      dp.destroy();
      els.nextMonthButton.click();
      expect(els.monthYearLabel.textContent).toBe(before);
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles rapid open/close cycles without corruption', () => {
      dp = new DatePicker({ ...els });
      dp.open(); dp.close(); dp.open(); dp.close(); dp.open();
      expect(els.dialog.style.display).toBe('block');
    });

    it('handles a February in a leap year (29 days)', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2024, 1, 1));
      dp.open();
      const cell29 = els.calendarGrid.querySelector<HTMLElement>('[data-date="2024-02-29"]');
      expect(cell29).toBeTruthy();
    });

    it('handles a February in a non-leap year (28 days)', () => {
      dp = new DatePicker({ ...els });
      dp.setValue(new Date(2025, 1, 1));
      dp.open();
      const cell29 = els.calendarGrid.querySelector<HTMLElement>('[data-date="2025-02-29"]');
      expect(cell29).toBeNull();
      const cell28 = els.calendarGrid.querySelector<HTMLElement>('[data-date="2025-02-28"]');
      expect(cell28).toBeTruthy();
    });

    it('works without any optional callbacks', () => {
      dp = new DatePicker({ ...els });
      expect(() => {
        dp.open();
        dp.close();
      }).not.toThrow();
    });
  });
});
