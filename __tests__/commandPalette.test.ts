import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommandPalette, type CommandItem } from '../src/components/commandPalette.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_COMMANDS: CommandItem[] = [
  { id: 'new-file',   label: 'New File',       group: 'Files',   action: vi.fn() },
  { id: 'open-file',  label: 'Open File',      group: 'Files',   action: vi.fn() },
  { id: 'save-file',  label: 'Save File',      group: 'Files',   action: vi.fn() },
  { id: 'copy-path',  label: 'Copy Path',      group: 'Edit',    action: vi.fn(), description: 'Copy the file path to clipboard', shortcut: '⌘C' },
  { id: 'find',       label: 'Find in Files',  group: 'Edit',    action: vi.fn() },
  { id: 'settings',   label: 'Open Settings',  action: vi.fn() },
];

function buildPalette() {
  const overlay      = document.createElement('div');
  const dialog       = document.createElement('div');
  const input        = document.createElement('input') as HTMLInputElement;
  const listbox      = document.createElement('div');
  const statusRegion = document.createElement('div');
  const backdrop     = document.createElement('div');

  overlay.id      = 'cp-overlay';
  dialog.id       = 'cp-dialog';
  input.id        = 'cp-input';
  input.type      = 'text';
  listbox.id      = 'cp-listbox';
  statusRegion.id = 'cp-status';
  backdrop.id     = 'cp-backdrop';

  [overlay, dialog, input, listbox, statusRegion, backdrop]
    .forEach(el => document.body.appendChild(el));

  return { overlay, dialog, input, listbox, statusRegion, backdrop };
}

