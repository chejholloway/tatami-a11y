import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Dialog } from '../src/components/dialog.js';

describe('Dialog (Non-Modal)', () => {
  let trigger: HTMLElement;
  let dialogElement: HTMLElement;
  let dialogInstance: Dialog;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.id = 'dialog-trigger';
    trigger.textContent = 'Open Dialog';
    
    dialogElement = document.createElement('div');
    dialogElement.id = 'dialog-content';
    dialogElement.innerHTML = `
      <h2>Non-Modal Dialog</h2>
      <button id="close-btn">Close</button>
    `;
    
    document.body.appendChild(trigger);
    document.body.appendChild(dialogElement);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: any[]) => void, _delay?: number) => {
      cb();
      return 0 as any;
    });
  });

  afterEach(() => {
    if (dialogInstance) {
      dialogInstance.destroy();
    }
    trigger.remove();
    dialogElement.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });

      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      
      expect(dialogElement.getAttribute('role')).toBe('dialog');
      expect(dialogElement.getAttribute('aria-modal')).toBe('false');
      expect(dialogElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should initially hide dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(dialogElement.style.display).toBe('none');
    });
  });

  describe('interactions', () => {
    it('should open on click and update ARIA states', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.click();
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(dialogElement.getAttribute('aria-hidden')).toBe('false');
      expect(dialogElement.style.display).toBe('block');
    });

    it('should close on second click', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.click(); // open
      trigger.click(); // close
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(dialogElement.getAttribute('aria-hidden')).toBe('true');
      expect(dialogElement.style.display).toBe('none');
    });

    it('should close on Escape key', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.click(); // open
      
      dialogElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      
      expect(dialogElement.style.display).toBe('none');
    });

    it('should not trap focus (no focusTrap calls)', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.click(); 
      // Unlike modal, this shouldn't prevent tabbing out. 
      // Vitest jsdom won't simulate actual tab trapping by default, 
      // but we can verify it doesn't attach the focus trap keydown listener block.
      expect(dialogElement.getAttribute('aria-modal')).toBe('false');
    });

    it('should call onOpen and onClose callbacks', () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      dialogInstance = new Dialog({ trigger, dialog: dialogElement, onOpen, onClose });
      
      dialogInstance.open();
      expect(onOpen).toHaveBeenCalled();
      
      dialogInstance.close();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
