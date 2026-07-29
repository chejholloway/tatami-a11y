import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Modal } from '../src/components/modal.js';

describe('Modal', () => {
  let trigger: HTMLButtonElement;
  let modal: HTMLElement;
  let backdrop: HTMLElement;
  let modalInstance: Modal;

  beforeEach(() => {
    // Create trigger button
    trigger = document.createElement('button');
    trigger.id = 'modal-trigger';
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);

    // Create backdrop
    backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.style.display = 'none';
    document.body.appendChild(backdrop);

    // Create modal
    modal = document.createElement('div');
    modal.id = 'modal';
    modal.innerHTML = `
      <h2 id="modal-title">Test Modal</h2>
      <p>Modal content</p>
      <button id="modal-close">Close</button>
    `;
    modal.style.display = 'none';
    document.body.appendChild(modal);

    // Mock requestAnimationFrame for reduced motion tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    // Mock setTimeout for backdrop hiding tests
    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: any[]) => void, _delay?: number) => {
      cb();
      return 0 as any;
    });
  });

  afterEach(() => {
    if (modalInstance) {
      modalInstance.destroy();
    }
    trigger.remove();
    modal.remove();
    backdrop.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });

      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('should work without backdrop', () => {
      modalInstance = new Modal({ trigger, modal });

      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });
  });

  describe('open', () => {
    it('should open modal and set ARIA attributes', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      expect(modal.getAttribute('aria-hidden')).toBe('false');
      expect(modal.style.display).toBe('block');
    });

    it('should show backdrop when provided', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      expect(backdrop.style.display).toBe('block');
    });

    it('should lock body scroll', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should focus first focusable element', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      const closeButton = document.getElementById('modal-close');
      expect(document.activeElement).toBe(closeButton);
    });

    it('should call onOpen callback', () => {
      const onOpen = vi.fn();
      modalInstance = new Modal({ trigger, modal, backdrop, onOpen });
      modalInstance.open();

      expect(onOpen).toHaveBeenCalled();
    });

    it('should not open if already open', () => {
      const onOpen = vi.fn();
      modalInstance = new Modal({ trigger, modal, backdrop, onOpen });
      modalInstance.open();

      modalInstance.open();

      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('should close modal and set ARIA attributes', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();
      modalInstance.close();

      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('should hide backdrop when provided', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();
      modalInstance.close();

      expect(backdrop.style.display).toBe('none');
    });

    it('should restore body scroll', () => {
      document.body.style.overflow = 'auto';
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();
      modalInstance.close();

      expect(document.body.style.overflow).toBe('auto');
    });

    it('should call onClose callback', () => {
      const onClose = vi.fn();
      modalInstance = new Modal({ trigger, modal, backdrop, onClose });
      modalInstance.open();
      modalInstance.close();

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close if already closed', () => {
      const onClose = vi.fn();
      modalInstance = new Modal({ trigger, modal, backdrop, onClose });

      modalInstance.close();

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should close on Escape key', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      modal.dispatchEvent(escapeEvent);

      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('should focus trigger after Escape close', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      modal.dispatchEvent(escapeEvent);

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('backdrop click', () => {
    it('should close when backdrop is clicked', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();

      backdrop.click();

      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('trigger click', () => {
    it('should open modal when trigger is clicked', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      trigger.click();

      expect(modal.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.destroy();

      // Trigger click should not open modal after destroy
      trigger.click();

      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('should close modal if open', () => {
      modalInstance = new Modal({ trigger, modal, backdrop });
      modalInstance.open();
      modalInstance.destroy();

      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
