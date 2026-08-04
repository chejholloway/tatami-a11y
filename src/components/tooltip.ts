/**
 * Accessible Tooltip Component
 *
 * A tooltip that follows WAI-ARIA patterns:
 * - Uses aria-describedby to link trigger and tooltip
 * - Supports keyboard focus and mouse hover
 * - Can be dismissed via Escape key
 * - Respects reduced motion preference
 */

import { checkReducedMotion } from "../shared/reducedMotion.js";

/**
 * Options for configuring the {@link Tooltip} component.
 */
export interface TooltipOptions {
  /**
   * The element that triggers the tooltip on hover or focus.
   */
  trigger: HTMLElement;
  /**
   * The tooltip element that is shown and hidden.
   */
  tooltip: HTMLElement;
  /**
   * Called when the tooltip becomes visible.
   */
  onOpen?: () => void;
  /**
   * Called when the tooltip is hidden.
   */
  onClose?: () => void;
  /**
   * @deprecated Use {@link TooltipOptions.onOpen} instead — kept for backwards compatibility.
   */
  onShow?: () => void;
  /**
   * @deprecated Use {@link TooltipOptions.onClose} instead — kept for backwards compatibility.
   */
  onHide?: () => void;
}

/**
 * An accessible tooltip component following WAI-ARIA patterns.
 *
 * Links the trigger element to the tooltip via `aria-describedby`.
 * The tooltip appears on hover and focus, and can be dismissed via Escape.
 *
 * @example
 * ```typescript
 * const tooltip = new Tooltip({
 *   trigger: document.getElementById('tooltip-trigger'),
 *   tooltip: document.getElementById('tooltip-content'),
 * });
 * ```
 */
export class Tooltip {
  private trigger: HTMLElement;
  private tooltip: HTMLElement;
  private isVisible: boolean = false;
  private onOpen?: () => void;
  private onClose?: () => void;

  private triggerMouseEnterHandler = () => this.show();
  private triggerMouseLeaveHandler = () => this.hide();
  private triggerFocusHandler = () => this.show();
  private triggerBlurHandler = () => this.hide();
  private triggerKeydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  /**
   * @param options - Configuration options for the tooltip
   */
  constructor(options: TooltipOptions) {
    this.trigger = options.trigger;
    this.tooltip = options.tooltip;
    // Support both new names and the deprecated aliases so existing consumers don't break
    this.onOpen = options.onOpen ?? options.onShow;
    this.onClose = options.onClose ?? options.onHide;

    this.init();
  }

  private init(): void {
    this.tooltip.setAttribute("data-tatami-component", "tooltip");
    // Make sure tooltip has an ID so we can link it
    if (!this.tooltip.id) {
      this.tooltip.id = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set ARIA attributes
    this.trigger.setAttribute("aria-describedby", this.tooltip.id);
    this.tooltip.setAttribute("role", "tooltip");

    // Attach event listeners for mouse and keyboard interactions
    this.trigger.addEventListener("mouseenter", this.triggerMouseEnterHandler);
    this.trigger.addEventListener("mouseleave", this.triggerMouseLeaveHandler);
    this.trigger.addEventListener("focus", this.triggerFocusHandler);
    this.trigger.addEventListener("blur", this.triggerBlurHandler);
    this.trigger.addEventListener("keydown", this.triggerKeydownHandler);

    this.hideImmediately();
  }

  /**
   * Show the tooltip.
   *
   * Makes the tooltip visible with a fade-in animation (unless reduced motion is preferred).
   */
  public show(): void {
    if (this.isVisible) return;
    this.isVisible = true;

    const prefersReducedMotion = checkReducedMotion();
    this.tooltip.style.display = "block";

    if (!prefersReducedMotion) {
      this.tooltip.style.transition = "opacity 0.2s ease";
      this.tooltip.style.opacity = "0";

      requestAnimationFrame(() => {
        this.tooltip.style.opacity = "1";
      });
    }

    this.onOpen?.();
  }

  /**
   * Hide the tooltip.
   *
   * Fades out the tooltip (unless reduced motion is preferred).
   */
  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;

    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      this.tooltip.style.opacity = "0";
      setTimeout(() => {
        if (!this.isVisible) {
          this.tooltip.style.display = "none";
        }
      }, 200);
    } else {
      this.tooltip.style.display = "none";
    }

    this.onClose?.();
  }

  private hideImmediately(): void {
    this.isVisible = false;
    this.tooltip.style.display = "none";
    this.tooltip.style.opacity = "0";
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.isVisible) {
      e.preventDefault();
      this.hide();
    }
  }

  /**
   * Remove all event listeners and clean up the tooltip.
   */
  public destroy(): void {
    this.trigger.removeEventListener("mouseenter", this.triggerMouseEnterHandler);
    this.trigger.removeEventListener("mouseleave", this.triggerMouseLeaveHandler);
    this.trigger.removeEventListener("focus", this.triggerFocusHandler);
    this.trigger.removeEventListener("blur", this.triggerBlurHandler);
    this.trigger.removeEventListener("keydown", this.triggerKeydownHandler);

    if (this.isVisible) {
      this.hideImmediately();
    }
  }
}