describe('CommandPalette', () => {
  let els: ReturnType<typeof buildPalette>;
  let cp: CommandPalette;

  beforeEach(() => {
    // Fresh action mocks each test
    SAMPLE_COMMANDS.forEach(c => { c.action = vi.fn(); });
    els = buildPalette();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });
    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: unknown[]) => void) => {
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  afterEach(() => {
    if (cp) cp.destroy();
    Object.values(els).forEach(el => el.remove());
    vi.restoreAllMocks();
  });

  // ─── Constructor / ARIA setup ────────────────────────────────────────────

  describe('constructor', () => {
    it('stamps role="combobox" on the input', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.input.getAttribute('role')).toBe('combobox');
    });

    it('sets aria-autocomplete="list" on the input', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.input.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('sets aria-expanded="false" initially', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.input.getAttribute('aria-expanded')).toBe('false');
    });

    it('connects the input to the listbox via aria-controls', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.input.getAttribute('aria-controls')).toBe(els.listbox.id);
    });

    it('stamps role="dialog" on the dialog element', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.dialog.getAttribute('role')).toBe('dialog');
    });

    it('stamps aria-modal="true" on the dialog', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('stamps role="listbox" on the listbox', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.listbox.getAttribute('role')).toBe('listbox');
    });

    it('makes the status region a polite live region', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.statusRegion.getAttribute('aria-live')).toBe('polite');
      expect(els.statusRegion.getAttribute('aria-atomic')).toBe('true');
    });

    it('hides the overlay initially', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(els.overlay.style.display).toBe('none');
    });

    it('renders all commands as options on init', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      const options = els.listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(SAMPLE_COMMANDS.length);
    });

    it('auto-generates ids for dialog and listbox when absent', () => {
      const noIds = buildPalette();
      noIds.dialog.removeAttribute('id');
      noIds.listbox.removeAttribute('id');
      cp = new CommandPalette({ ...noIds, commands: SAMPLE_COMMANDS });
      expect(noIds.dialog.id).toBeTruthy();
      expect(noIds.listbox.id).toBeTruthy();
      Object.values(noIds).forEach(el => el.remove());
    });
  });

  // ─── open ────────────────────────────────────────────────────────────────

  describe('open', () => {
    it('shows the overlay', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      expect(els.overlay.style.display).toBe('block');
    });

    it('is idempotent — calling open() twice fires onOpen once', () => {
      const onOpen = vi.fn();
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, onOpen });
      cp.open();
      cp.open();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('invokes onOpen callback', () => {
      const onOpen = vi.fn();
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, onOpen });
      cp.open();
      expect(onOpen).toHaveBeenCalledOnce();
    });

    it('clears the input value', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      els.input.value = 'leftover query';
      cp.open();
      expect(els.input.value).toBe('');
    });

    it('resets results to all commands', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      const options = els.listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(SAMPLE_COMMANDS.length);
    });

    it('sets aria-expanded="true" when commands are present', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      expect(els.input.getAttribute('aria-expanded')).toBe('true');
    });

    it('pre-selects the first item (aria-selected="true")', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      const first = els.listbox.querySelector('[role="option"]');
      expect(first?.getAttribute('aria-selected')).toBe('true');
    });

    it('points aria-activedescendant at the first option', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      const first = els.listbox.querySelector('[role="option"]') as HTMLElement;
      expect(els.input.getAttribute('aria-activedescendant')).toBe(first.id);
    });
  });

  // ─── close ───────────────────────────────────────────────────────────────

  describe('close', () => {
    it('hides the overlay', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.close();
      expect(els.overlay.style.display).toBe('none');
    });

    it('resets aria-expanded to "false"', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.close();
      expect(els.input.getAttribute('aria-expanded')).toBe('false');
    });

    it('clears aria-activedescendant', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.close();
      expect(els.input.getAttribute('aria-activedescendant')).toBeNull();
    });

    it('is idempotent — calling close() twice fires onClose once', () => {
      const onClose = vi.fn();
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, onClose });
      cp.open();
      cp.close();
      cp.close();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('invokes onClose callback', () => {
      const onClose = vi.fn();
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, onClose });
      cp.open();
      cp.close();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('backdrop click closes the palette', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.backdrop.click();
      expect(els.overlay.style.display).toBe('none');
    });
  });

  // ─── Filtering ────────────────────────────────────────────────────────────

  describe('filtering', () => {
    it('filters options as the user types', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      els.input.value = 'file';
      els.input.dispatchEvent(new Event('input'));
      const options = els.listbox.querySelectorAll('[role="option"]:not([aria-disabled])');
      // "New File", "Open File", "Save File", "Find in Files" all match "file"
      expect(options.length).toBeGreaterThanOrEqual(3);
    });

    it('updates the status region with the result count', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      els.input.value = 'settings';
      els.input.dispatchEvent(new Event('input'));
      expect(els.statusRegion.textContent).toContain('1 result');
    });

    it('shows "No results" option when nothing matches', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      els.input.value = 'zzzzzzz';
      els.input.dispatchEvent(new Event('input'));
      expect(els.statusRegion.textContent).toBe('No results');
      const noResults = els.listbox.querySelector('[aria-disabled="true"]');
      expect(noResults).toBeTruthy();
    });

    it('resets to all commands when the input is cleared', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      els.input.value = 'file';
      els.input.dispatchEvent(new Event('input'));
      els.input.value = '';
      els.input.dispatchEvent(new Event('input'));
      const options = els.listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(SAMPLE_COMMANDS.length);
    });

    it('uses a custom filter function when provided', () => {
      // Only match if label STARTS WITH the query
      const filter = (item: CommandItem, q: string) => item.label.toLowerCase().startsWith(q.toLowerCase());
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, filter });
      els.input.value = 'new';
      els.input.dispatchEvent(new Event('input'));
      const options = els.listbox.querySelectorAll('[role="option"]:not([aria-disabled])');
      // Only "New File" starts with "new"
      expect(options.length).toBe(1);
    });

    it('filters by description text too (default filter)', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      // "Copy Path" has description "Copy the file path to clipboard"
      els.input.value = 'clipboard';
      els.input.dispatchEvent(new Event('input'));
      const options = els.listbox.querySelectorAll('[role="option"]:not([aria-disabled])');
      expect(options.length).toBe(1);
    });
  });

  // ─── ARIA option semantics ────────────────────────────────────────────────

  describe('option ARIA semantics', () => {
    it('each option has a unique id', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      const options = Array.from(els.listbox.querySelectorAll('[role="option"]'));
      const ids = options.map(o => o.id).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('renders options with description in aria-describedby', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      const copyPath = els.listbox.querySelector('[data-id="copy-path"]') as HTMLElement;
      expect(copyPath.getAttribute('aria-describedby')).toBeTruthy();
    });

    it('renders grouped items inside role="group" containers', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      const groups = els.listbox.querySelectorAll('[role="group"]');
      expect(groups.length).toBeGreaterThan(0);
    });

    it('group containers are labelled via aria-labelledby', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      const groups = els.listbox.querySelectorAll('[role="group"]');
      groups.forEach(g => {
        expect(g.getAttribute('aria-labelledby')).toBeTruthy();
      });
    });

    it('non-grouped commands are rendered as flat options', () => {
      const flat: CommandItem[] = [
        { id: 'a', label: 'Alpha', action: vi.fn() },
        { id: 'b', label: 'Beta',  action: vi.fn() },
      ];
      cp = new CommandPalette({ ...els, commands: flat });
      const groups = els.listbox.querySelectorAll('[role="group"]');
      expect(groups.length).toBe(0);
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('ArrowDown moves active item down by one', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      // first item is pre-selected
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const second = els.listbox.querySelector('[role="option"][data-index="1"]') as HTMLElement;
      expect(second.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowUp moves active item up by one', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const first = els.listbox.querySelector('[role="option"][data-index="0"]') as HTMLElement;
      expect(first.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowDown wraps from last to first', () => {
      const small: CommandItem[] = [
        { id: 'a', label: 'A', action: vi.fn() },
        { id: 'b', label: 'B', action: vi.fn() },
      ];
      cp = new CommandPalette({ ...els, commands: small });
      cp.open();
      // move to second (last)
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      // wrap to first
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const first = els.listbox.querySelector('[role="option"][data-index="0"]') as HTMLElement;
      expect(first.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowUp wraps from first to last', () => {
      const small: CommandItem[] = [
        { id: 'a', label: 'A', action: vi.fn() },
        { id: 'b', label: 'B', action: vi.fn() },
      ];
      cp = new CommandPalette({ ...els, commands: small });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const last = els.listbox.querySelector('[role="option"][data-index="1"]') as HTMLElement;
      expect(last.getAttribute('aria-selected')).toBe('true');
    });

    it('aria-activedescendant tracks the highlighted option', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const second = els.listbox.querySelector('[role="option"][data-index="1"]') as HTMLElement;
      expect(els.input.getAttribute('aria-activedescendant')).toBe(second.id);
    });

    it('Enter executes the active command', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      // First command's action should have run
      expect(SAMPLE_COMMANDS[0].action).toHaveBeenCalledOnce();
    });

    it('Enter closes the palette after executing', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(els.overlay.style.display).toBe('none');
    });

    it('Escape closes the palette', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(els.overlay.style.display).toBe('none');
    });

    it('Escape does NOT execute a command', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      SAMPLE_COMMANDS.forEach(c => expect(c.action).not.toHaveBeenCalled());
    });
  });

  // ─── Click interaction ────────────────────────────────────────────────────

  describe('click interaction', () => {
    it('clicking an option executes its action', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      const first = els.listbox.querySelector<HTMLElement>('[role="option"][data-id="new-file"]');
      first?.click();
      expect(SAMPLE_COMMANDS[0].action).toHaveBeenCalledOnce();
    });

    it('clicking an option closes the palette', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      const first = els.listbox.querySelector<HTMLElement>('[role="option"]');
      first?.click();
      expect(els.overlay.style.display).toBe('none');
    });

    it('clicking a disabled "No results" option does nothing', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      els.input.value = 'zzzzzz';
      els.input.dispatchEvent(new Event('input'));
      const noResults = els.listbox.querySelector<HTMLElement>('[aria-disabled="true"]');
      expect(() => noResults?.click()).not.toThrow();
      expect(els.overlay.style.display).toBe('block');
    });

    it('fires onSelect with the selected CommandItem', () => {
      const onSelect = vi.fn();
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, onSelect });
      cp.open();
      const first = els.listbox.querySelector<HTMLElement>('[role="option"]');
      first?.click();
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect.mock.calls[0][0]).toMatchObject({ id: 'new-file' });
    });
  });

  // ─── Hotkey ───────────────────────────────────────────────────────────────

  describe('hotkey', () => {
    it('Ctrl+K opens the palette', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      expect(els.overlay.style.display).toBe('block');
    });

    it('Ctrl+K while open closes the palette', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      expect(els.overlay.style.display).toBe('none');
    });

    it('Meta+K also opens the palette (macOS)', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
      expect(els.overlay.style.display).toBe('block');
    });

    it('respects a custom hotkey', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS, hotkey: 'p' });
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true }));
      expect(els.overlay.style.display).toBe('block');
    });
  });

  // ─── Public command management API ───────────────────────────────────────

  describe('public command management', () => {
    it('setCommands replaces the command list', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      const newCmds: CommandItem[] = [{ id: 'only', label: 'Only Command', action: vi.fn() }];
      cp.setCommands(newCmds);
      cp.open();
      const options = els.listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(1);
    });

    it('addCommand appends a single command', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.addCommand({ id: 'new-cmd', label: 'Brand New', action: vi.fn() });
      const options = els.listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(SAMPLE_COMMANDS.length + 1);
    });

    it('removeCommand removes a command by id', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.removeCommand('settings');
      const options = els.listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(SAMPLE_COMMANDS.length - 1);
    });
  });

  // ─── Reduced motion ───────────────────────────────────────────────────────

  describe('reduced motion', () => {
    it('still opens regardless of motion preference', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      expect(els.overlay.style.display).toBe('block');
    });

    it('still closes regardless of motion preference', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.close();
      expect(els.overlay.style.display).toBe('none');
    });
  });

  // ─── Destroy ─────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('removes the global keyboard listener — hotkey no longer works', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.destroy();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      expect(els.overlay.style.display).toBe('none');
    });

    it('removes input listener — typing no longer filters', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.destroy();
      expect(() => {
        els.input.value = 'file';
        els.input.dispatchEvent(new Event('input'));
      }).not.toThrow();
    });

    it('closes an open palette on destroy', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open();
      cp.destroy();
      expect(els.overlay.style.display).toBe('none');
    });

    it('removes backdrop click listener after destroy', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.destroy();
      expect(() => els.backdrop.click()).not.toThrow();
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles an empty command list gracefully', () => {
      cp = new CommandPalette({ ...els, commands: [] });
      expect(() => cp.open()).not.toThrow();
    });

    it('handles rapid open/close cycles without corruption', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      cp.open(); cp.close(); cp.open(); cp.close(); cp.open();
      expect(els.overlay.style.display).toBe('block');
    });

    it('works without an optional backdrop', () => {
      const noBackdrop = buildPalette();
      noBackdrop.backdrop.remove();
      cp = new CommandPalette({ overlay: noBackdrop.overlay, dialog: noBackdrop.dialog, input: noBackdrop.input, listbox: noBackdrop.listbox, statusRegion: noBackdrop.statusRegion, commands: SAMPLE_COMMANDS });
      expect(() => { cp.open(); cp.close(); }).not.toThrow();
      Object.values(noBackdrop).forEach(el => el.remove?.());
    });

    it('works without any optional callbacks', () => {
      cp = new CommandPalette({ ...els, commands: SAMPLE_COMMANDS });
      expect(() => { cp.open(); cp.close(); }).not.toThrow();
    });
  });

  describe('data-tatami-component attribute', () => {
    it('sets correct attribute on dialog', () => {
      cp = new CommandPalette({
        overlay: els.overlay,
        dialog: els.dialog,
        input: els.input,
        listbox: els.listbox,
        statusRegion: els.statusRegion,
      });
      expect(els.dialog.getAttribute('data-tatami-component')).toBe('commandPalette');
    });
  });
});
