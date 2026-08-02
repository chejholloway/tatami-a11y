import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tatami, setTatamiDebug } from '../src/adapters/tatami.js';
import { Accordion } from '../src/components/accordion.js';
import { Carousel } from '../src/components/carousel.js';
import { Combobox } from '../src/components/combobox.js';
import { CommandPalette } from '../src/components/commandPalette.js';
import { DatePicker } from '../src/components/datePicker.js';
import { Dialog } from '../src/components/dialog.js';
import { Disclosure } from '../src/components/disclosure.js';
import { Dropdown } from '../src/components/dropdown.js';
import { MenuButton } from '../src/components/menuButton.js';
import { Modal } from '../src/components/modal.js';
import { MultiselectListbox } from '../src/components/multiselectListbox.js';
import { ReorderableList } from '../src/components/reorderableList.js';
import { Tabs } from '../src/components/tabs.js';
import { Toast } from '../src/components/toast.js';
import { Tooltip } from '../src/components/tooltip.js';
import { TreeView } from '../src/components/treeView.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Cast helper: treats the controller as a bag of callable methods.
 * Using `(...args: unknown[]) => unknown` (instead of `unknown`) avoids
 * "This expression is not callable" errors from TypeScript.
 */
type Controller = Record<string, (...args: unknown[]) => unknown>;

// ─── DOM setup helpers ────────────────────────────────────────────────────────

function makeTriggerMenu() {
  const trigger = document.createElement('button');
  trigger.textContent = 'Trigger';
  document.body.appendChild(trigger);

  const menu = document.createElement('div');
  menu.innerHTML = `
    <div role="menuitem" tabindex="0">Item 1</div>
    <div role="menuitem" tabindex="0">Item 2</div>
  `;
  document.body.appendChild(menu);
  return { trigger, menu };
}

function makeAccordionContainer() {
  const container = document.createElement('div');
  container.innerHTML = `
    <button id="acc-h1" aria-controls="acc-p1">Section 1</button>
    <div id="acc-p1">Content 1</div>
    <button id="acc-h2" aria-controls="acc-p2">Section 2</button>
    <div id="acc-p2">Content 2</div>
  `;
  document.body.appendChild(container);
  return container;
}

