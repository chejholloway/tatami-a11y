/**
 * Accessible Tooltip Component
 *
 * A tooltip that follows WAI-ARIA patterns:
 * - Uses aria-describedby to link trigger and tooltip
 * - Supports keyboard focus and mouse hover
 * - Can be dismissed via Escape key
 * - Respects reduced motion preference
 */

import { checkReducedMotion } from '../shared/reducedMotion.js';

export interface TooltipOptions {
  trigger: HTMLElement;
  tooltip: HTMLElement;
  /** Called when the tooltip becomes visible. Follows the same onOpen/onClose convention as Dropdown, Modal, etc. */
  onOpen?: () => void;
  onClose?: () => void;
  /** @deprecated Use onOpen instead — kept for backwards compatibility */
  onShow?: () => void;
  /** @deprecated Use onClose instead — kept for backwards compatibility */
  onHide?: () => void;
}

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

  constructor(options: TooltipOptions) {
    this.trigger = options.trigger;
    this.tooltip = options.tooltip;
    // Support both new names and the deprecated aliases so existing consumers don't break
    this.onOpen = options.onOpen ?? options.onShow;
    this.onClose = options.onClose ?? options.onHide;

    this.init();
  }

  private init(): void {
    // Make sure tooltip has an ID so we can link it
    if (!this.tooltip.id) {
      this.tooltip.id = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set ARIA attributes
    this.trigger.setAttribute('aria-describedby', this.tooltip.id);
    this.tooltip.setAttribute('role', 'tooltip');
    
    // Attach event listeners for mouse and keyboard interactions
    this.trigger.addEventListener('mouseenter', this.triggerMouseEnterHandler);
    this.trigger.addEventListener('mouseleave', this.triggerMouseLeaveHandler);
    this.trigger.addEventListener('focus', this.triggerFocusHandler);
    this.trigger.addEventListener('blur', this.triggerBlurHandler);
    this.trigger.addEventListener('keydown', this.triggerKeydownHandler);

    this.hideImmediately();
  }

  public show(): void {
    if (this.isVisible) return;
    this.isVisible = true;

    const prefersReducedMotion = checkReducedMotion();
    this.tooltip.style.display = 'block';

    if (!prefersReducedMotion) {
      this.tooltip.style.transition = 'opacity 0.2s ease';
      this.tooltip.style.opacity = '0';

      requestAnimationFrame(() => {
        this.tooltip.style.opacity = '1';
      });
    }

    this.onOpen?.();
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;

    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      this.tooltip.style.opacity = '0';
      setTimeout(() => {
        if (!this.isVisible) {
          this.tooltip.style.display = 'none';
        }
      }, 200);
    } else {
      this.tooltip.style.display = 'none';
    }

    this.onClose?.();
  }

  private hideImmediately(): void {
    this.isVisible = false;
    this.tooltip.style.display = 'none';
    this.tooltip.style.opacity = '0';
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isVisible) {
      e.preventDefault();
      this.hide();
    }
  }

  public destroy(): void {
    this.trigger.removeEventListener('mouseenter', this.triggerMouseEnterHandler);
    this.trigger.removeEventListener('mouseleave', this.triggerMouseLeaveHandler);
    this.trigger.removeEventListener('focus', this.triggerFocusHandler);
    this.trigger.removeEventListener('blur', this.triggerBlurHandler);
    this.trigger.removeEventListener('keydown', this.triggerKeydownHandler);

    if (this.isVisible) {
      this.hideImmediately();
    }
  }
}
