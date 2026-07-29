import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRovingTabindex } from '../src/shared/rovingTabindex.js';

function buildList(count: number = 3, container?: HTMLElement) {
  const el = container ?? document.createElement('div');
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.setAttribute('role', 'option');
    item.tabIndex = -1;
    item.textContent = `Item ${i}`;
    el.appendChild(item);
  }
  document.body.appendChild(el);
  return el;
}

function dispatchKey(el: HTMLElement, key: string, opts: Partial<KeyboardEvent> = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

describe('createRovingTabindex', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    container.querySelectorAll('*').forEach(el => el.remove());
    container.remove();
  });

  describe('vertical list', () => {
    it('sets initial tabindex="0" on the first item', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      const items = r.getItems();
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
      r.destroy();
    });

    it('ArrowDown moves active to next item', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      const items = r.getItems();
      dispatchKey(container, 'ArrowDown');
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[1].getAttribute('tabindex')).toBe('0');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
      expect(r.activeIndex).toBe(1);
      r.destroy();
    });

    it('ArrowUp moves active to previous item', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      r.setActiveIndex(1);
      dispatchKey(container, 'ArrowUp');
      expect(r.activeIndex).toBe(0);
      r.destroy();
    });

    it('wraps from last to first on ArrowDown when wrap=true', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]', wrap: true });
      r.setActiveIndex(2);
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(0);
      r.destroy();
    });

    it('does not wrap from last to first when wrap=false', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]', wrap: false });
      r.setActiveIndex(2);
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(2); // stays
      r.destroy();
    });

    it('Home goes to first item', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      r.setActiveIndex(2);
      dispatchKey(container, 'Home');
      expect(r.activeIndex).toBe(0);
      r.destroy();
    });

    it('End goes to last item', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      dispatchKey(container, 'End');
      expect(r.activeIndex).toBe(2);
      r.destroy();
    });

    it('ArrowLeft/ArrowRight are no-ops in vertical orientation', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]', orientation: 'vertical' });
      r.setActiveIndex(1);
      dispatchKey(container, 'ArrowLeft');
      expect(r.activeIndex).toBe(1);
      dispatchKey(container, 'ArrowRight');
      expect(r.activeIndex).toBe(1);
      r.destroy();
    });
  });

  describe('horizontal list', () => {
    it('ArrowRight moves forward, ArrowLeft moves backward', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]', orientation: 'horizontal' });
      const items = r.getItems();
      dispatchKey(container, 'ArrowRight');
      expect(r.activeIndex).toBe(1);
      dispatchKey(container, 'ArrowLeft');
      expect(r.activeIndex).toBe(0);
      r.destroy();
    });

    it('ArrowUp/ArrowDown are no-ops in horizontal orientation', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]', orientation: 'horizontal' });
      r.setActiveIndex(1);
      dispatchKey(container, 'ArrowUp');
      expect(r.activeIndex).toBe(1);
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(1);
      r.destroy();
    });
  });

  describe('both orientation', () => {
    it('ArrowLeft/Right and ArrowUp/Down both work', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]', orientation: 'both' });
      r.setActiveIndex(1);
      dispatchKey(container, 'ArrowRight');
      expect(r.activeIndex).toBe(2);
      dispatchKey(container, 'ArrowLeft');
      expect(r.activeIndex).toBe(1);
      dispatchKey(container, 'ArrowUp');
      expect(r.activeIndex).toBe(0);
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(1);
      r.destroy();
    });
  });

  describe('grid with columns', () => {
    function buildGrid(rows: number, cols: number) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement('div');
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('data-col', String(c));
          cell.setAttribute('data-row', String(r));
          cell.tabIndex = -1;
          container.appendChild(cell);
        }
      }
    }

    it('ArrowDown moves by column count', () => {
      buildGrid(3, 7);
      const r = createRovingTabindex({ container, selector: '[role="gridcell"]', columns: 7 });
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(7); // second row, first col
      r.destroy();
    });

    it('ArrowUp moves backward by column count', () => {
      buildGrid(3, 7);
      const r = createRovingTabindex({ container, selector: '[role="gridcell"]', columns: 7 });
      r.setActiveIndex(14); // third row, first col
      dispatchKey(container, 'ArrowUp');
      expect(r.activeIndex).toBe(7);
      r.destroy();
    });

    it('ArrowRight moves by 1 in a grid', () => {
      buildGrid(3, 7);
      const r = createRovingTabindex({ container, selector: '[role="gridcell"]', columns: 7 });
      dispatchKey(container, 'ArrowRight');
      expect(r.activeIndex).toBe(1);
      r.destroy();
    });

    it('ArrowLeft moves backward by 1 in a grid', () => {
      buildGrid(3, 7);
      const r = createRovingTabindex({ container, selector: '[role="gridcell"]', columns: 7 });
      r.setActiveIndex(1);
      dispatchKey(container, 'ArrowLeft');
      expect(r.activeIndex).toBe(0);
      r.destroy();
    });
  });

  describe('beforeKey callback', () => {
    it('prevents default handling when returning true', () => {
      buildList(3, container);
      const beforeKey = vi.fn(() => true);
      const r = createRovingTabindex({ container, selector: '[role="option"]', beforeKey });
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(0); // unchanged
      expect(beforeKey).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'ArrowDown' }),
        0
      );
      r.destroy();
    });

    it('allows default handling when returning false', () => {
      buildList(3, container);
      const beforeKey = vi.fn(() => false);
      const r = createRovingTabindex({ container, selector: '[role="option"]', beforeKey });
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(1);
      r.destroy();
    });

    it('receives the current active index', () => {
      buildList(3, container);
      const beforeKey = vi.fn(() => false);
      const r = createRovingTabindex({ container, selector: '[role="option"]', beforeKey });
      r.setActiveIndex(1);
      dispatchKey(container, 'ArrowDown');
      expect(beforeKey).toHaveBeenCalledWith(expect.any(KeyboardEvent), 1);
      r.destroy();
    });
  });

  describe('onActiveChange callback', () => {
    it('fires when active index changes via keyboard', () => {
      buildList(3, container);
      const onChange = vi.fn();
      const r = createRovingTabindex({ container, selector: '[role="option"]', onActiveChange: onChange });
      dispatchKey(container, 'ArrowDown');
      expect(onChange).toHaveBeenCalledWith(1, r.getItems()[1]);
      r.destroy();
    });

    it('fires when setActiveIndex is called', () => {
      buildList(3, container);
      const onChange = vi.fn();
      const r = createRovingTabindex({ container, selector: '[role="option"]', onActiveChange: onChange });
      r.setActiveIndex(2);
      expect(onChange).toHaveBeenCalledWith(2, r.getItems()[2]);
      r.destroy();
    });

    it('does not fire when active index stays the same', () => {
      buildList(3, container);
      const onChange = vi.fn();
      const r = createRovingTabindex({ container, selector: '[role="option"]', onActiveChange: onChange, wrap: false });
      dispatchKey(container, 'ArrowUp'); // already at 0
      expect(onChange).not.toHaveBeenCalled();
      r.destroy();
    });
  });

  describe('setActiveIndex', () => {
    it('updates tabindex on items', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      r.setActiveIndex(2);
      const items = r.getItems();
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('0');
      r.destroy();
    });

    it('ignores out-of-range index', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      r.setActiveIndex(99);
      expect(r.activeIndex).toBe(0); // unchanged from initial
      r.destroy();
    });
  });

  describe('refresh', () => {
    it('re-queries items after DOM mutation', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      expect(r.getItems().length).toBe(3);

      // Add an item
      const extra = document.createElement('div');
      extra.setAttribute('role', 'option');
      extra.tabIndex = -1;
      container.appendChild(extra);

      // Without refresh, item list is stale
      expect(r.getItems().length).toBe(3);

      r.refresh();
      expect(r.getItems().length).toBe(4);
      r.destroy();
    });

    it('clamps activeIndex when items are removed', () => {
      buildList(5, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      r.setActiveIndex(4);

      // Remove last two items
      container.removeChild(container.lastChild!);
      container.removeChild(container.lastChild!);

      r.refresh();
      expect(r.activeIndex).toBe(2); // clamped to last available
      r.destroy();
    });
  });

  describe('destroy', () => {
    it('removes keydown listener', () => {
      buildList(3, container);
      const r = createRovingTabindex({ container, selector: '[role="option"]' });
      r.destroy();
      dispatchKey(container, 'ArrowDown');
      expect(r.activeIndex).toBe(-1); // no longer responds
    });
  });
});
