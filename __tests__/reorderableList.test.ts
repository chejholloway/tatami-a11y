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

function dragEvent(type: string, opts: { clientX?: number; clientY?: number } = {}): Event {
  const e = new Event(type, { bubbles: true, cancelable: true }) as Event & Record<string, unknown>;
  e.dataTransfer = { effectAllowed: '', setData: () => { }, getData: () => '' };
  if (opts.clientX !== undefined) e.clientX = opts.clientX;
  if (opts.clientY !== undefined) e.clientY = opts.clientY;
  return e;
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
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[3]);
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
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

  describe('drag and drop', () => {
    beforeEach(() => {
      instance = new ReorderableList({ list, dragAndDrop: true });
    });

    it('should set draggable on items when dragAndDrop is true', () => {
      instance!.destroy();
      instance = new ReorderableList({ list, dragAndDrop: true });
      instance.getItems().forEach(el => {
        expect(el.draggable).toBe(true);
      });
    });

    it('should NOT set draggable when dragAndDrop is false', () => {
      instance!.destroy();
      instance = new ReorderableList({ list });
      instance.getItems().forEach(el => {
        expect(el.draggable).toBe(false);
      });
    });

    it('should start drag with dragging class', () => {
      const items = instance!.getItems();
      const item = items[0];
      item.dispatchEvent(dragEvent('dragstart'));
      expect(item.classList.contains('reorderable-dragging')).toBe(true);
    });

    it('should reorder on drop before target', () => {
      const items = instance!.getItems();
      const dragged = items[0];
      const target = items[2];

      dragged.dispatchEvent(dragEvent('dragstart'));

      const rect = { top: 100, bottom: 140, left: 0, right: 200, width: 200, height: 40, x: 0, y: 100, toJSON: () => { } };
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect);

      target.dispatchEvent(dragEvent('dragover', { clientY: 105 }));
      target.dispatchEvent(dragEvent('drop', { clientY: 105 }));

      const result = instance!.getItems();
      expect(result[0]).toBe(items[1]);
      expect(result[1]).toBe(items[0]);
      expect(result[2]).toBe(items[2]);
    });

    it('should reorder on drop after target', () => {
      const items = instance!.getItems();
      const dragged = items[0];
      const target = items[1];

      dragged.dispatchEvent(dragEvent('dragstart'));

      const rect = { top: 100, bottom: 140, left: 0, right: 200, width: 200, height: 40, x: 0, y: 100, toJSON: () => { } };
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect);

      target.dispatchEvent(dragEvent('dragover', { clientY: 130 }));
      target.dispatchEvent(dragEvent('drop', { clientY: 130 }));

      const result = instance!.getItems();
      expect(result[1]).toBe(items[0]);
      expect(result[0]).toBe(items[1]);
    });

    it('should be a no-op when dropping on the same item', () => {
      const items = instance!.getItems();
      const item = items[0];

      item.dispatchEvent(dragEvent('dragstart'));
      item.dispatchEvent(dragEvent('drop', { clientY: 0 }));

      expect(instance!.getItems().map(el => el.textContent?.trim())).toEqual(['Apples', 'Bananas', 'Cherries', 'Grapes']);
    });

    it('should clean up on dragend', () => {
      const items = instance!.getItems();
      const item = items[0];

      item.dispatchEvent(dragEvent('dragstart'));
      expect(item.classList.contains('reorderable-dragging')).toBe(true);

      item.dispatchEvent(dragEvent('dragend'));
      expect(item.classList.contains('reorderable-dragging')).toBe(false);
      expect(instance!.getItems().length).toBe(4);
    });

    it('should fire onReorder after drop', () => {
      const onReorder = vi.fn();
      instance = new ReorderableList({ list, dragAndDrop: true, onReorder });
      const items = instance.getItems();
      const item = items[0];

      item.dispatchEvent(dragEvent('dragstart'));

      const rect = { top: 100, bottom: 140, left: 0, right: 200, width: 200, height: 40, x: 0, y: 100, toJSON: () => { } };
      vi.spyOn(items[2], 'getBoundingClientRect').mockReturnValue(rect);

      items[2].dispatchEvent(dragEvent('drop', { clientY: 105 }));

      expect(onReorder).toHaveBeenCalledTimes(1);
      const [, movedItem, newIndex] = onReorder.mock.calls[0];
      expect(movedItem).toBe(item);
      expect(newIndex).toBe(2);
    });
  });

  describe('data-tatami-component attribute', () => {
    it('sets correct attribute on list', () => {
      instance = new ReorderableList({ list });
      expect(list.getAttribute('data-tatami-component')).toBe('reorderableList');
    });
  });
});
