import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReorderableList } from '../src/components/reorderableList.js';

function buildFixture(): { list: HTMLElement } {
  const list = document.createElement('ul');
  list.innerHTML = `
    <li data-label="Apples"><span class="label">Apples</span></li>
    <li data-label="Bananas"><span class="label">Bananas</span></li>
    <li data-label="Cherries"><span class="label">Cherries</span></li>
    <li data-label="Grapes"><span class="label">Grapes</span></li>
  `;
  return { list };
}

function getLabels(instance: ReorderableList): string[] {
  return instance.getItems().map(el => el.textContent?.trim() || '');
}

describe('ReorderableList', () => {
  let list: HTMLElement;
  let instance: ReorderableList;

  beforeEach(() => {
    list = buildFixture().list;
    document.body.appendChild(list);
  });

  afterEach(() => {
    instance?.destroy();
    list.remove();
  });

  describe('constructor', () => {
    it('should set role="list" on the container', () => {
      instance = new ReorderableList({ list });
      expect(list.getAttribute('role')).toBe('list');
    });

    it('should set role="listitem" on all items', () => {
      instance = new ReorderableList({ list });
      const items = list.querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(4);
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });

    it('should set aria-posinset and aria-setsize', () => {
      instance = new ReorderableList({ list });
      const items = list.querySelectorAll('[role="listitem"]');
      expect(items[0].getAttribute('aria-posinset')).toBe('1');
      expect(items[0].getAttribute('aria-setsize')).toBe('4');
      expect(items[3].getAttribute('aria-posinset')).toBe('4');
      expect(items[3].getAttribute('aria-setsize')).toBe('4');
    });

    it('should set tabindex="0" on only the first item', () => {
      instance = new ReorderableList({ list });
      const items = list.querySelectorAll('[role="listitem"]');
      let zeroCount = 0;
      items.forEach(el => {
        if (el.getAttribute('tabindex') === '0') zeroCount++;
      });
      expect(zeroCount).toBe(1);
    });

    it('should handle empty list gracefully', () => {
      const empty = document.createElement('ul');
      document.body.appendChild(empty);
      instance = new ReorderableList({ list: empty });
      expect(empty.getAttribute('role')).toBe('list');
      expect(() => instance.destroy()).not.toThrow();
      empty.remove();
    });

    it('should handle single item list', () => {
      const single = document.createElement('ul');
      single.innerHTML = '<li><span class="label">Only</span></li>';
      document.body.appendChild(single);
      instance = new ReorderableList({ list: single });
      expect(instance.getItems().length).toBe(1);
      single.remove();
    });
  });

  describe('keyboard navigation', () => {
    it('should focus next item on ArrowDown', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('should focus previous item on ArrowUp', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should focus first item on Home', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should focus last item on End', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });
  });

  describe('reordering', () => {
    it('should move item down on Ctrl+ArrowDown', () => {
      instance = new ReorderableList({ list });
      expect(getLabels(instance)).toEqual(['Apples', 'Bananas', 'Cherries', 'Grapes']);
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(getLabels(instance)).toEqual(['Bananas', 'Apples', 'Cherries', 'Grapes']);
    });

    it('should move item up on Ctrl+ArrowUp', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[2].focus();
      items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
      expect(getLabels(instance)).toEqual(['Apples', 'Cherries', 'Bananas', 'Grapes']);
    });

    it('should not move first item up on Ctrl+ArrowUp', () => {
      instance = new ReorderableList({ list });
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
      expect(getLabels(instance)).toEqual(['Apples', 'Bananas', 'Cherries', 'Grapes']);
    });

    it('should not move last item down on Ctrl+ArrowDown', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[3].focus();
      items[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(getLabels(instance)).toEqual(['Apples', 'Bananas', 'Cherries', 'Grapes']);
    });

    it('should move item to start on Ctrl+Home', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[3].focus();
      items[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', ctrlKey: true, bubbles: true }));
      expect(getLabels(instance)).toEqual(['Grapes', 'Apples', 'Bananas', 'Cherries']);
    });

    it('should move item to end on Ctrl+End', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', ctrlKey: true, bubbles: true }));
      expect(getLabels(instance)).toEqual(['Bananas', 'Cherries', 'Grapes', 'Apples']);
    });

    it('should update aria-posinset after reorder', () => {
      instance = new ReorderableList({ list });
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      const items = instance.getItems();
      expect(items[0].getAttribute('aria-posinset')).toBe('1');
      expect(items[1].getAttribute('aria-posinset')).toBe('2');
      expect(items[2].getAttribute('aria-posinset')).toBe('3');
      expect(items[3].getAttribute('aria-posinset')).toBe('4');
    });

    it('should fire onReorder callback', () => {
      const onReorder = vi.fn();
      instance = new ReorderableList({ list, onReorder });
      const items = instance.getItems();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(onReorder).toHaveBeenCalledTimes(1);
      const [resultItems, movedItem, newIndex] = onReorder.mock.calls[0];
      expect(resultItems.length).toBe(4);
      expect(movedItem).toBe(items[0]);
      expect(newIndex).toBe(1);
    });

    it('should maintain focus on moved item', () => {
      instance = new ReorderableList({ list });
      const items = instance.getItems();
      items[0].focus();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(document.activeElement?.textContent?.trim()).toBe('Apples');
    });
  });

  describe('announcements', () => {
    it('should call announce on reorder', () => {
      const announce = vi.fn();
      instance = new ReorderableList({ list, announce });
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(announce).toHaveBeenCalledWith('Apples moved to position 2 of 4');
    });

    it('should call announce on Ctrl+End move', () => {
      const announce = vi.fn();
      instance = new ReorderableList({ list, announce });
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', ctrlKey: true, bubbles: true }));
      expect(announce).toHaveBeenCalledWith('Apples moved to position 4 of 4');
    });

    it('should NOT announce on boundary no-op', () => {
      const announce = vi.fn();
      instance = new ReorderableList({ list, announce });
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
      expect(announce).not.toHaveBeenCalled();
    });

    it('should use default announce() when none provided', () => {
      instance = new ReorderableList({ list });
      expect(() => {
        list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('horizontal orientation', () => {
    it('should navigate with ArrowLeft/ArrowRight in horizontal mode', () => {
      instance = new ReorderableList({ list, orientation: 'horizontal' });
      const items = instance.getItems();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });
  });

  describe('edge cases', () => {
    it('should not reorder on single-item list', () => {
      const single = document.createElement('ul');
      single.innerHTML = '<li><span class="label">Only</span></li>';
      document.body.appendChild(single);
      instance = new ReorderableList({ list: single });
      const items = instance.getItems();
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(items[0].textContent?.trim()).toBe('Only');
      single.remove();
    });

    it('should handle rapid reorders without error', () => {
      instance = new ReorderableList({ list });
      expect(() => {
        list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
        list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
        list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      const onReorder = vi.fn();
      instance = new ReorderableList({ list, onReorder });
      instance.destroy();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should be idempotent', () => {
      instance = new ReorderableList({ list });
      instance.destroy();
      expect(() => instance.destroy()).not.toThrow();
    });
  });
});
