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

    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: any[]) => void, _delay?: number) => {
      cb();
      return 0 as any;
    });
  });

  afterEach(() => {
    if (tooltipInstance) {
      tooltipInstance.destroy();
    }
    trigger.remove();
    tooltipElement.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });

      expect(trigger.getAttribute('aria-describedby')).toBe(tooltipElement.id);
      expect(tooltipElement.getAttribute('role')).toBe('tooltip');
    });

    it('should generate an ID for tooltip if none exists', () => {
      const tooltipWithoutId = document.createElement('div');
      document.body.appendChild(tooltipWithoutId);
      
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipWithoutId });

      expect(tooltipWithoutId.id).toBeTruthy();
      expect(trigger.getAttribute('aria-describedby')).toBe(tooltipWithoutId.id);
      tooltipWithoutId.remove();
    });

    it('should initially hide tooltip', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });

      expect(tooltipElement.style.display).toBe('none');
    });
  });

  describe('interactions', () => {
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

    it('should hide on Escape key', () => {
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement });
      tooltipInstance.show();
      
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      
      expect(tooltipElement.style.display).toBe('none');
    });

    it('should call onShow and onHide callbacks', () => {
      const onShow = vi.fn();
      const onHide = vi.fn();
      tooltipInstance = new Tooltip({ trigger, tooltip: tooltipElement, onShow, onHide });
      
      tooltipInstance.show();
      expect(onShow).toHaveBeenCalled();
      
      tooltipInstance.hide();
      expect(onHide).toHaveBeenCalled();
    });
  });
});
