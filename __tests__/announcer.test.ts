import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { announce } from '../src/shared/announcer.js';

describe('announcer', () => {
  beforeEach(() => {
    // The implementation never sets an id on the live regions — the
    // singleton keys are internal to createSingleton, not DOM ids — so
    // cleanup has to find them by their aria-live attribute instead.
    document.querySelectorAll('[aria-live]').forEach((el) => el.remove());

    // Clean up singleton state
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__a11y_announcer_polite__;
      delete (window as unknown as Record<string, unknown>).__a11y_announcer_assertive__;
    }

    // Mock requestAnimationFrame to execute callback immediately
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });
  });

  afterEach(() => {
    document.querySelectorAll('[aria-live]').forEach((el) => el.remove());

    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__a11y_announcer_polite__;
      delete (window as unknown as Record<string, unknown>).__a11y_announcer_assertive__;
    }

    vi.restoreAllMocks();
  });

  const getPoliteRegion = () => document.querySelector('[aria-live="polite"]');
  const getAssertiveRegion = () => document.querySelector('[aria-live="assertive"]');

  describe('announce', () => {
    it('should create polite live region on first call', () => {
      announce('Test message');

      const region = getPoliteRegion();
      expect(region).toBeTruthy();
      expect(region?.getAttribute('aria-live')).toBe('polite');
      expect(region?.getAttribute('aria-atomic')).toBe('false');
    });

    it('should create assertive live region on urgent call', () => {
      announce('Urgent message', { urgent: true });

      const region = getAssertiveRegion();
      expect(region).toBeTruthy();
      expect(region?.getAttribute('aria-live')).toBe('assertive');
      expect(region?.getAttribute('aria-atomic')).toBe('false');
    });

    it('should set message content in polite region', () => {
      announce('Test message');

      const region = getPoliteRegion();
      expect(region?.textContent).toBe('Test message');
    });

    it('should set message content in assertive region when urgent', () => {
      announce('Urgent message', { urgent: true });

      const region = getAssertiveRegion();
      expect(region?.textContent).toBe('Urgent message');
    });

    it('should clear previous content before announcing', () => {
      announce('First message');
      announce('Second message');

      const region = getPoliteRegion();
      expect(region?.textContent).toBe('Second message');
    });

    it('should default to non-urgent when options not provided', () => {
      announce('Default message');

      const politeRegion = getPoliteRegion();
      const assertiveRegion = getAssertiveRegion();

      expect(politeRegion?.textContent).toBe('Default message');
      expect(assertiveRegion).toBeFalsy();
    });

    it('should use polite region when urgent is false', () => {
      announce('Polite message', { urgent: false });

      const region = getPoliteRegion();
      expect(region?.textContent).toBe('Polite message');
    });

    it('should not throw in non-browser environment', () => {
      const originalDocument = global.document;
      delete (globalThis as { document?: Document }).document;

      expect(() => {
        announce('Test message');
      }).not.toThrow();

      global.document = originalDocument;
    });

    it('should position live region off-screen', () => {
      announce('Test message');

      const region = getPoliteRegion();
      expect(region).toBeTruthy();

      const styles = window.getComputedStyle(region!);
      expect(styles.position).toBe('absolute');
      expect(styles.left).toBe('-10000px');
      expect(styles.width).toBe('1px');
      expect(styles.height).toBe('1px');
      expect(styles.overflow).toBe('hidden');
    });

    it('should append live region to body', () => {
      announce('Test message');

      const region = getPoliteRegion();
      expect(region?.parentElement).toBe(document.body);
    });
  });
});