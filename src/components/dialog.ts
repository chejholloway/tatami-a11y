/**
 * Accessible Non-Modal Dialog Component
 *
 * A non-modal dialog that follows WAI-ARIA patterns:
 * - Uses focus stack for focus restoration upon close
 * - DOES NOT trap focus (unlike Modal), allowing users to tab out
 * - Announces open/close states
 * - Supports keyboard navigation (Escape to close)
 * - Respects reduced motion preference
 */

import {
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
} from '../shared/focusStack.js';
import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';

export interface DialogOptions {
  trigger: HTMLElement;
  dialog: HTMLElement;
  onOpen?: () => void;
  onClose?: () => void;
}

export class Dialog {
  private trigger: HTMLElement;
  private dialog: HTMLElement;
  private isOpen: boolean = false;
  private onOpen?: () => void;
  private onClose?: () => void;

  private triggerClickHandler = () => this.toggle();
  private dialogKeydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  constructor(options: DialogOptions) {
    this.trigger = options.trigger;
    this.dialog = options.dialog;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;

    this.init();
  }

  private init(): void {
    // Set up ARIA attributes
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.setAttribute('aria-haspopup', 'dialog');
    
    this.dialog.setAttribute('role', 'dialog');
    // Note: aria-modal="false" is technically the default, but explicitly setting it is good practice here
    this.dialog.setAttribute('aria-modal', 'false');
    this.dialog.setAttribute('aria-hidden', 'true');

    // Attach event listeners
    this.trigger.addEventListener('click', this.triggerClickHandler);
    this.dialog.addEventListener('keydown', this.dialogKeydownHandler);

    this.hideDialog();
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    this.trigger.setAttribute('aria-expanded', 'true');
    this.dialog.setAttribute('aria-hidden', 'false');
    
    // Remember where focus came from
    setInitialFocusReference(this.trigger);
    pushFocusStack(this.trigger);

    this.showDialog();

    // Focus first focusable element inside the dialog, or the dialog itself
    const firstFocusable = this.dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      this.dialog.setAttribute('tabindex', '-1');
      this.dialog.focus();
    }

    const dialogTitle = this.dialog.getAttribute('aria-label') || this.dialog.querySelector('[id]')?.textContent || 'Dialog';
    announce(`${dialogTitle} opened`, { urgent: false });

    this.onOpen?.();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.trigger.setAttribute('aria-expanded', 'false');
    this.dialog.setAttribute('aria-hidden', 'true');
    
    // Hand focus back gracefully
    popFocusStack();

    this.hideDialog();

    const dialogTitle = this.dialog.getAttribute('aria-label') || this.dialog.querySelector('[id]')?.textContent || 'Dialog';
    announce(`${dialogTitle} closed`, { urgent: false });

    this.onClose?.();
  }

  private showDialog(): void {
    const prefersReducedMotion = checkReducedMotion();
    this.dialog.style.display = 'block';

    if (!prefersReducedMotion) {
      this.dialog.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      this.dialog.style.opacity = '0';
      this.dialog.style.transform = 'translateY(-10px)';

      requestAnimationFrame(() => {
        this.dialog.style.opacity = '1';
        this.dialog.style.transform = 'translateY(0)';
      });
    }
  }

  private hideDialog(): void {
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      this.dialog.style.opacity = '0';
      this.dialog.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        if (!this.isOpen) {
          this.dialog.style.display = 'none';
        }
      }, 200);
    } else {
      this.dialog.style.display = 'none';
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isOpen) {
      e.preventDefault();
      this.close();
    }
  }

  public destroy(): void {
    this.trigger.removeEventListener('click', this.triggerClickHandler);
    this.dialog.removeEventListener('keydown', this.dialogKeydownHandler);

    if (this.isOpen) {
      this.close();
    }
  }
}
