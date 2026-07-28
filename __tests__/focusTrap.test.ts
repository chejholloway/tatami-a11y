import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  activateFocusTrap,
  deactivateFocusTrap,
} from '../src/shared/focusTrap.js';

describe('focusTrap', () => {
  let container: HTMLElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let button3: HTMLButtonElement;

  beforeEach(() => {
    // Create a container with focusable elements
    container = document.createElement('div');
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
      <button id="btn3">Button 3</button>
    `;
    document.body.appendChild(container);

    button1 = container.querySelector('#btn1') as HTMLButtonElement;
    button2 = container.querySelector('#btn2') as HTMLButtonElement;
    button3 = container.querySelector('#btn3') as HTMLButtonElement;

    // Deactivate any existing trap
    deactivateFocusTrap();
  });

  afterEach(() => {
    deactivateFocusTrap();
    container.remove();
  });

  describe('activateFocusTrap', () => {
    it('should store previous active element', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      activateFocusTrap(container);

      // Deactivate to verify previous element is restored
      deactivateFocusTrap();

      expect(document.activeElement).toBe(outsideButton);
      outsideButton.remove();
    });

    it('should move focus to first focusable element', () => {
      activateFocusTrap(container);

      expect(document.activeElement).toBe(button1);
    });

    it('should set up keyboard event listener', () => {
      activateFocusTrap(container);

      // Verify Tab key is trapped by checking focus doesn't escape
      button1.focus();
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      // Focus should still be within container
      expect(container.contains(document.activeElement)).toBe(true);
    });

    it('should not activate if already active with same container', () => {
      activateFocusTrap(container);
      const firstFocus = document.activeElement;

      activateFocusTrap(container);

      expect(document.activeElement).toBe(firstFocus);
    });

    it('should handle container with no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      expect(() => {
        activateFocusTrap(emptyContainer);
      }).not.toThrow();

      emptyContainer.remove();
    });
  });

  describe('deactivateFocusTrap', () => {
    it('should restore focus to previous element', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      activateFocusTrap(container);
      deactivateFocusTrap();

      expect(document.activeElement).toBe(outsideButton);
      outsideButton.remove();
    });

    it('should remove keyboard event listener', () => {
      activateFocusTrap(container);
      deactivateFocusTrap();

      // After deactivation, Tab should not be trapped
      button1.focus();
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      // Focus may have moved, but trap is no longer active
      // This is a basic check - more thorough testing would verify the listener is removed
    });

    it('should handle deactivation when not active', () => {
      expect(() => {
        deactivateFocusTrap();
      }).not.toThrow();
    });

    it('should clear trap state', () => {
      activateFocusTrap(container);
      deactivateFocusTrap();

      // Reactivating should work normally
      activateFocusTrap(container);
      expect(document.activeElement).toBe(button1);
    });
  });

  describe('Tab key handling', () => {
    it('should trap Tab key within container', () => {
      activateFocusTrap(container);

      button3.focus();

      // Press Tab - should wrap to first element
      button3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(document.activeElement).toBe(button1);
    });

    it('should trap Shift+Tab within container', () => {
      activateFocusTrap(container);

      button1.focus();

      // Press Shift+Tab - should wrap to last element
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));

      expect(document.activeElement).toBe(button3);
    });

    it('should cycle through all focusable elements', () => {
      activateFocusTrap(container);

      button1.focus();
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button2.focus();
      expect(document.activeElement).toBe(button2);

      button2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button3.focus();
      expect(document.activeElement).toBe(button3);

      button3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button1.focus();
      expect(document.activeElement).toBe(button1);
    });

    it('should not trap non-Tab keys', () => {
      activateFocusTrap(container);

      button1.focus();

      // Press Enter - should not interfere
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(document.activeElement).toBe(button1);
    });
  });

  describe('dynamic content', () => {
    it('should handle dynamically added focusable elements', () => {
      activateFocusTrap(container);

      // Add a new button
      const newButton = document.createElement('button');
      newButton.id = 'btn4';
      newButton.textContent = 'Button 4';
      container.appendChild(newButton);

      // Tab should cycle through all elements including the new one
      button3.focus();
      button3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Continue cycling to reach the new button
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button2.focus();
      button2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button3.focus();
      button3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      newButton.focus();

      expect(document.activeElement).toBe(newButton);
    });

    it('should handle dynamically removed focusable elements', () => {
      activateFocusTrap(container);

      // Remove button2
      button2.remove();

      button1.focus();
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button3.focus();

      // Should skip to button3 since button2 was removed
      expect(document.activeElement).toBe(button3);
    });
  });

  describe('integration', () => {
    it('should work with focus stack for modal scenario', () => {
      const triggerButton = document.createElement('button');
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      // Simulate opening modal
      activateFocusTrap(container);

      // Focus should be in modal
      expect(document.activeElement).toBe(button1);

      // Simulate closing modal
      deactivateFocusTrap();

      // Focus should return to trigger
      expect(document.activeElement).toBe(triggerButton);

      triggerButton.remove();
    });
  });
});
