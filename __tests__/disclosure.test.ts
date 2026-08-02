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
    contentElement.innerHTML = '<p>Hidden content to be revealed</p>';

    document.body.appendChild(trigger);
    document.body.appendChild(contentElement);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: unknown[]) => void, _delay?: number) => {
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  afterEach(() => {
    if (disclosureInstance) disclosureInstance.destroy();
    trigger.remove();
    contentElement.remove();
    vi.restoreAllMocks();
  });

  // ─── Constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should set aria-expanded="false" on the trigger', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-controls pointing at the content id', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(trigger.getAttribute('aria-controls')).toBe(contentElement.id);
    });

    it('should auto-generate an id when the content has none', () => {
      const anonymous = document.createElement('div');
      document.body.appendChild(anonymous);

      disclosureInstance = new Disclosure({ trigger, content: anonymous });

      expect(anonymous.id).toBeTruthy();
      expect(trigger.getAttribute('aria-controls')).toBe(anonymous.id);

      anonymous.remove();
    });

    it('should leave an existing id intact', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(contentElement.id).toBe('disclosure-content');
    });

    it('should initially hide the content', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(contentElement.style.display).toBe('none');
    });
  });

  // ─── expand ──────────────────────────────────────────────────────────────────

  describe('expand', () => {
    it('should show the content', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      expect(contentElement.style.display).toBe('block');
    });

    it('should flip aria-expanded to "true"', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should invoke onToggle with true', () => {
      const onToggle = vi.fn();
      disclosureInstance = new Disclosure({ trigger, content: contentElement, onToggle });
      disclosureInstance.expand();
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should be idempotent — expanding an already-expanded disclosure is a no-op', () => {
      const onToggle = vi.fn();
      disclosureInstance = new Disclosure({ trigger, content: contentElement, onToggle });
      disclosureInstance.expand();
      disclosureInstance.expand(); // second call should do nothing
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  // ─── collapse ────────────────────────────────────────────────────────────────

  describe('collapse', () => {
    it('should hide the content', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      disclosureInstance.collapse();
      expect(contentElement.style.display).toBe('none');
    });

    it('should flip aria-expanded back to "false"', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      disclosureInstance.collapse();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should invoke onToggle with false', () => {
      const onToggle = vi.fn();
      disclosureInstance = new Disclosure({ trigger, content: contentElement, onToggle });
      disclosureInstance.expand();
      disclosureInstance.collapse();
      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should be idempotent — collapsing an already-collapsed disclosure is a no-op', () => {
      const onToggle = vi.fn();
      disclosureInstance = new Disclosure({ trigger, content: contentElement, onToggle });
      disclosureInstance.collapse(); // already collapsed, should do nothing
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  // ─── toggle ──────────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('should expand when collapsed', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.toggle();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should collapse when expanded', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      disclosureInstance.toggle();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should alternate states across multiple toggles', () => {
      const states: boolean[] = [];
      disclosureInstance = new Disclosure({
        trigger,
        content: contentElement,
        onToggle: v => states.push(v),
      });

      disclosureInstance.toggle();
      disclosureInstance.toggle();
      disclosureInstance.toggle();

      expect(states).toEqual([true, false, true]);
    });
  });

  // ─── Trigger click interaction ────────────────────────────────────────────────

  describe('trigger click interaction', () => {
    it('should expand on the first click', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      trigger.click();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(contentElement.style.display).toBe('block');
    });

    it('should collapse on the second click', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      trigger.click(); // expand
      trigger.click(); // collapse
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(contentElement.style.display).toBe('none');
    });

    it('should call onToggle on each click', () => {
      const onToggle = vi.fn();
      disclosureInstance = new Disclosure({ trigger, content: contentElement, onToggle });

      trigger.click(); // → true
      expect(onToggle).toHaveBeenCalledWith(true);

      trigger.click(); // → false
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  // ─── Callbacks ───────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('should work fine when no onToggle is provided', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(() => {
        disclosureInstance.expand();
        disclosureInstance.collapse();
      }).not.toThrow();
    });

    it('should pass the correct expanded state each time', () => {
      const received: boolean[] = [];
      disclosureInstance = new Disclosure({
        trigger,
        content: contentElement,
        onToggle: v => received.push(v),
      });

      disclosureInstance.expand();
      disclosureInstance.collapse();
      disclosureInstance.expand();

      expect(received).toEqual([true, false, true]);
    });
  });

  // ─── Reduced motion ──────────────────────────────────────────────────────────

  describe('reduced motion', () => {
    it('should show content regardless of motion preference', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      expect(contentElement.style.display).toBe('block');
    });

    it('should hide content regardless of motion preference', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      disclosureInstance.collapse();
      expect(contentElement.style.display).toBe('none');
    });

    it('should apply opacity transition when not reduced motion', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      // rAF mock fires synchronously so opacity should already be 1
      expect(contentElement.style.opacity).toBe('1');
    });
  });

  // ─── Destroy ─────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('should remove the click listener so the trigger no longer toggles', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.destroy();
      trigger.click();
      // Listener is gone — content should still be hidden
      expect(contentElement.style.display).toBe('none');
    });

    it('should collapse if open before removing listeners', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      disclosureInstance.destroy();
      expect(contentElement.style.display).toBe('none');
    });

    it('should not throw if destroy is called on an already-collapsed instance', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      expect(() => disclosureInstance.destroy()).not.toThrow();
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should generate unique ids when multiple instances share no id on content', () => {
      const c1 = document.createElement('div');
      const c2 = document.createElement('div');
      document.body.appendChild(c1);
      document.body.appendChild(c2);

      const d1 = new Disclosure({ trigger: document.createElement('button'), content: c1 });
      const d2 = new Disclosure({ trigger: document.createElement('button'), content: c2 });

      expect(c1.id).not.toBe(c2.id);

      d1.destroy();
      d2.destroy();
      c1.remove();
      c2.remove();
    });

    it('should handle rapid expand/collapse without corrupting state', () => {
      disclosureInstance = new Disclosure({ trigger, content: contentElement });
      disclosureInstance.expand();
      disclosureInstance.collapse();
      disclosureInstance.expand();
      disclosureInstance.collapse();
      disclosureInstance.expand();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should work correctly when content has nested focusable children', () => {
      const richContent = document.createElement('div');
      richContent.innerHTML = `
        <input type="text" />
        <button>Save</button>
        <a href="#">Link</a>
      `;
      document.body.appendChild(richContent);

      const inst = new Disclosure({ trigger, content: richContent });
      inst.expand();

      expect(richContent.style.display).toBe('block');
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      inst.destroy();
      richContent.remove();
    });
  });
});
