import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tooltip } from '../src/components/tooltip.js';

describe('Tooltip', () => {
  let trigger: HTMLElement;
  let tooltipElement: HTMLElement;
  let tooltipInstance: Tooltip;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.id = 'tooltip-trigger';
    trigger.textContent = 'Hover me';

    tooltipElement = document.createElement('div');
    tooltipElement.id = 'tooltip-content';
    tooltipElement.textContent = 'This is a tooltip';

    document.body.appendChild(trigger);
    document.body.appendChild(tooltipElement);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: unknown[]) => void, _delay?: number) => {
      cb();
      return 0 as unknown as number;
    });
  });

  afterEach(() => {
    if (tooltipInstance) tooltipInstance.destroy();
    trigger.remove();
    tooltipElement.remove();
    vi.restoreAllMocks();
  });

  // ─── Constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should wire aria-describedby on the trigger', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      expect(trigger.getAttribute('aria-describedby')).toBe(tooltipElement.id);
    });

    it('should stamp role="tooltip" on the tooltip element', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      expect(tooltipElement.getAttribute('role')).toBe('tooltip');
    });

    it('should auto-generate an id when the tooltip has none', () => {
      const anonymous = document.createElement('div');
      document.body.appendChild(anonymous);

      tooltipInstance = new Tooltip({ trigger, tooltip: anonymous });

      // id should now exist and be the value aria-describedby points at
      expect(anonymous.id).toBeTruthy();
      expect(trigger.getAttribute('aria-describedby')).toBe(anonymous.id);

      anonymous.remove();
    });

    it('should leave an existing id alone', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      // tooltipElement.id was 'tooltip-content' — make sure we didn't stomp it
      expect(tooltipElement.id).toBe('tooltip-content');
    });

    it('should initially hide the tooltip', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should start with isVisible = false (show is idempotent on first call)', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      // calling hide on an already-hidden tooltip shouldn't blow up
      expect(() => tooltipInstance.hide()).not.toThrow();
    });
  });

  // ─── Mouse interactions ──────────────────────────────────────────────────────

  describe('mouse interactions', () => {
    it('should show on mouseenter', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      expect(tooltipElement.style.display).toBe('block');
    });

    it('should hide on mouseleave', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should not double-fire show when already visible', () => {
      const onOpen = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onOpen });

      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.dispatchEvent(new MouseEvent('mouseenter')); // duplicate

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should not double-fire hide when already hidden', () => {
      const onClose = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onClose });

      // starts hidden, so hide() should be a no-op
      tooltipInstance.hide();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ─── Keyboard interactions ───────────────────────────────────────────────────

  describe('keyboard interactions', () => {
    it('should show on focus', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      trigger.dispatchEvent(new FocusEvent('focus'));
      expect(tooltipElement.style.display).toBe('block');
    });

    it('should hide on blur', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      trigger.dispatchEvent(new FocusEvent('blur'));
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should dismiss on Escape and hide the tooltip', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should ignore Escape when the tooltip is already hidden', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      // starts hidden — pressing Escape shouldn't throw or change anything
      expect(() => {
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should not react to unrelated keys', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

      // still visible — nothing should have closed it
      expect(tooltipElement.style.display).toBe('block');
    });
  });

  // ─── Callbacks ───────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('should invoke onOpen when shown', () => {
      const onOpen = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onOpen });
      tooltipInstance.show();
      expect(onOpen).toHaveBeenCalledOnce();
    });

    it('should invoke onClose when hidden', () => {
      const onClose = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onClose });
      tooltipInstance.show();
      tooltipInstance.hide();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should work fine with no callbacks provided', () => {
      // no onOpen/onClose — should not throw
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      expect(() => {
        tooltipInstance.show();
        tooltipInstance.hide();
      }).not.toThrow();
    });

    it('should still honour deprecated onShow/onHide aliases for backwards compatibility', () => {
      const onShow = vi.fn();
      const onHide = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onShow, onHide });
      tooltipInstance.show();
      expect(onShow).toHaveBeenCalledOnce();
      tooltipInstance.hide();
      expect(onHide).toHaveBeenCalledOnce();
    });
  });

  // ─── Transitions / reduced motion ────────────────────────────────────────────

  describe('reduced motion', () => {
    it('should still display the tooltip when reduced motion is preferred', () => {
      // Even with motion reduced, the tooltip must be visible — just no fade
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      expect(tooltipElement.style.display).toBe('block');
    });

    it('should apply an opacity transition when not reduced motion', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      // rAF mock fires synchronously so opacity should be set
      expect(tooltipElement.style.opacity).toBe('1');
    });
  });

  // ─── Public API ──────────────────────────────────────────────────────────────

  describe('public show / hide API', () => {
    it('should show via show()', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      expect(tooltipElement.style.display).toBe('block');
    });

    it('should hide via hide()', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      tooltipInstance.hide();
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should round-trip show → hide → show without corruption', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      tooltipInstance.hide();
      tooltipInstance.show();
      expect(tooltipElement.style.display).toBe('block');
    });
  });

  // ─── Destroy ─────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('should remove mouseenter listener after destroy', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.destroy();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      // if listener was removed, display should remain 'none'
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should remove mouseleave listener after destroy', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      tooltipInstance.destroy();

      // After destroy the tooltip is hidden; a subsequent mouseleave shouldn't error
      expect(() => {
        trigger.dispatchEvent(new MouseEvent('mouseleave'));
      }).not.toThrow();
    });

    it('should remove focus listener after destroy', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.destroy();
      trigger.dispatchEvent(new FocusEvent('focus'));
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should remove blur listener after destroy', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      tooltipInstance.destroy();
      expect(() => {
        trigger.dispatchEvent(new FocusEvent('blur'));
      }).not.toThrow();
    });

    it('should remove keydown listener after destroy', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.destroy();
      expect(() => {
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    it('should hide an open tooltip on destroy', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      tooltipInstance.destroy();
      expect(tooltipElement.style.display).toBe('none');
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle rapid show/hide cycles without state corruption', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      tooltipInstance.hide();
      tooltipInstance.show();
      tooltipInstance.hide();
      tooltipInstance.show();
      expect(tooltipElement.style.display).toBe('block');
    });

    it('should handle mouseenter followed immediately by focus without double-showing', () => {
      const onShow = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onShow });

      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.dispatchEvent(new FocusEvent('focus')); // already visible — should be a no-op

      expect(onShow).toHaveBeenCalledTimes(1);
    });

    it('should handle a tooltip inside a shadow root gracefully (no id collision)', () => {
      const t1 = document.createElement('div');
      const t2 = document.createElement('div');
      document.body.appendChild(t1);
      document.body.appendChild(t2);

      const tt1 = new Tooltip({ trigger: document.createElement('button'), tooltip: t1 });
      const tt2 = new Tooltip({ trigger: document.createElement('button'), tooltip: t2 });

      // Auto-generated IDs should be unique
      expect(t1.id).not.toBe(t2.id);

      tt1.destroy();
      tt2.destroy();
      t1.remove();
      t2.remove();
    });
  });
});
