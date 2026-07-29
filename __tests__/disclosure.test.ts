import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Disclosure } from '../src/components/disclosure.js';

describe('Disclosure', () => {
  let trigger: HTMLElement;
  let contentElement: HTMLElement;
  let disclosureInstance: Disclosure;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.id = 'disclosure-trigger';
    trigger.textContent = 'Toggle Content';
    
    contentElement = document.createElement('div');
    contentElement.id = 'disclosure-content';
    contentElement.innerHTML = `
      <p>Hidden content to be revealed</p>
    `;
    
    document.body.appendChild(trigger);
    document.body.appendChild(contentElement);

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
    if (disclosureInstance) {
      disclosureInstance.destroy();
    }
    trigger.remove();
    contentElement.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBe(contentElement.id);
    });

    it('should initially hide content', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(contentElement.style.display).toBe('none');
    });

    it('should generate an ID for content if none exists', () => {
      const contentWithoutId = document.createElement('div');
      document.body.appendChild(contentWithoutId);
      
      disclosureInstance = new Disclosure({ trigger, content: contentWithoutId });

      expect(contentWithoutId.id).toBeTruthy();
      expect(trigger.getAttribute('aria-controls')).toBe(contentWithoutId.id);
      contentWithoutId.remove();
    });
  });

  describe('interactions', () => {
    it('should expand on click and update ARIA states', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      trigger.click();
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(contentElement.style.display).toBe('block');
    });

    it('should collapse on second click', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      trigger.click(); // expand
      trigger.click(); // collapse
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(contentElement.style.display).toBe('none');
    });

    it('should call onToggle callback', () => {
      const onToggle = vi.fn();
      disclosureInstance = new Disclosure({ trigger, content: contentElement, onToggle });
      
      trigger.click(); // expand
      expect(onToggle).toHaveBeenCalledWith(true);
      
      trigger.click(); // collapse
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });
});
