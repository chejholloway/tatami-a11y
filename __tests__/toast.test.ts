import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Toast } from '../src/components/toast.js';

describe('Toast', () => {
  beforeEach(() => {
    // Reset static state
    Toast.destroy();
    
    // Mock requestAnimationFrame for reduced motion tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });
  });

  afterEach(() => {
    Toast.destroy();
    vi.restoreAllMocks();
  });

  describe('show', () => {
    it('should create toast element', () => {
      const id = Toast.show('Test message');
      
      expect(id).toBeTruthy();
      expect(id).toMatch(/^toast-\d+$/);
    });

    it('should create toast with info variant by default', () => {
      Toast.show('Test message');
      
      const toastElement = document.querySelector('.toast-stack .toast--info');
      expect(toastElement).toBeTruthy();
    });

    it('should create toast with specified variant', () => {
      Toast.show('Test message', { variant: 'success' });
      
      const toastElement = document.querySelector('.toast-stack .toast--success');
      expect(toastElement).toBeTruthy();
    });

    it('should create toast with error variant', () => {
      Toast.show('Test message', { variant: 'error' });
      
      const toastElement = document.querySelector('.toast-stack .toast--error');
      expect(toastElement).toBeTruthy();
    });

    it('should create toast with warning variant', () => {
      Toast.show('Test message', { variant: 'warning' });
      
      const toastElement = document.querySelector('.toast-stack .toast--warning');
      expect(toastElement).toBeTruthy();
    });

    it('should set correct ARIA role for variant', () => {
      Toast.show('Test message', { variant: 'error' });
      
      const toastElement = document.querySelector('.toast-stack .toast--error') as HTMLElement;
      expect(toastElement?.getAttribute('role')).toBe('alert');
    });

    it('should use custom ID if provided', () => {
      const customId = 'custom-toast-id';
      Toast.show('Test message', { id: customId });
      
      const toastElement = document.querySelector(`.toast-stack [data-toast-id="${customId}"]`);
      expect(toastElement).toBeTruthy();
    });

    it('should limit simultaneous toasts to max', () => {
      for (let i = 0; i < 7; i++) {
        Toast.show(`Message ${i}`);
      }
      
      const toasts = document.querySelectorAll('.toast-stack .toast');
      expect(toasts.length).toBe(5);
    });
  });

  describe('variant methods', () => {
    it('success() should create success toast', () => {
      Toast.success('Success message');
      
      const toastElement = document.querySelector('.toast-stack .toast--success');
      expect(toastElement).toBeTruthy();
    });

    it('error() should create error toast', () => {
      Toast.error('Error message');
      
      const toastElement = document.querySelector('.toast-stack .toast--error');
      expect(toastElement).toBeTruthy();
    });

    it('warning() should create warning toast', () => {
      Toast.warning('Warning message');
      
      const toastElement = document.querySelector('.toast-stack .toast--warning');
      expect(toastElement).toBeTruthy();
    });

    it('info() should create info toast', () => {
      Toast.info('Info message');
      
      const toastElement = document.querySelector('.toast-stack .toast--info');
      expect(toastElement).toBeTruthy();
    });
  });

  describe('dismiss', () => {
    it('should remove toast by ID', () => {
      const id = Toast.show('Test message');
      Toast.dismiss(id, { immediate: true });
      
      const toastElement = document.querySelector(`[data-toast-id="${id}"]`);
      expect(toastElement).toBeFalsy();
    });

    it('should handle dismissing non-existent toast', () => {
      expect(() => Toast.dismiss('non-existent')).not.toThrow();
    });
  });

  describe('dismissAll', () => {
    it('should remove all toasts', () => {
      Toast.show('Message 1');
      Toast.show('Message 2');
      Toast.show('Message 3');
      
      Toast.dismissAll({ immediate: true });
      
      const toasts = document.querySelectorAll('.toast-stack .toast');
      expect(toasts.length).toBe(0);
    });
  });

  describe('configure', () => {
    it('should set toast position', () => {
      Toast.configure({ position: 'bottom-left' });
      
      const stackWrapper = document.querySelector('.toast-stack') as HTMLElement;
      expect(stackWrapper?.getAttribute('data-position')).toBe('bottom-left');
    });
  });

  describe('destroy', () => {
    it('should remove all toasts and cleanup', () => {
      Toast.show('Message 1');
      Toast.show('Message 2');
      
      Toast.destroy();
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(0);
      
      const stackWrapper = document.querySelector('.toast-stack');
      expect(stackWrapper).toBeFalsy();
    });
  });

  describe('keyboard interaction', () => {
    it('should dismiss toast on Escape key', () => {
      const id = Toast.show('Test message');
      const toastElement = document.querySelector(`.toast-stack [data-toast-id="${id}"]`) as HTMLElement;
      
      if (!toastElement) {
        throw new Error('Toast element not found');
      }
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      toastElement.dispatchEvent(escapeEvent);
      
      // Verify the event handler was called by checking toast has hide class
      expect(toastElement.classList.contains('toast--hide')).toBe(true);
    });
  });

  describe('close button', () => {
    it('should dismiss toast when close button clicked', () => {
      const id = Toast.show('Test message');
      const closeButton = document.querySelector('.toast-stack .toast__close') as HTMLElement;
      
      if (!closeButton) {
        throw new Error('Close button not found');
      }
      
      closeButton.click();
      
      // Verify the click handler was called by checking toast has hide class
      const toastElement = document.querySelector(`.toast-stack [data-toast-id="${id}"]`) as HTMLElement;
      expect(toastElement?.classList.contains('toast--hide')).toBe(true);
    });
  });
});
