import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MultiselectListbox } from '../src/components/multiselectListbox.js';

function buildFixture(count: number = 5): { listbox: HTMLElement } {
  const listbox = document.createElement('div');
  const labels = ['Apples', 'Bananas', 'Cherries', 'Grapes', 'Kiwis'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.textContent = labels[i] || `Item ${i + 1}`;
    listbox.appendChild(el);
  }
  return { listbox };
}

describe('MultiselectListbox', () => {
  let listbox: HTMLElement;
  let instance: MultiselectListbox;

  beforeEach(() => {
    listbox = buildFixture().listbox;
    document.body.appendChild(listbox);
  });

  afterEach(() => {
    instance?.destroy();
    listbox.remove();
  });

  describe('constructor', () => {
    it('should set role="listbox" on the container', () => {
      instance = new MultiselectListbox({ listbox });
      expect(listbox.getAttribute('role')).toBe('listbox');
    });

    it('should set role="option" on all children', () => {
      instance = new MultiselectListbox({ listbox });
      const items = listbox.querySelectorAll('[role="option"]');
      expect(items.length).toBe(5);
    });

    it('should set aria-multiselectable when multiselect is true', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should NOT set aria-multiselectable by default', () => {
      instance = new MultiselectListbox({ listbox });
      expect(listbox.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('should set aria-selected="false" on all items', () => {
      instance = new MultiselectListbox({ listbox });
      instance.getItems().forEach(el => {
        expect(el.getAttribute('aria-selected')).toBe('false');
      });
    });

    it('should set tabindex="0" on only the first item', () => {
      instance = new MultiselectListbox({ listbox });
      const items = instance.getItems();
      expect(items[0].getAttribute('tabindex')).toBe('0');
      for (let i = 1; i < items.length; i++) {
        expect(items[i].getAttribute('tabindex')).toBe('-1');
      }
    });

    it('should handle empty listbox gracefully', () => {
      const empty = document.createElement('div');
      document.body.appendChild(empty);
      instance = new MultiselectListbox({ listbox: empty });
      expect(empty.getAttribute('role')).toBe('listbox');
      expect(() => instance.destroy()).not.toThrow();
      empty.remove();
    });

    it('should handle single-item listbox', () => {
      const single = document.createElement('div');
      single.innerHTML = '<div>Only</div>';
      document.body.appendChild(single);
      instance = new MultiselectListbox({ listbox: single });
      expect(instance.getItems().length).toBe(1);
      single.remove();
    });
  });

  describe('keyboard navigation (single-select)', () => {
    it('should move focus and select on ArrowDown', () => {
      instance = new MultiselectListbox({ listbox });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[1]);
      expect(instance.getSelectedIndices()).toEqual([1]);
    });

    it('should move focus and select on ArrowUp', () => {
      instance = new MultiselectListbox({ listbox });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[0]);
      expect(instance.getSelectedIndices()).toEqual([0]);
    });

    it('should focus first item on Home', () => {
      instance = new MultiselectListbox({ listbox });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[0]);
      expect(instance.getSelectedIndices()).toEqual([0]);
    });

    it('should focus last item on End', () => {
      instance = new MultiselectListbox({ listbox });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[4]);
      expect(instance.getSelectedIndices()).toEqual([4]);
    });
  });

  describe('keyboard navigation (multi-select)', () => {
    it('should move focus without selecting on ArrowDown', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[1]);
      expect(instance.getSelectedIndices()).toEqual([]);
    });

    it('should move focus without selecting on ArrowUp', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[0]);
      expect(instance.getSelectedIndices()).toEqual([]);
    });

    it('should toggle selection on Space', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([]);
    });

    it('should toggle on Ctrl+Space without double-toggle', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
    });

    it('should not move on Home/End without selecting', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[4]);
      expect(instance.getSelectedIndices()).toEqual([]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[0]);
      expect(instance.getSelectedIndices()).toEqual([]);
    });
  });

  describe('selection (multi-select)', () => {
    it('should select all with Ctrl+A', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3, 4]);
    });

    it('should range select with Shift+ArrowDown', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2]);
    });

    it('should contract range with Shift+ArrowUp', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      for (let i = 0; i < 3; i++) {
        listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
      }
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2]);
    });

    it('should select range from anchor to clicked item on Shift+Click', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
      items[3].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3]);
    });

    it('should toggle on Ctrl+Click', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
      items[2].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 2]);
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      expect(instance.getSelectedIndices()).toEqual([2]);
    });

    it('should replace selection on plain click', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      items[2].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 2]);
      items[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([3]);
    });

    it('should select range with Shift+Home', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', shiftKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
    });

    it('should select range with Shift+End', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', shiftKey: true, bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3, 4]);
    });

    it('should reverse range when anchor > index', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[3].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3]);
    });
  });

  describe('methods', () => {
    it('getItems should return option elements', () => {
      instance = new MultiselectListbox({ listbox });
      const items = instance.getItems();
      expect(items.length).toBe(5);
      items.forEach(el => {
        expect(el.getAttribute('role')).toBe('option');
      });
    });

    it('getSelectedIndices should return correct indices', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      expect(instance.getSelectedIndices()).toEqual([]);
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
    });

    it('selectAll should select all items', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      instance.selectAll();
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3, 4]);
    });

    it('selectAll should be a no-op in single-select mode', () => {
      instance = new MultiselectListbox({ listbox });
      instance.selectAll();
      expect(instance.getSelectedIndices()).toEqual([]);
    });

    it('clearSelection should deselect all items', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      instance.selectAll();
      expect(instance.getSelectedIndices()).toEqual([0, 1, 2, 3, 4]);
      instance.clearSelection();
      expect(instance.getSelectedIndices()).toEqual([]);
    });
  });

  describe('callbacks', () => {
    it('onSelect should fire with selected indices after toggle', () => {
      const onSelect = vi.fn();
      instance = new MultiselectListbox({ listbox, multiselect: true, onSelect });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(onSelect).toHaveBeenCalledWith([0]);
    });

    it('onSelect should fire after Ctrl+A', () => {
      const onSelect = vi.fn();
      instance = new MultiselectListbox({ listbox, multiselect: true, onSelect });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
      expect(onSelect).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
    });

    it('onSelect should fire after Shift+Click range', () => {
      const onSelect = vi.fn();
      instance = new MultiselectListbox({ listbox, multiselect: true, onSelect });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      onSelect.mockClear();
      items[3].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
      expect(onSelect).toHaveBeenCalledWith([0, 1, 2, 3]);
    });

    it('onSelect should fire after clearSelection and selectAll', () => {
      const onSelect = vi.fn();
      instance = new MultiselectListbox({ listbox, multiselect: true, onSelect });
      instance.selectAll();
      expect(onSelect).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
      onSelect.mockClear();
      instance.clearSelection();
      expect(onSelect).toHaveBeenCalledWith([]);
    });
  });

  describe('typeahead', () => {
    it('should jump to item starting with typed character', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[2]);
    });

    it('should jump to next match on repeated characters', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
      expect(document.activeElement).toBe(instance.getItems()[2]);
    });
  });

  describe('destroy', () => {
    it('should remove event listeners', () => {
      instance = new MultiselectListbox({ listbox });
      instance.destroy();
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).not.toBe(instance.getItems()[1]);
    });

    it('should not throw when called twice', () => {
      instance = new MultiselectListbox({ listbox });
      instance.destroy();
      expect(() => instance.destroy()).not.toThrow();
    });
  });

  describe('HMR safety', () => {
    it('should not duplicate listeners on re-init', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      instance.destroy();
      instance = new MultiselectListbox({ listbox, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
    });

    it('should work after destroy + new instance', () => {
      instance = new MultiselectListbox({ listbox, multiselect: true });
      instance.destroy();
      instance = new MultiselectListbox({ listbox, multiselect: true });
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(instance.getSelectedIndices()).toEqual([0]);
    });
  });
});
