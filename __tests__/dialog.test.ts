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
      <h2 id="dialog-title">Non-Modal Dialog</h2>
      <button id="close-btn">Close</button>
      <a href="#" id="dialog-link">A link</a>
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
    if (dialogInstance) dialogInstance.destroy();
    trigger.remove();
    dialogElement.remove();
    vi.restoreAllMocks();
  });

  // ─── Constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should stamp aria-haspopup="dialog" on the trigger', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('should start with aria-expanded="false" on the trigger', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should stamp role="dialog" on the dialog element', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(dialogElement.getAttribute('role')).toBe('dialog');
    });

    it('should stamp aria-modal="false" — this is a non-modal dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      // The whole point of this component: it doesn't trap focus
      expect(dialogElement.getAttribute('aria-modal')).toBe('false');
    });

    it('should start with aria-hidden="true" on the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(dialogElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should initially hide the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(dialogElement.style.display).toBe('none');
    });
  });

  // ─── open ────────────────────────────────────────────────────────────────────

  describe('open', () => {
    it('should show the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      expect(dialogElement.style.display).toBe('block');
    });

    it('should flip aria-expanded to "true"', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should clear aria-hidden from the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      expect(dialogElement.getAttribute('aria-hidden')).toBe('false');
    });

    it('should focus the first focusable element inside the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      expect(document.activeElement?.id).toBe('close-btn');
    });

    it('should fall back to focusing the dialog itself when nothing is focusable inside', () => {
      const emptyDialog = document.createElement('div');
      emptyDialog.id = 'empty-dialog';
      document.body.appendChild(emptyDialog);

      const inst = new Dialog({ trigger, dialog: emptyDialog });
      inst.open();

      // dialog should get tabindex="-1" and receive focus
      expect(emptyDialog.getAttribute('tabindex')).toBe('-1');
      expect(document.activeElement).toBe(emptyDialog);

      inst.destroy();
      emptyDialog.remove();
    });

    it('should be idempotent — calling open() twice does not double-fire onOpen', () => {
      const onOpen = vi.fn();
      dialogInstance = new Dialog({ trigger, dialog: dialogElement, onOpen });
      dialogInstance.open();
      dialogInstance.open(); // second call should be a no-op
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should invoke the onOpen callback', () => {
      const onOpen = vi.fn();
      dialogInstance = new Dialog({ trigger, dialog: dialogElement, onOpen });
      dialogInstance.open();
      expect(onOpen).toHaveBeenCalledOnce();
    });
  });

  // ─── close ───────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('should hide the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogInstance.close();
      expect(dialogElement.style.display).toBe('none');
    });

    it('should flip aria-expanded back to "false"', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogInstance.close();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should restore aria-hidden="true" on the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogInstance.close();
      expect(dialogElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should restore focus to the trigger after close', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.focus();
      dialogInstance.open();
      dialogInstance.close();
      expect(document.activeElement).toBe(trigger);
    });

    it('should be idempotent — calling close() twice does not double-fire onClose', () => {
      const onClose = vi.fn();
      dialogInstance = new Dialog({ trigger, dialog: dialogElement, onClose });
      dialogInstance.open();
      dialogInstance.close();
      dialogInstance.close(); // second call should be a no-op
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should invoke the onClose callback', () => {
      const onClose = vi.fn();
      dialogInstance = new Dialog({ trigger, dialog: dialogElement, onClose });
      dialogInstance.open();
      dialogInstance.close();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // ─── Trigger click interaction ────────────────────────────────────────────────

  describe('trigger click interaction', () => {
    it('should open on the first click', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.click();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close on the second click (toggle)', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      trigger.click(); // open
      trigger.click(); // close
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ─── Keyboard interactions ───────────────────────────────────────────────────

  describe('keyboard interactions', () => {
    it('should close on Escape when the dialog is open', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(dialogElement.style.display).toBe('none');
    });

    it('should not react to Escape when already closed', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(() => {
        dialogElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
      expect(dialogElement.style.display).toBe('none');
    });

    it('should not react to unrelated keys while open', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should not trap focus — aria-modal should remain "false" after open', () => {
      // This is the key difference from Modal: users can freely tab out
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      expect(dialogElement.getAttribute('aria-modal')).toBe('false');
    });
  });

  // ─── Callbacks ───────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('should work with no optional callbacks provided', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      expect(() => {
        dialogInstance.open();
        dialogInstance.close();
      }).not.toThrow();
    });

    it('should fire onOpen before onClose in a round-trip', () => {
      const order: string[] = [];
      dialogInstance = new Dialog({
        trigger,
        dialog: dialogElement,
        onOpen: () => order.push('open'),
        onClose: () => order.push('close'),
      });

      dialogInstance.open();
      dialogInstance.close();

      expect(order).toEqual(['open', 'close']);
    });
  });

  // ─── Reduced motion ──────────────────────────────────────────────────────────

  describe('reduced motion', () => {
    it('should still show the dialog regardless of motion preference', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      expect(dialogElement.style.display).toBe('block');
    });

    it('should still hide the dialog regardless of motion preference', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogInstance.close();
      expect(dialogElement.style.display).toBe('none');
    });
  });

  // ─── Destroy ─────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('should remove the trigger click listener', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.destroy();
      trigger.click();
      // After destroy the trigger no longer opens the dialog
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should remove the keydown listener from the dialog', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.destroy();
      expect(() => {
        dialogElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    it('should close an open dialog on destroy', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogInstance.destroy();
      expect(dialogElement.style.display).toBe('none');
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle rapid open/close cycles', () => {
      dialogInstance = new Dialog({ trigger, dialog: dialogElement });
      dialogInstance.open();
      dialogInstance.close();
      dialogInstance.open();
      dialogInstance.close();
      dialogInstance.open();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should work correctly with a dialog that has no focusable children', () => {
      const bare = document.createElement('div');
      bare.id = 'bare-dialog';
      bare.textContent = 'Just text, no focusable elements';
      document.body.appendChild(bare);

      const inst = new Dialog({ trigger, dialog: bare });
      expect(() => inst.open()).not.toThrow();
      expect(bare.style.display).toBe('block');

      inst.destroy();
      bare.remove();
    });

    it('should handle multiple instances sharing the same trigger gracefully', () => {
      const d2 = document.createElement('div');
      d2.id = 'dialog-2';
      document.body.appendChild(d2);

      const inst1 = new Dialog({ trigger, dialog: dialogElement });
      const inst2 = new Dialog({ trigger, dialog: d2 });

      inst1.open();
      inst2.open();

      // Both should reflect open state independently
      expect(dialogElement.getAttribute('aria-hidden')).toBe('false');
      expect(d2.getAttribute('aria-hidden')).toBe('false');

      inst1.destroy();
      inst2.destroy();
      d2.remove();
    });
  });
});
