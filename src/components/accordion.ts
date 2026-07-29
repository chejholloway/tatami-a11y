/**
 * Accessible Accordion Component
 *
 * An accordion that follows WAI-ARIA patterns:
 * - Proper ARIA attributes (region, expanded, controls, labelledby)
 * - Keyboard navigation (Arrow keys, Home, End, Enter, Space)
 * - Announces expand/collapse states
 * - Respects reduced motion preference
 * - Supports single or multiple panel modes
 */

import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';

export interface AccordionOptions {
  container: HTMLElement;
  allowMultiple?: boolean;
  onToggle?: (index: number, isExpanded: boolean) => void;
}

export class Accordion {
  private container: HTMLElement;
  private allowMultiple: boolean;
  private onToggle?: (index: number, isExpanded: boolean) => void;
  private headers!: HTMLElement[];
  private panels!: HTMLElement[];
  private currentIndex: number = 0;
  private clickHandlers: Array<() => void> = [];
  private keydownHandlers: Array<(e: KeyboardEvent) => void> = [];

  constructor(options: AccordionOptions) {
    this.container = options.container;
    this.allowMultiple = options.allowMultiple ?? false;
    this.onToggle = options.onToggle;

    this.init();
  }

  private init(): void {
    // Set up ARIA attributes on container
    this.container.setAttribute('role', 'region');

    // Get headers and panels
    this.headers = Array.from(
      this.container.querySelectorAll('button[aria-controls]')
    );

    this.panels = this.headers
      .map((header) => {
        const panelId = header.getAttribute('aria-controls');
        if (panelId) {
          return document.getElementById(panelId);
        }
        return null;
      }) as any;

    // Set up each header-panel pair
    this.headers.forEach((header, index) => {
      // Ensure header has an ID for aria-labelledby
      if (!header.id) {
        header.id = `accordion-header-${index}`;
      }

      // Ensure ARIA attributes are set (don't overwrite if already set)
      if (!header.getAttribute('role')) {
        header.setAttribute('role', 'button');
      }
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('tabindex', '0');

      const panel = this.panels[index];
      if (panel) {
        if (!panel.getAttribute('role')) {
          panel.setAttribute('role', 'region');
        }
        panel.setAttribute('aria-labelledby', header.id);
        panel.hidden = true;
      }

      // Create and store event handlers
      const clickHandler = () => this.togglePanel(index);
      const keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e, index);
      
      this.clickHandlers.push(clickHandler);
      this.keydownHandlers.push(keydownHandler);

      // Event listeners
      header.addEventListener('click', clickHandler);
      header.addEventListener('keydown', keydownHandler);
    });
  }

  public togglePanel(index: number): void {
    if (index < 0 || index >= this.headers.length) return;

    const header = this.headers[index];
    const isExpanded = header.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      this.collapsePanel(index);
    } else {
      this.expandPanel(index);
    }
  }

  public expandPanel(index: number): void {
    if (index < 0 || index >= this.headers.length) return;

    const header = this.headers[index];
    const panel = this.panels[index];
    const isExpanded = header.getAttribute('aria-expanded') === 'true';

    if (isExpanded) return;

    // If single panel mode, collapse other panels
    if (!this.allowMultiple) {
      this.headers.forEach((h, i) => {
        if (i !== index && h.getAttribute('aria-expanded') === 'true') {
          this.collapsePanel(i);
        }
      });
    }

    // Expand this panel
    header.setAttribute('aria-expanded', 'true');
    if (panel) this.showPanel(panel);

    // Announce
    const panelName = header.textContent || `Panel ${index + 1}`;
    announce(`${panelName} expanded`, { urgent: false });

    // Callback
    this.onToggle?.(index, true);
  }

  public collapsePanel(index: number): void {
    if (index < 0 || index >= this.headers.length) return;

    const header = this.headers[index];
    const panel = this.panels[index];
    const isExpanded = header.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) return;

    // Collapse this panel
    header.setAttribute('aria-expanded', 'false');
    if (panel) this.hidePanel(panel);

    // Announce
    const panelName = header.textContent || `Panel ${index + 1}`;
    announce(`${panelName} collapsed`, { urgent: false });

    // Callback
    this.onToggle?.(index, false);
  }

  private showPanel(panel: HTMLElement): void {
    if (!panel) return;
    const prefersReducedMotion = checkReducedMotion();
    panel.hidden = false;

    if (!prefersReducedMotion) {
      panel.style.transition = 'opacity 0.2s ease, max-height 0.2s ease';
      panel.style.opacity = '0';
      panel.style.maxHeight = '0';

      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.maxHeight = '1000px';
      });
    }
  }

  private hidePanel(panel: HTMLElement): void {
    if (!panel) return;
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      panel.style.opacity = '0';
      panel.style.maxHeight = '0';

      setTimeout(() => {
        if (panel.hidden) return;
        panel.hidden = true;
      }, 200);
    } else {
      panel.hidden = true;
    }
  }

  private handleKeyDown(e: KeyboardEvent, index: number): void {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.togglePanel(index);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.focusHeader((index + 1) % this.headers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusHeader((index - 1 + this.headers.length) % this.headers.length);
        break;
      case 'Home':
        e.preventDefault();
        this.focusHeader(0);
        break;
      case 'End':
        e.preventDefault();
        this.focusHeader(this.headers.length - 1);
        break;
    }
  }

  private focusHeader(index: number): void {
    if (index < 0 || index >= this.headers.length) return;
    this.headers[index].focus();
    this.currentIndex = index;
  }

  public destroy(): void {
    this.headers.forEach((header, index) => {
      header.removeEventListener('click', this.clickHandlers[index]);
      header.removeEventListener('keydown', this.keydownHandlers[index]);
    });
    this.clickHandlers = [];
    this.keydownHandlers = [];
  }
}