function makeCarouselContainer() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div data-carousel-track>
      <div data-carousel-slide>Slide 1</div>
      <div data-carousel-slide>Slide 2</div>
    </div>
    <button data-carousel-prev>Prev</button>
    <button data-carousel-next>Next</button>
  `;
  document.body.appendChild(container);
  return container;
}

function makeComboboxElements() {
  const input = document.createElement('input') as HTMLInputElement;
  input.id = 'combo-input';
  const listbox = document.createElement('div');
  listbox.id = 'combo-listbox';
  listbox.innerHTML = `
    <div role="option" id="opt1">Option A</div>
    <div role="option" id="opt2">Option B</div>
  `;
  document.body.appendChild(input);
  document.body.appendChild(listbox);
  return { input, listbox };
}

function makeCommandPaletteElements() {
  const overlay = document.createElement('div');
  const dialog = document.createElement('div');
  dialog.id = 'cmd-dialog';
  const input = document.createElement('input') as HTMLInputElement;
  const listbox = document.createElement('div');
  listbox.id = 'cmd-listbox';
  const statusRegion = document.createElement('div');
  [overlay, dialog, input, listbox, statusRegion].forEach(el => document.body.appendChild(el));
  return { overlay, dialog, input, listbox, statusRegion };
}

function makeDatePickerElements() {
  const input = document.createElement('input') as HTMLInputElement;
  const dialog = document.createElement('div');
  const toggleButton = document.createElement('button');
  const monthYearLabel = document.createElement('div');
  const prevMonthButton = document.createElement('button');
  const nextMonthButton = document.createElement('button');
  const calendarGrid = document.createElement('div');
  [input, dialog, toggleButton, monthYearLabel, prevMonthButton, nextMonthButton, calendarGrid]
    .forEach(el => document.body.appendChild(el));
  return { input, dialog, toggleButton, monthYearLabel, prevMonthButton, nextMonthButton, calendarGrid };
}

function makeDisclosureElements() {
  const trigger = document.createElement('button');
  const content = document.createElement('div');
  content.id = 'disclosure-content';
  document.body.appendChild(trigger);
  document.body.appendChild(content);
  return { trigger, content };
}

function makeTabsElements() {
  const tabList = document.createElement('div');
  const panel1 = document.createElement('div');
  panel1.id = 'panel-1';
  const panel2 = document.createElement('div');
  panel2.id = 'panel-2';
  tabList.innerHTML = `
    <button role="tab" id="tab-1" aria-controls="panel-1">Tab 1</button>
    <button role="tab" id="tab-2" aria-controls="panel-2">Tab 2</button>
  `;
  document.body.appendChild(tabList);
  document.body.appendChild(panel1);
  document.body.appendChild(panel2);
  return { tabList, panel1, panel2 };
}

function makeTooltipElements() {
  const trigger = document.createElement('button');
  trigger.textContent = 'Hover me';
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip-1';
  tooltip.textContent = 'Tooltip text';
  document.body.appendChild(trigger);
  document.body.appendChild(tooltip);
  return { trigger, tooltip };
}

function makeListboxElement() {
  const listbox = document.createElement('div');
  listbox.innerHTML = `
    <div role="option">A</div>
    <div role="option">B</div>
    <div role="option">C</div>
  `;
  document.body.appendChild(listbox);
  return listbox;
}

function makeReorderableListElement() {
  const list = document.createElement('div');
  list.innerHTML = `
    <div role="listitem" tabindex="0">Item 1</div>
    <div role="listitem" tabindex="0">Item 2</div>
    <div role="listitem" tabindex="0">Item 3</div>
  `;
  document.body.appendChild(list);
  return list;
}

function makeTreeElement() {
  const tree = document.createElement('ul');
  tree.innerHTML = `<li class="label">Node 1</li><li class="label">Node 2</li>`;
  document.body.appendChild(tree);
  return tree;
}

// ─── Shared mocks ─────────────────────────────────────────────────────────────

function setupTimerMocks() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(performance.now());
    return 0;
  });
  vi.spyOn(window, 'setTimeout').mockImplementation((cb: TimerHandler) => {
    if (typeof cb === 'function') {
      cb();
    }
    return 0 as unknown as ReturnType<typeof setTimeout>;
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('tatami() adapter', () => {

  beforeEach(() => {
    setTatamiDebug(true);
    setupTimerMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    try { Toast.destroy(); } catch { /* already cleaned up */ }
    setTatamiDebug(false);
  });

  // ── Core controller contract ───────────────────────────────────────────────

  describe('core controller contract', () => {
    it('returns a controller with destroy()', () => {
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      expect(typeof ctrl.destroy).toBe('function');
    });

    it('destroy() is idempotent — safe to call multiple times', () => {
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      expect(() => {
        ctrl.destroy();
        ctrl.destroy();
        ctrl.destroy();
      }).not.toThrow();
    });

    it('forwards public methods from the component instance', () => {
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
    });

    it('forwarded methods actually call through to the instance', () => {
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      const c = ctrl as Controller;
      c['open']();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      c['close']();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ── Dev-mode warnings ──────────────────────────────────────────────────────

  describe('dev-mode warnings', () => {
    it('warns when calling a method after destroy()', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      ctrl.destroy();
      (ctrl as Controller)['open']();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('destroy()'));
      warn.mockRestore();
    });

    it('warns when calling a method that does not exist', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      (ctrl as Controller)['nonExistentMethod']();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('nonExistentMethod'));
      warn.mockRestore();
      ctrl.destroy();
    });

    it('does NOT warn for underscore-prefixed (private) methods', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();

      class DropdownWithPrivate extends Dropdown {
        _internalMethod() {
          return 'internal';
        }
      }

      const ctrl = tatami(
        DropdownWithPrivate as unknown as new (...args: unknown[]) => object,
        { trigger, menu },
      );

      // Private methods are excluded from forwarding — accessing returns undefined
      expect((ctrl as Record<string, unknown>)['_internalMethod']).toBeUndefined();
      // Calling it through the Proxy should NOT warn (underscore-prefixed = silent)
      (ctrl as Record<string, (...args: unknown[]) => unknown>)['_internalMethod']?.();
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
      ctrl.destroy();
    });
  });

  // ── DEV detection ──────────────────────────────────────────────────────

  describe('DEV detection', () => {
    it('manual override takes priority over all other detection', () => {
      setTatamiDebug(true);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      ctrl.destroy();
      (ctrl as Controller)['open']();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('destroy()'));
      warn.mockRestore();
      ctrl.destroy();
    });

    it('manual override can disable warnings even in a dev-like environment', () => {
      setTatamiDebug(false);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      (ctrl as Controller)['nonExistentMethod']?.();    // ← safe, returns undefined
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
      ctrl.destroy();
    });
  });

  // ── Toast (static-only class) ──────────────────────────────────────────────

  describe('Toast — static-only class', () => {
    it('forwards Toast.show() without calling new Toast()', () => {
      const showSpy = vi.spyOn(Toast, 'show').mockImplementation(() => 'toast-1');
      const ctrl = tatami(Toast as unknown as new (...args: unknown[]) => object, {});
      (ctrl as Controller)['show']('Hello', { variant: 'info' });
      expect(showSpy).toHaveBeenCalledWith('Hello', { variant: 'info' });
      showSpy.mockRestore();
      ctrl.destroy();
    });

    it('destroy() calls Toast.destroy()', () => {
      const destroySpy = vi.spyOn(Toast, 'destroy').mockImplementation(() => { });
      const ctrl = tatami(Toast as unknown as new (...args: unknown[]) => object, {});
      ctrl.destroy();
      expect(destroySpy).toHaveBeenCalled();
      destroySpy.mockRestore();
    });

    it('forwards configure and dismiss methods', () => {
      const ctrl = tatami(Toast as unknown as new (...args: unknown[]) => object, {});
      const c = ctrl as Controller;
      expect(typeof c['configure']).toBe('function');
      expect(typeof c['dismiss']).toBe('function');
      expect(typeof c['dismissAll']).toBe('function');
      ctrl.destroy();
    });
  });

  // ── All 15 instantiable components ────────────────────────────────────────

  describe('Accordion', () => {
    it('instantiates via tatami() and forwards public methods', () => {
      const container = makeAccordionContainer();
      const ctrl = tatami(Accordion, { container });
      const c = ctrl as Controller;
      expect(typeof c['togglePanel']).toBe('function');
      expect(typeof c['expandPanel']).toBe('function');
      expect(typeof c['collapsePanel']).toBe('function');
      c['expandPanel'](0);
      const headers = container.querySelectorAll('button[aria-controls]');
      expect(headers[0].getAttribute('aria-expanded')).toBe('true');
      ctrl.destroy();
    });
  });

  describe('Carousel', () => {
    it('instantiates via tatami() and forwards public methods', () => {
      const container = makeCarouselContainer();
      const ctrl = tatami(Carousel, { container });
      const c = ctrl as Controller;
      expect(typeof c['next']).toBe('function');
      expect(typeof c['prev']).toBe('function');
      expect(typeof c['goToSlide']).toBe('function');
      expect(typeof c['play']).toBe('function');
      expect(typeof c['pause']).toBe('function');
      c['goToSlide'](1);
      const slides = container.querySelectorAll('[data-carousel-slide]');
      expect(slides[1].getAttribute('aria-hidden')).toBe('false');
      ctrl.destroy();
    });
  });

  describe('Combobox', () => {
    it('instantiates via tatami() and forwards open/close', () => {
      const { input, listbox } = makeComboboxElements();
      const ctrl = tatami(Combobox, { input, listbox });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      c['open']();
      expect(input.getAttribute('aria-expanded')).toBe('true');
      ctrl.destroy();
    });
  });

  describe('CommandPalette', () => {
    it('instantiates via tatami() and forwards open/close', () => {
      const els = makeCommandPaletteElements();
      const ctrl = tatami(CommandPalette, { ...els, commands: [] as unknown[] });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      expect(typeof c['setCommands']).toBe('function');
      ctrl.destroy();
    });
  });

  describe('DatePicker', () => {
    it('instantiates via tatami() and forwards open/close/toggle', () => {
      const els = makeDatePickerElements();
      const ctrl = tatami(DatePicker, els);
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      expect(typeof c['toggle']).toBe('function');
      expect(typeof c['setValue']).toBe('function');
      expect(typeof c['clearValue']).toBe('function');
      ctrl.destroy();
    });
  });

  describe('Dialog', () => {
    it('instantiates via tatami() and forwards open/close', () => {
      const { trigger, menu: dialog } = makeTriggerMenu();
      const ctrl = tatami(Dialog, { trigger, dialog });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      c['open']();
      expect(dialog.getAttribute('aria-hidden')).toBe('false');
      ctrl.destroy();
    });
  });

  describe('Disclosure', () => {
    it('instantiates via tatami() and forwards toggle/expand/collapse', () => {
      const { trigger, content } = makeDisclosureElements();
      const ctrl = tatami(Disclosure, { trigger, content });
      const c = ctrl as Controller;
      expect(typeof c['toggle']).toBe('function');
      expect(typeof c['expand']).toBe('function');
      expect(typeof c['collapse']).toBe('function');
      c['expand']();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      ctrl.destroy();
    });
  });

  describe('Dropdown', () => {
    it('instantiates via tatami() and forwards open/close', () => {
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      c['open']();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      ctrl.destroy();
    });
  });

  describe('MenuButton', () => {
    it('instantiates via tatami() and forwards open/close', () => {
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(MenuButton, { trigger, menu });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      c['open']();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      ctrl.destroy();
    });
  });

  describe('Modal', () => {
    it('instantiates via tatami() and forwards open/close', () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      const modal = document.createElement('div');
      const closeBtn = document.createElement('button');
      modal.appendChild(closeBtn);
      document.body.appendChild(modal);
      const ctrl = tatami(Modal, { trigger, modal });
      const c = ctrl as Controller;
      expect(typeof c['open']).toBe('function');
      expect(typeof c['close']).toBe('function');
      c['open']();
      expect(modal.getAttribute('aria-hidden')).toBe('false');
      ctrl.destroy();
    });
  });

  describe('MultiselectListbox', () => {
    it('instantiates via tatami() and forwards selectAll/clearSelection', () => {
      const listbox = makeListboxElement();
      const ctrl = tatami(MultiselectListbox, { listbox, multiselect: true });
      const c = ctrl as Controller;
      expect(typeof c['selectAll']).toBe('function');
      expect(typeof c['clearSelection']).toBe('function');
      expect(typeof c['getItems']).toBe('function');
      ctrl.destroy();
    });
  });

  describe('ReorderableList', () => {
    it('instantiates via tatami() and forwards getItems', () => {
      const list = makeReorderableListElement();
      const ctrl = tatami(ReorderableList, { list });
      const c = ctrl as Controller;
      expect(typeof c['getItems']).toBe('function');
      const items = c['getItems']() as HTMLElement[];
      expect(items.length).toBe(3);
      ctrl.destroy();
    });
  });

  describe('Tabs', () => {
    it('instantiates via tatami() and forwards activateTab', () => {
      const { tabList } = makeTabsElements();
      const ctrl = tatami(Tabs, { tabList });
      const c = ctrl as Controller;
      expect(typeof c['activateTab']).toBe('function');
      expect(typeof c['getCurrentIndex']).toBe('function');
      c['activateTab'](1);
      expect(c['getCurrentIndex']()).toBe(1);
      ctrl.destroy();
    });
  });

  describe('Tooltip', () => {
    it('instantiates via tatami() and forwards show/hide', () => {
      const { trigger, tooltip } = makeTooltipElements();
      const ctrl = tatami(Tooltip, { trigger, tooltip });
      const c = ctrl as Controller;
      expect(typeof c['show']).toBe('function');
      expect(typeof c['hide']).toBe('function');
      c['show']();
      expect(tooltip.style.display).toBe('block');
      ctrl.destroy();
    });
  });

  describe('TreeView', () => {
    it('instantiates via tatami() and forwards getItems/selectNode', () => {
      const tree = makeTreeElement();
      const ctrl = tatami(TreeView, { tree });
      const c = ctrl as Controller;
      expect(typeof c['getItems']).toBe('function');
      expect(typeof c['selectNode']).toBe('function');
      expect(typeof c['getSelectedNodes']).toBe('function');
      ctrl.destroy();
    });
  });

  // ── Runtime reflection accuracy ────────────────────────────────────────────

  describe('runtime reflection — no hardcoded methods needed', () => {
    it('does NOT trigger the Proxy typo-detection warning when destroy() is called', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      ctrl.destroy();
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('destroy'));
      warn.mockRestore();
    });

    it('does trigger the Proxy typo-detection warning for genuinely unknown methods', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const { trigger, menu } = makeTriggerMenu();
      const ctrl = tatami(Dropdown, { trigger, menu });
      (ctrl as Controller)['nonExistentMethod']();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('nonExistentMethod'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Available methods'));
      warn.mockRestore();
      ctrl.destroy();
    });

    it('does NOT forward underscore-prefixed names even when they exist on the instance', () => {
      const { trigger, menu } = makeTriggerMenu();

      class DropdownWithPrivate extends Dropdown {
        _internalMethod() {
          return 'internal';
        }
      }

      const ctrl = tatami(
        DropdownWithPrivate as unknown as new (...args: unknown[]) => object,
        { trigger, menu },
      );

      expect((ctrl as Record<string, unknown>)['_internalMethod']).toBeUndefined();
      ctrl.destroy();
    });
  });
});
