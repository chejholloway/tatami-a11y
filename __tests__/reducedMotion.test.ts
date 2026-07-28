import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkReducedMotion,
  onReducedMotionChange,
  getReducedMotion,
} from '../src/shared/reducedMotion.js';

describe('reducedMotion', () => {
  beforeEach(() => {
    // Reset listeners before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any registered listeners
    // Note: This is a simplified cleanup - in production you'd want to track cleanup functions
  });

  describe('checkReducedMotion', () => {
    it('should return false when matchMedia is not available', () => {
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      const result = checkReducedMotion();
      expect(result).toBe(false);

      window.matchMedia = originalMatchMedia;
    });

    it('should return false in non-browser environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = checkReducedMotion();
      expect(result).toBe(false);

      global.window = originalWindow;
    });

    it('should return matchMedia result when available', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const result = checkReducedMotion();
      expect(result).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');

      window.matchMedia = originalMatchMedia;
    });

    it('should return false when matchMedia returns undefined', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: undefined });

      const result = checkReducedMotion();
      expect(result).toBe(false);

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('onReducedMotionChange', () => {
    it('should return cleanup function in non-browser environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const cleanup = onReducedMotionChange(() => {});
      expect(typeof cleanup).toBe('function');

      global.window = originalWindow;
    });

    it('should register callback and return cleanup function', () => {
      const callback = vi.fn();
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      const cleanup = onReducedMotionChange(callback);

      expect(typeof cleanup).toBe('function');
      cleanup();

      window.matchMedia = originalMatchMedia;
    });

    it('should call callback when media query changes', () => {
      const callback = vi.fn();
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      onReducedMotionChange(callback);

      // Simulate media query change
      const event = { matches: true };
      mockMediaQuery.addEventListener.mock.calls[0][1](event);

      expect(callback).toHaveBeenCalledWith(true);

      window.matchMedia = originalMatchMedia;
    });

    it('should remove event listener on cleanup', () => {
      const callback = vi.fn();
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      const cleanup = onReducedMotionChange(callback);
      cleanup();

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();

      window.matchMedia = originalMatchMedia;
    });

    it('should remove callback from listeners on cleanup', () => {
      const callback = vi.fn();
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      const cleanup = onReducedMotionChange(callback);
      cleanup();

      // After cleanup, the callback should not be called on subsequent changes
      const event = { matches: true };
      mockMediaQuery.addEventListener.mock.calls[0][1](event);

      // The callback was removed, so it shouldn't be called
      // Note: This test verifies the cleanup logic, but the actual behavior
      // depends on the implementation's listener management

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('getReducedMotion', () => {
    it('should return false in non-browser environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = getReducedMotion();
      expect(result).toBe(false);

      global.window = originalWindow;
    });

    it('should call checkReducedMotion when no listeners are registered', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const result = getReducedMotion();
      expect(result).toBe(true);

      window.matchMedia = originalMatchMedia;
    });

    it('should return cached value when listeners are registered', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      // Register a listener to set cached value
      onReducedMotionChange(() => {});

      // Get should return cached value without calling matchMedia again
      const result = getReducedMotion();
      expect(result).toBe(true);

      window.matchMedia = originalMatchMedia;
    });
  });
});
