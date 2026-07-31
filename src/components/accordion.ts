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

import { announce } from "../shared/announcer.js";
import { checkReducedMotion } from "../shared/reducedMotion.js";

/**
 * Options for configuring the {@link Accordion} component.
 */
export interface AccordionOptions {
  /**
   * The container element that holds all accordion headers and panels.
   */
  container: HTMLElement;
  /**
   * When true, multiple panels can be expanded simultaneously.
   * When false (default), expanding one panel collapses any other open panel.
   */
  allowMultiple?: boolean;
  /**
   * Called whenever a panel is toggled (expanded or collapsed).
   *
   * @param index - The index of the panel that was toggled
   * @param isExpanded - Whether the panel is now expanded
   */
  onToggle?: (index: number, isExpanded: boolean) => void;
}

/**
 * An accessible accordion component following the WAI-ARIA accordion pattern.
 *
 * Manages a set of expandable sections where each section consists of a header
 * button and its associated content panel. Supports single and multiple panel
 * modes, keyboard navigation (Arrow keys, Home, End, Enter, Space), and
 * announces expand/collapse states to assistive technology.
 *
 * @example
 * ```typescript
 * const accordion = new Accordion({
 *   container: document.getElementById('my-accordion'),
 *   allowMultiple: false,
 * });
 * ```
 */
export class Accordion {
  private container: HTMLElement;
  private allowMultiple: boolean;
  private onToggle?: (index: number, isExpanded: boolean) => void;
  private headers!: HTMLElement[];
  private panels!: HTMLElement[];
  private currentIndex: number = 0;
  private clickHandlers: Array<() => void> = [];
  private keydownHandlers: Array<(e: KeyboardEvent) => void> = [];

  /**
   * @param options - Configuration options for the accordion
   */
  constructor(options: AccordionOptions) {
    this.container = options.container;
    this.allowMultiple = options.allowMultiple ?? false;
    this.onToggle = options.onToggle;

    this.init();
  }

  private init(): void {
    // Set up ARIA attributes on container
    this.container.setAttribute("role", "region");

    // Get headers and panels
    this.headers = Array.from(this.container.querySelectorAll("button[aria-controls]"));

    this.panels = this.headers.map((header) => {
      const panelId = header.getAttribute("aria-controls");
      if (panelId) {
        return document.getElementById(panelId);
      }
      return null;
    }) as HTMLElement[];

    // Set up each header-panel pair
    this.headers.forEach((header, index) => {
      // Ensure header has an ID for aria-labelledby
      if (!header.id) {
        header.id = `accordion-header-${index}`;
      }

      // Ensure ARIA attributes are set (don't overwrite if already set)
      if (!header.getAttribute("role")) {
        header.setAttribute("role", "button");
      }
      header.setAttribute("aria-expanded", "false");
      header.setAttribute("tabindex", "0");

      const panel = this.panels[index];
      if (panel) {
        if (!panel.getAttribute("role")) {
          panel.setAttribute("role", "region");
        }
        panel.setAttribute("aria-labelledby", header.id);
        panel.hidden = true;
      }

      // Create and store event handlers
      const clickHandler = () => this.togglePanel(index);
      const keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e, index);

      this.clickHandlers.push(clickHandler);
      this.keydownHandlers.push(keydownHandler);

      // Event listeners
      header.addEventListener("click", clickHandler);
      header.addEventListener("keydown", keydownHandler);
    });
  }

  /**
   * Toggle a panel's expanded state by index.
   *
   * If the panel is expanded it will be collapsed, and vice versa.
   *
   * @param index - The index of the panel to toggle
   */
  public togglePanel(index: number): void {
    if (index < 0 || index >= this.headers.length) return;

    const header = this.headers[index];
    const isExpanded = header.getAttribute("aria-expanded") === "true";

    if (isExpanded) {
      this.collapsePanel(index);
    } else {
      this.expandPanel(index);
    }
  }

  /**
   * Expand a panel by index.
   *
   * If {@link AccordionOptions.allowMultiple} is false, any other expanded panels
   * are collapsed first.
   *
   * @param index - The index of the panel to expand
   */
  public expandPanel(index: number): void {
    if (index < 0 || index >= this.headers.length) return;

    const header = this.headers[index];
    const panel = this.panels[index];
    const isExpanded = header.getAttribute("aria-expanded") === "true";

    if (isExpanded) return;

    // If single panel mode, collapse other panels
    if (!this.allowMultiple) {
      this.headers.forEach((h, i) => {
        if (i !== index && h.getAttribute("aria-expanded") === "true") {
          this.collapsePanel(i);
        }
      });
    }

    // Expand this panel
    header.setAttribute("aria-expanded", "true");
    if (panel) this.showPanel(panel);

    // Announce
    const panelName = header.textContent || `Panel ${index + 1}`;
    announce(`${panelName} expanded`, { urgent: false });

    // Callback
    this.onToggle?.(index, true);
  }

  /**
   * Collapse a panel by index.
   *
   * @param index - The index of the panel to collapse
   */
  public collapsePanel(index: number): void {
    if (index < 0 || index >= this.headers.length) return;

    const header = this.headers[index];
    const panel = this.panels[index];
    const isExpanded = header.getAttribute("aria-expanded") === "true";

    if (!isExpanded) return;

    // Collapse this panel
    header.setAttribute("aria-expanded", "false");
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
      panel.style.transition = "opacity 0.2s ease, max-height 0.2s ease";
      panel.style.opacity = "0";
      panel.style.maxHeight = "0";

      requestAnimationFrame(() => {
        panel.style.opacity = "1";
        panel.style.maxHeight = "1000px";
      });
    }
  }

  private hidePanel(panel: HTMLElement): void {
    if (!panel) return;
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      panel.style.opacity = "0";
      panel.style.maxHeight = "0";

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
      case "Enter":
      case " ":
        e.preventDefault();
        this.togglePanel(index);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.focusHeader((index + 1) % this.headers.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.focusHeader((index - 1 + this.headers.length) % this.headers.length);
        break;
      case "Home":
        e.preventDefault();
        this.focusHeader(0);
        break;
      case "End":
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

  /**
   * Remove all event listeners and clean up the accordion.
   *
   * Call this when removing the accordion from the DOM to prevent memory leaks.
   */
  public destroy(): void {
    this.headers.forEach((header, index) => {
      header.removeEventListener("click", this.clickHandlers[index]);
      header.removeEventListener("keydown", this.keydownHandlers[index]);
    });
    this.clickHandlers = [];
    this.keydownHandlers = [];
  }
}
