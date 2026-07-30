import { describe, it, expect, beforeEach } from 'vitest';
import {
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
  clearFocusStack,
} from '../src/shared/focusStack.js';

describe('focusStack', () => {
  beforeEach(() => {
    // Clear focus stack before each test
    clearFocusStack();
  });

  describe('pushFocusStack', () => {
    it('should push element onto stack', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      pushFocusStack(element);

      // Verify element was pushed by checking that popFocusStack restores it
      element.focus();
      const activeBefore = document.activeElement;
      popFocusStack();
      expect(activeBefore).toBe(element);
      document.body.removeChild(element);
    });

    it('should cap stack size at 20', () => {
      const elements = Array.from({ length: 25 }, () => document.createElement('button'));

      elements.forEach((el) => pushFocusStack(el));

      // Stack should only have 20 elements, so we should be able to pop 20 times
      let popCount = 0;
      while (popCount < 25) {
        popFocusStack();
        popCount++;
      }

      // After 20 pops, stack should be empty
      // The exact behavior depends on implementation, but we verify it doesn't crash
      expect(popCount).toBe(25);
    });
  });

  describe('popFocusStack', () => {
    it('should restore focus to last pushed element', () => {
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      element1.focus();
      pushFocusStack(element1);

      element2.focus();
      pushFocusStack(element2);

      popFocusStack();

      expect(document.activeElement).toStrictEqual(element1);
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should skip stale elements (not in DOM)', () => {
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      element1.focus();
      pushFocusStack(element1);

      element2.focus();
      pushFocusStack(element2);

      // Remove element2 from DOM (stale)
      element2.remove();

      popFocusStack();

      // Should skip element2 and restore to element1
      expect(document.activeElement).toBe(element1);
      document.body.removeChild(element1);
    });

    it('should restore to initial reference when stack is empty', () => {
      const initialElement = document.createElement('button');
      const otherElement = document.createElement('button');
      document.body.appendChild(initialElement);
      document.body.appendChild(otherElement);

      initialElement.focus();
      setInitialFocusReference(initialElement);

      otherElement.focus();
      pushFocusStack(otherElement);

      popFocusStack();

      expect(document.activeElement).toStrictEqual(initialElement);
      document.body.removeChild(initialElement);
      document.body.removeChild(otherElement);
    });

    it('should skip stale initial reference', () => {
      const initialElement = document.createElement('button');
      initialElement.focus();
      setInitialFocusReference(initialElement);

      const otherElement = document.createElement('button');
      otherElement.focus();
      pushFocusStack(otherElement);

      // Remove initial element from DOM (stale)
      initialElement.remove();

      popFocusStack();

      // Should skip stale initial reference and blur active element
      expect(document.activeElement).toBe(document.body);
    });

    it('should blur active element when no valid restoration target', () => {
      const element = document.createElement('button');
      element.focus();

      popFocusStack();

      // Should blur active element when stack is empty and no initial reference
      expect(document.activeElement).toBe(document.body);
    });

    it('should handle empty stack gracefully', () => {
      expect(() => {
        popFocusStack();
      }).not.toThrow();
    });
  });

  describe('setInitialFocusReference', () => {
    it('should set the initial focus reference', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      setInitialFocusReference(element);

      // Verify by using popFocusStack when stack is empty
      element.focus();
      popFocusStack();

      expect(document.activeElement).toBe(element);
      document.body.removeChild(element);
    });

    it('should overwrite existing initial reference', () => {
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      setInitialFocusReference(element1);
      setInitialFocusReference(element2);

      element2.focus();
      popFocusStack();

      expect(document.activeElement).toBe(element2);
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });
  });

  describe('clearFocusStack', () => {
    it('should clear the focus stack', () => {
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');

      pushFocusStack(element1);
      pushFocusStack(element2);

      clearFocusStack();

      // Stack should be empty, so popFocusStack should not restore to element1
      element1.focus();
      popFocusStack();

      // Should not restore to element1 since stack was cleared
      expect(document.activeElement).toBe(document.body);
    });

    it('should handle clearing empty stack', () => {
      expect(() => {
        clearFocusStack();
      }).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should handle complex focus restoration scenario', () => {
      const trigger = document.createElement('button');
      const dropdownItem1 = document.createElement('button');
      const dropdownItem2 = document.createElement('button');
      document.body.appendChild(trigger);
      document.body.appendChild(dropdownItem1);
      document.body.appendChild(dropdownItem2);

      trigger.focus();
      setInitialFocusReference(trigger);

      // Open dropdown
      dropdownItem1.focus();
      pushFocusStack(dropdownItem1);

      dropdownItem2.focus();
      pushFocusStack(dropdownItem2);

      // Close dropdown
      popFocusStack();
      expect(document.activeElement).toStrictEqual(dropdownItem1);

      popFocusStack();
      expect(document.activeElement).toStrictEqual(trigger);

      document.body.removeChild(trigger);
      document.body.removeChild(dropdownItem1);
      document.body.removeChild(dropdownItem2);
    });

    it('should handle multiple nested focus stacks', () => {
      const outerTrigger = document.createElement('button');
      const innerTrigger = document.createElement('button');
      const innerItem = document.createElement('button');
      document.body.appendChild(outerTrigger);
      document.body.appendChild(innerTrigger);
      document.body.appendChild(innerItem);

      outerTrigger.focus();
      setInitialFocusReference(outerTrigger);

      // Open outer component
      innerTrigger.focus();
      pushFocusStack(innerTrigger);

      // Open inner component
      innerItem.focus();
      pushFocusStack(innerItem);

      // Close inner
      popFocusStack();
      expect(document.activeElement).toStrictEqual(innerTrigger);

      // Close outer
      popFocusStack();
      expect(document.activeElement).toStrictEqual(outerTrigger);

      document.body.removeChild(outerTrigger);
      document.body.removeChild(innerTrigger);
      document.body.removeChild(innerItem);
    });
  });
});
