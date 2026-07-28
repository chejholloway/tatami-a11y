import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSingleton, registerCleanup } from '../src/shared/globalRegistry.js';

describe('globalRegistry', () => {
  beforeEach(() => {
    // Clean up window singleton state before each test
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__testSingleton__;
    }
  });

  afterEach(() => {
    // Clean up window singleton state after each test
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__testSingleton__;
    }
  });

  describe('createSingleton', () => {
    it('should create a new instance when none exists', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return { value: callCount };
      };

      const instance1 = createSingleton(factory, '__testSingleton__');
      const instance2 = createSingleton(factory, '__testSingleton__');

      expect(instance1).toEqual({ value: 1 });
      expect(instance2).toEqual({ value: 1 });
      expect(callCount).toBe(1);
    });

    it('should return the same instance on subsequent calls', () => {
      const factory = () => ({ value: Math.random() });

      const instance1 = createSingleton(factory, '__testSingleton__');
      const instance2 = createSingleton(factory, '__testSingleton__');

      expect(instance1).toBe(instance2);
    });

    it('should work with different keys for different singletons', () => {
      const factory1 = () => ({ type: 'singleton1' });
      const factory2 = () => ({ type: 'singleton2' });

      const instance1 = createSingleton(factory1, '__testSingleton1__');
      const instance2 = createSingleton(factory2, '__testSingleton2__');

      expect(instance1).toEqual({ type: 'singleton1' });
      expect(instance2).toEqual({ type: 'singleton2' });
      expect(instance1).not.toBe(instance2);
    });

    it('should use default key when none provided', () => {
      const factory = () => ({ value: 'default' });

      const instance = createSingleton(factory);

      expect(instance).toEqual({ value: 'default' });
    });

    it('should create new instance in non-browser environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      let callCount = 0;
      const factory = () => {
        callCount++;
        return { value: callCount };
      };

      const instance1 = createSingleton(factory, '__testSingleton__');
      const instance2 = createSingleton(factory, '__testSingleton__');

      expect(callCount).toBe(2);
      expect(instance1).toEqual({ value: 1 });
      expect(instance2).toEqual({ value: 2 });

      global.window = originalWindow;
    });
  });

  describe('registerCleanup', () => {
    it('should register cleanup function', () => {
      let cleanupCalled = false;
      const cleanup = () => {
        cleanupCalled = true;
      };

      // Create singleton first
      createSingleton(() => ({ value: 1 }), '__testSingleton__');

      registerCleanup('__testSingleton__', cleanup);

      // Cleanup is registered but not called yet (only called when replaced)
      expect(cleanupCalled).toBe(false);
    });

    it('should call previous cleanup before registering new one', () => {
      let firstCleanupCalled = false;
      let secondCleanupCalled = false;

      const firstCleanup = () => {
        firstCleanupCalled = true;
      };

      const secondCleanup = () => {
        secondCleanupCalled = true;
      };

      // Create singleton first
      createSingleton(() => ({ value: 1 }), '__testSingleton__');

      registerCleanup('__testSingleton__', firstCleanup);
      
      // Register second cleanup - should call first
      registerCleanup('__testSingleton__', secondCleanup);

      expect(firstCleanupCalled).toBe(true);
      expect(secondCleanupCalled).toBe(false); // Second not called yet
    });

    it('should not throw if singleton does not exist', () => {
      const cleanup = () => {};

      expect(() => {
        registerCleanup('__nonExistent__', cleanup);
      }).not.toThrow();
    });

    it('should return early in non-browser environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      let cleanupCalled = false;
      const cleanup = () => {
        cleanupCalled = true;
      };

      registerCleanup('__testSingleton__', cleanup);

      expect(cleanupCalled).toBe(false);

      global.window = originalWindow;
    });
  });
});
