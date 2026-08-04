import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TreeView } from '../src/components/treeView.js';

function buildFixture(): { tree: HTMLElement } {
  const tree = document.createElement('ul');
  tree.innerHTML = `
    <li data-label="Fruits" data-children="true">
      <span class="label">Fruits</span>
      <ul>
        <li data-label="Apple"><span class="label">Apple</span></li>
        <li data-label="Banana"><span class="label">Banana</span></li>
        <li data-label="Cherry" data-expanded="true" data-children="true">
          <span class="label">Cherry</span>
          <ul>
            <li data-label="Sour"><span class="label">Sour</span></li>
            <li data-label="Sweet"><span class="label">Sweet</span></li>
          </ul>
        </li>
      </ul>
    </li>
    <li data-label="Vegetables" data-children="true">
      <span class="label">Vegetables</span>
      <ul>
        <li data-label="Carrot"><span class="label">Carrot</span></li>
        <li data-label="Lettuce"><span class="label">Lettuce</span></li>
      </ul>
    </li>
    <li data-label="Grains"><span class="label">Grains</span></li>
  `;
  return { tree };
}

describe('TreeView', () => {
  let tree: HTMLElement;
  let instance: TreeView;

  beforeEach(() => {
    tree = buildFixture().tree;
    document.body.appendChild(tree);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });
  });

  afterEach(() => {
    instance?.destroy();
    tree.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set role="tree" on the container', () => {
      instance = new TreeView({ tree });
      expect(tree.getAttribute('role')).toBe('tree');
    });

    it('should set role="treeitem" on all items', () => {
      instance = new TreeView({ tree });
      const items = tree.querySelectorAll(':scope [role="treeitem"]');
      expect(items.length).toBeGreaterThan(0);
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('treeitem');
      });
    });

    it('should set aria-expanded on nodes with children', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]')!;
      expect(fruits.getAttribute('aria-expanded')).toBe('false');
    });

    it('should NOT set aria-expanded on leaf nodes', () => {
      instance = new TreeView({ tree });
      const apple = tree.querySelector('[data-label="Apple"]')!;
      expect(apple.hasAttribute('aria-expanded')).toBe(false);
    });

    it('should set aria-level based on nesting depth', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]')!;
      const apple = tree.querySelector('[data-label="Apple"]')!;
      const sour = tree.querySelector('[data-label="Sour"]')!;
      expect(fruits.getAttribute('aria-level')).toBe('1');
      expect(apple.getAttribute('aria-level')).toBe('2');
      expect(sour.getAttribute('aria-level')).toBe('3');
    });

    it('should set aria-setsize and aria-posinset', () => {
      instance = new TreeView({ tree });
      const grains = tree.querySelector('[data-label="Grains"]')!;
      expect(grains.getAttribute('aria-setsize')).toBe('3');
      expect(grains.getAttribute('aria-posinset')).toBe('3');
    });

    it('should set aria-multiselectable when multiselect is true', () => {
      instance = new TreeView({ tree, multiselect: true });
      expect(tree.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should not set aria-multiselectable by default', () => {
      instance = new TreeView({ tree });
      expect(tree.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('should set tabindex="0" on only the first visible item', () => {
      instance = new TreeView({ tree });
      const visible = tree.querySelectorAll('[role="treeitem"]:not([aria-hidden="true"])');
      let zeroCount = 0;
      visible.forEach(el => {
        if (el.getAttribute('tabindex') === '0') zeroCount++;
      });
      expect(zeroCount).toBe(1);
    });

    it('should handle null tree gracefully', () => {
      instance = new TreeView({ tree: null! });
      expect(() => instance.destroy()).not.toThrow();
    });

    it('should handle empty tree gracefully', () => {
      const empty = document.createElement('ul');
      document.body.appendChild(empty);
      instance = new TreeView({ tree: empty });
      expect(empty.getAttribute('role')).toBe('tree');
      empty.remove();
    });
  });

  describe('expand / collapse', () => {
    it('should expand a closed branch on ArrowRight', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]') as HTMLElement;
      instance.selectNode(0);
      fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(fruits.getAttribute('aria-expanded')).toBe('true');
    });

    it('should collapse an open branch on ArrowLeft', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]') as HTMLElement;
      instance.selectNode(0);
      fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(fruits.getAttribute('aria-expanded')).toBe('true');
      fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(fruits.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show/hide children when expanding/collapsing', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]') as HTMLElement;
      instance.selectNode(0);
      fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const sublist = fruits.querySelector('ul') as HTMLElement;
      expect(sublist.hidden).toBe(false);
      fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(sublist.hidden).toBe(true);
    });

    it('should not expand a leaf node on ArrowRight', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]') as HTMLElement;
      instance.selectNode(0);
      fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const items = instance.getItems();
      instance.selectNode(1);
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(items[1].hasAttribute('aria-expanded')).toBe(false);
    });
  });

  describe('keyboard navigation (single select)', () => {
    it('should move to next visible item on ArrowDown', () => {
      instance = new TreeView({ tree });
      instance.selectNode(0);
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('should move to previous visible item on ArrowUp', () => {
      instance = new TreeView({ tree });
      instance.selectNode(1);
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should move to first item on Home', () => {
      instance = new TreeView({ tree });
      instance.selectNode(2);
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should move to last item on End', () => {
      instance = new TreeView({ tree });
      instance.selectNode(0);
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('should select on Enter', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, onSelect });
      const items = instance.getItems();
      instance.selectNode(1);
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(onSelect).toHaveBeenCalledWith(items[1], 1);
    });

    it('should select on Space', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, onSelect });
      const items = instance.getItems();
      instance.selectNode(1);
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(onSelect).toHaveBeenCalledWith(items[1], 1);
    });

    it('should auto-select on ArrowDown in single-select mode', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, onSelect });
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(items[1].getAttribute('aria-selected')).toBe('true');
      expect(onSelect).toHaveBeenCalledWith(items[1], 1);
    });

    it('should move focus to parent on ArrowLeft from closed branch', () => {
      instance = new TreeView({ tree });
      const items = instance.getItems();
      instance.selectNode(0); // Fruits
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const visibleAfter = instance.getItems();
      expect(visibleAfter.length).toBeGreaterThan(items.length);
      instance.selectNode(1);
      visibleAfter[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement?.getAttribute('data-label')).toBe('Fruits');
    });
  });

  describe('typeahead', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should jump to next node matching typed character', () => {
      instance = new TreeView({ tree });
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      expect(document.activeElement).toBe(items[2]);
    });

    it('should wrap typeahead search', () => {
      instance = new TreeView({ tree });
      const items = instance.getItems();
      instance.selectNode(items.length - 1);
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should accumulate multiple characters', () => {
      instance = new TreeView({ tree });
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
      expect(document.activeElement).toBe(items[2]);
    });

    it('should reset typeahead buffer after timeout', () => {
      instance = new TreeView({ tree });
      const items = instance.getItems();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      vi.advanceTimersByTime(600);
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });
  });

  describe('multi-select', () => {
    it('should allow selecting multiple nodes', () => {
      instance = new TreeView({ tree, multiselect: true });
      instance.selectNode(0);
      instance.selectNode(1);
      expect(instance.getSelectedNodes()).toEqual([0, 1]);
    });

    it('should replace selection on Space (deselect others, select only this)', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, multiselect: true, onSelect });
      const items = instance.getItems();
      instance.selectNode(0);
      instance.selectNode(1);
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(instance.getSelectedNodes()).toEqual([1]);
      expect(onSelect).toHaveBeenCalledWith(items[1], 1);
    });

    it('should toggle selection on Ctrl+Space', () => {
      instance = new TreeView({ tree, multiselect: true });
      const items = instance.getItems();
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true }));
      expect(instance.getSelectedNodes()).toEqual([0]);
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true }));
      expect(instance.getSelectedNodes()).toEqual([]);
    });

    it('should select only clicked node on plain click (deselect others)', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, multiselect: true, onSelect });
      const items = instance.getItems();
      instance.selectNode(0);
      instance.selectNode(2);
      expect(instance.getSelectedNodes()).toEqual([0, 2]);
      items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(instance.getSelectedNodes()).toEqual([1]);
      expect(onSelect).toHaveBeenCalledWith(items[1], 1);
    });

    it('should toggle on Ctrl+Click', () => {
      instance = new TreeView({ tree, multiselect: true });
      const items = instance.getItems();
      instance.selectNode(0);
      instance.selectNode(2);
      expect(instance.getSelectedNodes()).toEqual([0, 2]);
      items[1].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
      const itemsAfter = instance.getItems();
      const selectedAfter = instance.getSelectedNodes();
      expect(selectedAfter.length).toBe(3);
      expect(selectedAfter).toContain(0);
      expect(selectedAfter).toContain(itemsAfter.indexOf(items[1]));
      expect(selectedAfter).toContain(itemsAfter.indexOf(items[2]));
      expect(items[1].getAttribute('aria-selected')).toBe('true');
      items[1].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
      const itemsFinal = instance.getItems();
      expect(instance.getSelectedNodes()).toEqual([0, itemsFinal.indexOf(items[2])]);
      expect(items[1].getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('selectNode / getSelectedNodes', () => {
    it('should select a node by index', () => {
      instance = new TreeView({ tree });
      instance.selectNode(1);
      expect(instance.getSelectedNodes()).toEqual([1]);
    });

    it('should update aria-selected on the DOM', () => {
      instance = new TreeView({ tree });
      const items = instance.getItems();
      instance.selectNode(1);
      expect(items[1].getAttribute('aria-selected')).toBe('true');
      expect(items[0].getAttribute('aria-selected')).toBe('false');
    });

    it('should handle out-of-range index', () => {
      instance = new TreeView({ tree });
      instance.selectNode(999);
      expect(instance.getSelectedNodes()).toEqual([]);
    });

    it('should NOT fire onSelect from programmatic selectNode', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, onSelect });
      instance.selectNode(1);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle single node', () => {
      const single = document.createElement('ul');
      single.innerHTML = '<li><span class="label">Only</span></li>';
      document.body.appendChild(single);
      instance = new TreeView({ tree: single });
      expect(instance.getItems().length).toBe(1);
      single.remove();
    });

    it('should handle deeply nested tree', () => {
      const deep = document.createElement('ul');
      let inner = deep;
      for (let i = 0; i < 10; i++) {
        const li = document.createElement('li');
        li.setAttribute('data-children', 'true');
        li.innerHTML = `<span class="label">Level ${i}</span>`;
        const ul = document.createElement('ul');
        li.appendChild(ul);
        inner.appendChild(li);
        inner = ul;
      }
      document.body.appendChild(deep);
      instance = new TreeView({ tree: deep });
      const items = instance.getItems();
      expect(items.length).toBe(1);
      deep.remove();
    });

    it('should not throw on rapid expand/collapse', () => {
      instance = new TreeView({ tree });
      const fruits = tree.querySelector('[data-label="Fruits"]') as HTMLElement;
      expect(() => {
        fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        fruits.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      const onSelect = vi.fn();
      instance = new TreeView({ tree, onSelect });
      const items = instance.getItems();
      instance.destroy();
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should be idempotent', () => {
      instance = new TreeView({ tree });
      instance.destroy();
      expect(() => instance.destroy()).not.toThrow();
    });

    it('should allow garbage collection', () => {
      instance = new TreeView({ tree });
      const roving = (instance as unknown as { roving: { getItems: () => unknown[] } }).roving;
      instance.destroy();
      expect(roving.getItems().length).toBe(0);
    });
  });

  describe('data-tatami-component attribute', () => {
    it('sets correct attribute on tree', () => {
      instance = new TreeView({ tree });
      expect(tree.getAttribute('data-tatami-component')).toBe('treeView');
    });
  });
});
