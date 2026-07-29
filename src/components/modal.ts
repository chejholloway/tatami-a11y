/**
 * Accessible Modal Component
 *
 * A modal dialog that follows WAI-ARIA patterns:
 * - Uses focus trap when open
 * - Uses focus stack for focus restoration
 * - Announces open/close states
 * - Supports keyboard navigation (Escape to close)
 * - Respects reduced motion preference
 * - Locks body scroll when open
 */

import {
  activateFocusTrap,
  deactivateFocusTrap,
} from '../shared/focusTrap.js';
import {
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
} from '../shared/focusStack.js';
import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';

export interface ModalOptions {
  trigger: HTMLElement;
  modal: HTMLElement;
  backdrop?: HTMLElement;
  onOpen?: () => void;
  onClose?: () => void;
}

export class Modal {
  private trigger: HTMLElement;
  private modal: HTMLElement;
  private backdrop?: HTMLElement;
  private isOpen: boolean = false;
  private onOpen?: () => void;
  private onClose?: () => void;
  private previousBodyOverflow: string = '';
  private focusableElements: HTMLElement[] = [];
  private initialFocusElement?: HTMLElement;
  private triggerClickHandler: () => void = () => this.open();
  private modalKeydownHandler: (e: KeyboardEvent) => void = (e) => this.handleKeyDown(e);
  private backdropClickHandler?: () => void;

  constructor(options: ModalOptions) {
    this.trigger = options.trigger;
    this.modal = options.modal;
    this.backdrop = options.backdrop;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;

    this.init();
  }

  private init(): void {
    // Set up ARIA attributes
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-hidden', 'true');

    // Find focusable elements within modal
    this.focusableElements = this.getFocusableElements();

    // Set up event listeners
    this.trigger.addEventListener('click', this.triggerClickHandler);
    this.modal.addEventListener('keydown', this.modalKeydownHandler);

    // Backdrop click to close
    if (this.backdrop) {
      this.backdropClickHandler = () => this.close();
      this.backdrop.addEventListener('click', this.backdropClickHandler);
    }

    // Initially hide modal
    this.hideModal();
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(this.modal.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  public open(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.modal.setAttribute('aria-hidden', 'false');
    this.showModal();

    // Lock body scroll
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Set up focus management
    setInitialFocusReference(this.trigger);
    pushFocusStack(this.trigger);

    // Activate focus trap
    activateFocusTrap(this.modal);

    // Focus first focusable element or modal itself
    this.focusableElements = this.getFocusableElements();
    this.initialFocusElement = this.focusableElements[0] || this.modal;
    this.initialFocusElement.focus();

    // Announce
    const modalTitle = this.modal.querySelector('[id]')?.textContent || 'Modal';
    announce(`${modalTitle} opened`, { urgent: false });

    // Callback
    this.onOpen?.();
  }

  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.modal.setAttribute('aria-hidden', 'true');
    this.hideModal();

    // Restore body scroll
    document.body.style.overflow = this.previousBodyOverflow;

    // Restore focus
    deactivateFocusTrap();
    popFocusStack();

    // Announce
    const modalTitle = this.modal.querySelector('[id]')?.textContent || 'Modal';
    announce(`${modalTitle} closed`, { urgent: false });

    // Callback
    this.onClose?.();
  }

  private showModal(): void {
    const prefersReducedMotion = checkReducedMotion();
    this.modal.style.display = 'block';

    if (this.backdrop) {
      this.backdrop.style.display = 'block';
    }

    if (!prefersReducedMotion) {
      this.modal.style.transition = 'opacity 0.2s ease';
      this.modal.style.opacity = '0';

      if (this.backdrop) {
        this.backdrop.style.transition = 'opacity 0.2s ease';
        this.backdrop.style.opacity = '0';
      }

      requestAnimationFrame(() => {
        this.modal.style.opacity = '1';
        if (this.backdrop) {
          this.backdrop.style.opacity = '1';
        }
      });
    }
  }

  private hideModal(): void {
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      this.modal.style.opacity = '0';
      if (this.backdrop) {
        this.backdrop.style.opacity = '0';
      }

      setTimeout(() => {
        if (this.isOpen) return;
        this.modal.style.display = 'none';
        if (this.backdrop) {
          this.backdrop.style.display = 'none';
        }
      }, 200);
    } else {
      this.modal.style.display = 'none';
      if (this.backdrop) {
        this.backdrop.style.display = 'none';
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        this.trigger.focus();
        break;
    }
  }

  public destroy(): void {
    this.trigger.removeEventListener('click', this.triggerClickHandler);
    this.modal.removeEventListener('keydown', this.modalKeydownHandler);

    if (this.backdrop && this.backdropClickHandler) {
      this.backdrop.removeEventListener('click', this.backdropClickHandler);
    }

    if (this.isOpen) {
      this.close();
    }
  }
}
