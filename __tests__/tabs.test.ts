import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tabs } from '../src/components/tabs.js';

describe('Tabs', () => {
  let tabList: HTMLElement;
  let panels: HTMLElement[];
  let tabsInstance: Tabs;

  beforeEach(() => {
    tabList = document.createElement('div');
    tabList.id = 'tablist';
    tabList.innerHTML = `
      <button id="tab-1" role="tab" aria-controls="panel-1">Tab 1</button>
      <button id="tab-2" role="tab" aria-controls="panel-2">Tab 2</button>
      <button id="tab-3" role="tab" aria-controls="panel-3">Tab 3</button>
      <button id="tab-4" role="tab" aria-controls="panel-4">Tab 4</button>
      <button id="tab-5" role="tab" aria-controls="panel-5">Tab 5</button>
    `;
    
    panels = [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ];
    
    panels.forEach((panel, _index) => {
      panel.id = `panel-${_index + 1}`;
      panel.textContent = `Panel ${_index + 1} content`;
      document.body.appendChild(panel);
    });
    
    document.body.appendChild(tabList);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: unknown[]) => void, _delay?: number) => {
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  afterEach(() => {
    if (tabsInstance) {
      tabsInstance.destroy();
    }
    tabList.remove();
    panels.forEach(panel => panel.remove());
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes on tablist', () => {
      tabsInstance = new Tabs({ tabList });

      expect(tabList.getAttribute('role')).toBe('tablist');
    });

    it('should set up ARIA attributes on tabs', () => {
      tabsInstance = new Tabs({ tabList });

      const tabs = tabList.querySelectorAll('[role="tab"]');
      tabs.forEach((tab, _index) => {
        expect(tab.getAttribute('aria-selected')).toBe(_index === 0 ? 'true' : 'false');
        expect(tab.getAttribute('tabindex')).toBe(_index === 0 ? '0' : '-1');
      });
    });

    it('should set up ARIA attributes on panels', () => {
      tabsInstance = new Tabs({ tabList });

      panels.forEach((panel, _index) => {
        expect(panel.getAttribute('role')).toBe('tabpanel');
        expect(panel.getAttribute('aria-labelledby')).toBe(`tab-${_index + 1}`);
        expect(panel.hidden).toBe(_index !== 0);
      });
    });

    it('should activate first tab by default', () => {
      tabsInstance = new Tabs({ tabList });

      expect(tabsInstance.getCurrentIndex()).toBe(0);
    });

    it('should set up event listeners on tabs', () => {
      tabsInstance = new Tabs({ tabList });

      const tabs = tabList.querySelectorAll('[role="tab"]');
      // Event listeners are attached but not exposed as properties in modern browsers
      // Verify by triggering a click
      (tabs[1] as HTMLElement).click();
      expect(tabsInstance.getCurrentIndex()).toBe(1);
    });
  });

  describe('activateTab', () => {
    it('should activate tab and update ARIA attributes', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(1);

      const tabs = tabList.querySelectorAll('[role="tab"]');
      expect(tabs[0].getAttribute('aria-selected')).toBe('false');
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('tabindex')).toBe('0');
    });

    it('should show corresponding panel', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(1);

      expect(panels[0].hidden).toBe(true);
      expect(panels[1].hidden).toBe(false);
    });

    it('should focus activated tab', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(2);

      const tabs = tabList.querySelectorAll('[role="tab"]');
      expect(document.activeElement).toBe(tabs[2]);
    });

    it('should call onTabChange callback', () => {
      const onTabChange = vi.fn();
      tabsInstance = new Tabs({ tabList, onTabChange });
      tabsInstance.activateTab(1);

      expect(onTabChange).toHaveBeenCalledWith(1);
    });

    it('should not activate invalid index', () => {
      tabsInstance = new Tabs({ tabList });
      const originalIndex = tabsInstance.getCurrentIndex();
      
      tabsInstance.activateTab(-1);
      expect(tabsInstance.getCurrentIndex()).toBe(originalIndex);

      tabsInstance.activateTab(10);
      expect(tabsInstance.getCurrentIndex()).toBe(originalIndex);
    });

    it('should handle activating same tab', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(0);

      expect(tabsInstance.getCurrentIndex()).toBe(0);
      expect(panels[0].hidden).toBe(false);
    });

    it('should not announce when shouldAnnounce is false', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(1, false);

      expect(tabsInstance.getCurrentIndex()).toBe(1);
    });
  });

  describe('keyboard navigation', () => {
    it('should move to next tab on ArrowRight', () => {
      tabsInstance = new Tabs({ tabList });
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      tabs[0].dispatchEvent(arrowRightEvent);

      expect(tabsInstance.getCurrentIndex()).toBe(1);
    });

    it('should wrap to first tab on ArrowRight from last', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(4);
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      tabs[4].dispatchEvent(arrowRightEvent);

      expect(tabsInstance.getCurrentIndex()).toBe(0);
    });

    it('should move to previous tab on ArrowLeft', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(2);
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      tabs[2].dispatchEvent(arrowLeftEvent);

      expect(tabsInstance.getCurrentIndex()).toBe(1);
    });

    it('should wrap to last tab on ArrowLeft from first', () => {
      tabsInstance = new Tabs({ tabList });
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      tabs[0].dispatchEvent(arrowLeftEvent);

      expect(tabsInstance.getCurrentIndex()).toBe(4);
    });

    it('should move to first tab on Home', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(3);
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      tabs[3].dispatchEvent(homeEvent);

      expect(tabsInstance.getCurrentIndex()).toBe(0);
    });

    it('should move to last tab on End', () => {
      tabsInstance = new Tabs({ tabList });
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      tabs[0].dispatchEvent(endEvent);

      expect(tabsInstance.getCurrentIndex()).toBe(4);
    });
  });

  describe('click interaction', () => {
    it('should activate tab on click', () => {
      tabsInstance = new Tabs({ tabList });
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      (tabs[2] as HTMLElement).click();

      expect(tabsInstance.getCurrentIndex()).toBe(2);
    });

    it('should show corresponding panel on click', () => {
      tabsInstance = new Tabs({ tabList });
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      (tabs[3] as HTMLElement).click();

      expect(panels[3].hidden).toBe(false);
    });
  });

  describe('panel visibility', () => {
    it('should show panel with transition when not reduced motion', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(1);

      expect(panels[1].style.transition).toBeTruthy();
    });

    it('should hide panel with transition when not reduced motion', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(1);
      tabsInstance.activateTab(2);

      expect(panels[1].hidden).toBe(true);
    });

    it('should handle reduced motion preference', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(1);

      expect(panels[1].hidden).toBe(false);
    });
  });

  describe('getCurrentIndex', () => {
    it('should return current tab index', () => {
      tabsInstance = new Tabs({ tabList });
      
      expect(tabsInstance.getCurrentIndex()).toBe(0);

      tabsInstance.activateTab(2);
      expect(tabsInstance.getCurrentIndex()).toBe(2);
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.destroy();
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      (tabs[1] as HTMLElement).click();

      expect(tabsInstance.getCurrentIndex()).toBe(0);
    });

    it('should clear handler arrays', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.destroy();

      // Should not throw when trying to activate after destroy
      expect(() => tabsInstance.activateTab(1)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle single tab', () => {
      const singleTabList = document.createElement('div');
      singleTabList.id = 'single-tablist';
      singleTabList.innerHTML = `
        <button id="single-tab" role="tab" aria-controls="single-panel">Single Tab</button>
      `;
      
      const singlePanel = document.createElement('div');
      singlePanel.id = 'single-panel';
      singlePanel.textContent = 'Single panel content';
      
      document.body.appendChild(singleTabList);
      document.body.appendChild(singlePanel);

      tabsInstance = new Tabs({ tabList: singleTabList });

      expect(tabsInstance.getCurrentIndex()).toBe(0);

      singleTabList.remove();
      singlePanel.remove();
    });

    it('should handle two tabs', () => {
      const twoTabList = document.createElement('div');
      twoTabList.id = 'two-tablist';
      twoTabList.innerHTML = `
        <button id="tab-a" role="tab" aria-controls="panel-a">Tab A</button>
        <button id="tab-b" role="tab" aria-controls="panel-b">Tab B</button>
      `;
      
      const panelA = document.createElement('div');
      panelA.id = 'panel-a';
      const panelB = document.createElement('div');
      panelB.id = 'panel-b';
      
      document.body.appendChild(twoTabList);
      document.body.appendChild(panelA);
      document.body.appendChild(panelB);

      tabsInstance = new Tabs({ tabList: twoTabList });
      tabsInstance.activateTab(1);

      expect(tabsInstance.getCurrentIndex()).toBe(1);

      twoTabList.remove();
      panelA.remove();
      panelB.remove();
    });

    it('should handle rapid tab switching', () => {
      tabsInstance = new Tabs({ tabList });
      
      tabsInstance.activateTab(1);
      tabsInstance.activateTab(2);
      tabsInstance.activateTab(3);
      tabsInstance.activateTab(4);
      tabsInstance.activateTab(0);

      expect(tabsInstance.getCurrentIndex()).toBe(0);
    });

    it('should handle missing aria-controls', () => {
      const badTabList = document.createElement('div');
      badTabList.id = 'bad-tablist';
      badTabList.innerHTML = `
        <button id="bad-tab" role="tab">Bad Tab</button>
      `;
      
      document.body.appendChild(badTabList);

      tabsInstance = new Tabs({ tabList: badTabList });

      // Component should handle gracefully without panels
      expect(tabsInstance.getCurrentIndex()).toBe(0);

      badTabList.remove();
    });

    it('should handle panel not found', () => {
      const orphanTabList = document.createElement('div');
      orphanTabList.id = 'orphan-tablist';
      orphanTabList.innerHTML = `
        <button id="orphan-tab" role="tab" aria-controls="nonexistent-panel">Orphan Tab</button>
      `;
      
      document.body.appendChild(orphanTabList);

      tabsInstance = new Tabs({ tabList: orphanTabList });

      // Component should handle gracefully without panels
      expect(tabsInstance.getCurrentIndex()).toBe(0);

      orphanTabList.remove();
    });
  });

  describe('focus management', () => {
    it('should focus tab on activation', () => {
      tabsInstance = new Tabs({ tabList });
      tabsInstance.activateTab(2);

      const tabs = tabList.querySelectorAll('[role="tab"]');
      expect(document.activeElement).toBe(tabs[2]);
    });

    it('should update tabindex on activation', () => {
      tabsInstance = new Tabs({ tabList });
      
      const tabs = tabList.querySelectorAll('[role="tab"]');
      expect(tabs[0].getAttribute('tabindex')).toBe('0');
      expect(tabs[1].getAttribute('tabindex')).toBe('-1');

      tabsInstance.activateTab(1);
      expect(tabs[0].getAttribute('tabindex')).toBe('-1');
      expect(tabs[1].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('callbacks', () => {
    it('should call onTabChange with correct index', () => {
      const onTabChange = vi.fn();
      tabsInstance = new Tabs({ tabList, onTabChange });
      
      tabsInstance.activateTab(2);
      expect(onTabChange).toHaveBeenCalledWith(2);

      tabsInstance.activateTab(0);
      expect(onTabChange).toHaveBeenCalledWith(0);
    });

    it('should not call onTabChange for invalid index', () => {
      const onTabChange = vi.fn();
      tabsInstance = new Tabs({ tabList, onTabChange });
      
      // The activateTab method returns early for invalid indices
      // but the constructor calls activateTab(0) which is valid
      // So we need to check that invalid indices don't trigger the callback
      const originalCallCount = onTabChange.mock.calls.length;
      
      tabsInstance.activateTab(-1);
      tabsInstance.activateTab(10);
      
      // Callback should not have been called for the invalid indices
      expect(onTabChange.mock.calls.length).toBe(originalCallCount);
    });
  });
});
