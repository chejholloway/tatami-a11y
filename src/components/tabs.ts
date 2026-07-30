/**
 * Accessible Tabs Component
 *
 * A tab component that follows WAI-ARIA patterns:
 * - Proper ARIA roles (tablist, tab, tabpanel)
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Focus management
 * - Announces tab changes
 * - Respects reduced motion preference
 */

import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';

/**
 * Options for configuring the {@link Tabs} component.
 */
export interface TabOptions {
  /**
   * The container element that holds the tab buttons.
   * Receives `role="tablist"`.
   */
  tabList: HTMLElement;
  /**
   * Called when the active tab changes.
   *
   * @param index - The index of the newly activated tab
   */
  onTabChange?: (index: number) => void;
}

/**
 * An accessible tabs component following the WAI-ARIA tabs pattern.
 *
 * Manages a set of tab buttons (`role="tab"`) and their associated tab panels
 * (`role="tabpanel"`). Supports keyboard navigation (Arrow keys, Home, End)
 * and announces tab changes to assistive technology.
 *
 * @example
 * ```typescript
 * const tabs = new Tabs({
 *   tabList: document.getElementById('my-tablist'),
 * });
 * ```
 */
export class Tabs {
  private tabList: HTMLElement;
  private tabs!: HTMLElement[];
  private panels!: HTMLElement[];
  private currentIndex: number = 0;
  private onTabChange?: (index: number) => void;
  private tabClickHandlers: Array<() => void> = [];
  private tabKeydownHandlers: Array<(e: KeyboardEvent) => void> = [];

  /**
   * @param options - Configuration options for the tabs component
   */
  constructor(options: TabOptions) {
    this.tabList = options.tabList;
    this.onTabChange = options.onTabChange;

    this.init();
  }

  private init(): void {
    // Set up ARIA attributes
    this.tabList.setAttribute('role', 'tablist');

    // Get tabs and panels
    this.tabs = Array.from(this.tabList.querySelectorAll('[role="tab"]'));
    this.panels = this.tabs
      .map((tab) => {
        const panelId = tab.getAttribute('aria-controls');
        if (panelId) {
          return document.getElementById(panelId);
        }
        return null;
      }) as HTMLElement[];

    // Set up each tab
    this.tabs.forEach((tab, index) => {
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      const clickHandler = () => this.activateTab(index);
      const keydownHandler = (e: KeyboardEvent) => this.handleTabKeyDown(e, index);
      
      this.tabClickHandlers.push(clickHandler);
      this.tabKeydownHandlers.push(keydownHandler);
      
      tab.addEventListener('click', clickHandler);
      tab.addEventListener('keydown', keydownHandler);
    });

    // Set up each panel
    this.panels.forEach((panel, index) => {
      if (!panel) return;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', this.tabs[index].id);
      if (index !== 0) {
        panel.hidden = true;
      }
    });

    // Activate first tab
    this.activateTab(0, false);
  }

  /**
   * Activate a tab by index.
   *
   * Deactivates the current tab, activates the new one, and focuses it.
   *
   * @param index - The index of the tab to activate
   * @param shouldAnnounce - When true (default), announces the tab change
   */
  public activateTab(index: number, shouldAnnounce: boolean = true): void {
    if (index < 0 || index >= this.tabs.length) return;

    // Deactivate current tab
    const currentTab = this.tabs[this.currentIndex];
    const currentPanel = this.panels[this.currentIndex];

    currentTab.setAttribute('aria-selected', 'false');
    currentTab.setAttribute('tabindex', '-1');
    if (currentPanel) this.hidePanel(currentPanel);

    // Activate new tab
    const newTab = this.tabs[index];
    const newPanel = this.panels[index];

    newTab.setAttribute('aria-selected', 'true');
    newTab.setAttribute('tabindex', '0');
    newTab.focus();
    if (newPanel) this.showPanel(newPanel);

    this.currentIndex = index;

    // Announce
    if (shouldAnnounce) {
      const tabName = newTab.textContent || `Tab ${index + 1}`;
      announce(`Tab ${tabName} activated`, { urgent: false });
    }

    // Callback
    this.onTabChange?.(index);
  }

  private showPanel(panel: HTMLElement): void {
    if (!panel) return;
    const prefersReducedMotion = checkReducedMotion();
    panel.hidden = false;

    if (!prefersReducedMotion) {
      panel.style.transition = 'opacity 0.2s ease';
      panel.style.opacity = '0';

      requestAnimationFrame(() => {
        panel.style.opacity = '1';
      });
    }
  }

  private hidePanel(panel: HTMLElement): void {
    if (!panel) return;
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      panel.style.opacity = '0';
      setTimeout(() => {
        if (panel.hidden) return;
        panel.hidden = true;
      }, 200);
    } else {
      panel.hidden = true;
    }
  }

  private handleTabKeyDown(e: KeyboardEvent, index: number): void {
    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        const nextIndex = (index + 1) % this.tabs.length;
        this.activateTab(nextIndex);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const prevIndex = (index - 1 + this.tabs.length) % this.tabs.length;
        this.activateTab(prevIndex);
        break;
      }
      case 'Home':
        e.preventDefault();
        this.activateTab(0);
        break;
      case 'End':
        e.preventDefault();
        this.activateTab(this.tabs.length - 1);
        break;
    }
  }

  /**
   * Get the index of the currently active tab.
   *
   * @returns The active tab index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Remove all event listeners and clean up the tabs component.
   */
  public destroy(): void {
    this.tabs.forEach((tab, index) => {
      tab.removeEventListener('click', this.tabClickHandlers[index]);
      tab.removeEventListener('keydown', this.tabKeydownHandlers[index]);
    });
    this.tabClickHandlers = [];
    this.tabKeydownHandlers = [];
  }
}
