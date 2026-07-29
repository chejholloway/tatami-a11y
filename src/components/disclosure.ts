/**
 * Accessible Disclosure (Show/Hide) Component
 *
 * A simple toggle that follows WAI-ARIA patterns:
 * - Uses aria-expanded and aria-controls to link trigger and content
 * - Announces states via aria-expanded natively (or live region if desired)
 * - Supports keyboard navigation natively via button
 * - Respects reduced motion preference
 */

import { checkReducedMotion } from '../shared/reducedMotion.js';

export interface DisclosureOptions {
  trigger: HTMLElement;
  content: HTMLElement;
  onToggle?: (isExpanded: boolean) => void;
}

export class Disclosure {
  private trigger: HTMLElement;
  private content: HTMLElement;
  private isExpanded: boolean = false;
  private onToggle?: (isExpanded: boolean) => void;

  private triggerClickHandler = () => this.toggle();

  constructor(options: DisclosureOptions) {
    this.trigger = options.trigger;
    this.content = options.content;
    this.onToggle = options.onToggle;

    this.init();
  }

  private init(): void {
    // Ensure content has an ID for aria-controls
    if (!this.content.id) {
      this.content.id = `disclosure-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set up ARIA attributes
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.setAttribute('aria-controls', this.content.id);
    
    // Attach event listeners
    this.trigger.addEventListener('click', this.triggerClickHandler);

    this.hideContent();
  }

  public toggle(): void {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  public expand(): void {
    if (this.isExpanded) return;
    this.isExpanded = true;

    this.trigger.setAttribute('aria-expanded', 'true');
    this.showContent();

    this.onToggle?.(true);
  }

  public collapse(): void {
    if (!this.isExpanded) return;
    this.isExpanded = false;

    this.trigger.setAttribute('aria-expanded', 'false');
    this.hideContent();

    this.onToggle?.(false);
  }

  private showContent(): void {
    const prefersReducedMotion = checkReducedMotion();
    this.content.style.display = 'block';

    if (!prefersReducedMotion) {
      this.content.style.transition = 'opacity 0.2s ease, max-height 0.2s ease';
      this.content.style.opacity = '0';
      this.content.style.maxHeight = '0';

      requestAnimationFrame(() => {
        this.content.style.opacity = '1';
        this.content.style.maxHeight = '1000px'; // Arbitrary max-height for simple transition
      });
    }
  }

  private hideContent(): void {
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      this.content.style.opacity = '0';
      this.content.style.maxHeight = '0';

      setTimeout(() => {
        if (!this.isExpanded) {
          this.content.style.display = 'none';
        }
      }, 200);
    } else {
      this.content.style.display = 'none';
    }
  }

  public destroy(): void {
    this.trigger.removeEventListener('click', this.triggerClickHandler);
    
    if (this.isExpanded) {
      this.collapse();
    }
  }
}
