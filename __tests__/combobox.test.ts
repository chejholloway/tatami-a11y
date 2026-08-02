import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Combobox } from '../src/components/combobox.js';

describe('Combobox', () => {
  let input: HTMLInputElement;
  let listbox: HTMLElement;
  let comboboxInstance: Combobox;

  beforeEach(() => {
    input = document.createElement('input');
    input.type = 'text';
    input.id = 'combobox-input';
    
    listbox = document.createElement('div');
    listbox.id = 'combobox-listbox';
    listbox.innerHTML = `
      <div role="option" id="option-1" data-value="Apple">Apple</div>
      <div role="option" id="option-2" data-value="Banana">Banana</div>
      <div role="option" id="option-3" data-value="Cherry">Cherry</div>
      <div role="option" id="option-4" data-value="Date">Date</div>
      <div role="option" id="option-5" data-value="Elderberry">Elderberry</div>
    `;
    
    document.body.appendChild(input);
    document.body.appendChild(listbox);

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
    if (comboboxInstance) {
      comboboxInstance.destroy();
    }
    input.remove();
    listbox.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes on input', () => {
      comboboxInstance = new Combobox({ input, listbox });

      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.getAttribute('aria-controls')).toBe('combobox-listbox');
    });

    it('should set up ARIA attributes on listbox', () => {
      comboboxInstance = new Combobox({ input, listbox });

      expect(listbox.getAttribute('role')).toBe('listbox');
      expect(listbox.getAttribute('aria-hidden')).toBe('true');
    });

    it('should set up ARIA attributes on options', () => {
      comboboxInstance = new Combobox({ input, listbox });

      const options = listbox.querySelectorAll('[role="option"]');
      options.forEach((option) => {
        expect(option.getAttribute('aria-selected')).toBe('false');
      });
    });

    it('should initially hide listbox', () => {
      comboboxInstance = new Combobox({ input, listbox });

      expect(listbox.style.display).toBe('none');
    });
  });

  describe('filtering', () => {
    it('should filter options based on input', () => {
      comboboxInstance = new Combobox({ input, listbox });
      input.value = 'a';
      input.dispatchEvent(new Event('input'));

      const options = listbox.querySelectorAll('[role="option"]');
      const visibleOptions = Array.from(options).filter((opt) => !(opt as HTMLElement).hidden);
      
      expect(visibleOptions.length).toBeGreaterThan(0);
      expect(visibleOptions[0].textContent).toMatch(/a/i);
    });

    it('should hide non-matching options', () => {
      comboboxInstance = new Combobox({ input, listbox });
      input.value = 'xyz';
      input.dispatchEvent(new Event('input'));

      const options = listbox.querySelectorAll('[role="option"]');
      const visibleOptions = Array.from(options).filter((opt) => !(opt as HTMLElement).hidden);
      
      expect(visibleOptions.length).toBe(0);
    });

    it('should use custom filter function', () => {
      const customFilter = (item: string, query: string) => item.toLowerCase().startsWith(query.toLowerCase());
      comboboxInstance = new Combobox({ input, listbox, filter: customFilter });
      input.value = 'a';
      input.dispatchEvent(new Event('input'));

      const options = listbox.querySelectorAll('[role="option"]');
      const visibleOptions = Array.from(options).filter((opt) => !(opt as HTMLElement).hidden);
      
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].textContent).toBe('Apple');
    });
  });

  describe('open', () => {
    it('should open listbox and set ARIA attributes', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();

      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(listbox.getAttribute('aria-hidden')).toBe('false');
      expect(listbox.style.display).toBe('block');
    });

    it('should set first visible option as active', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();

      const options = listbox.querySelectorAll('[role="option"]');
      const firstOption = options[0] as HTMLElement;
      
      expect(firstOption.getAttribute('aria-selected')).toBe('true');
    });

    it('should not open if already open', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      comboboxInstance.open();

      expect(input.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('close', () => {
    it('should close listbox and set ARIA attributes', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      comboboxInstance.close();

      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(listbox.getAttribute('aria-hidden')).toBe('true');
      expect(listbox.style.display).toBe('none');
    });

    it('should clear active descendant', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      comboboxInstance.close();

      expect(input.getAttribute('aria-activedescendant')).toBe('');
    });

    it('should not close if already closed', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.close();

      expect(listbox.style.display).toBe('none');
    });
  });

  describe('keyboard navigation', () => {
    it('should open on ArrowDown when closed', () => {
      comboboxInstance = new Combobox({ input, listbox });
      
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(arrowDownEvent);

      expect(input.getAttribute('aria-expanded')).toBe('true');
    });

    it('should move focus down on ArrowDown when open', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(arrowDownEvent);

      const options = listbox.querySelectorAll('[role="option"]');
      expect(options[1].getAttribute('aria-selected')).toBe('true');
    });

    it('should move focus up on ArrowUp', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(arrowDownEvent);
      
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      input.dispatchEvent(arrowUpEvent);

      const options = listbox.querySelectorAll('[role="option"]');
      expect(options[0].getAttribute('aria-selected')).toBe('true');
    });

    it('should wrap to last option on ArrowUp from first', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      input.dispatchEvent(arrowUpEvent);

      const options = listbox.querySelectorAll('[role="option"]');
      expect(options[options.length - 1].getAttribute('aria-selected')).toBe('true');
    });

    it('should wrap to first option on ArrowDown from last', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      for (let i = 0; i < 5; i++) {
        const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        listbox.dispatchEvent(arrowDownEvent);
      }

      const options = listbox.querySelectorAll('[role="option"]');
      expect(options[0].getAttribute('aria-selected')).toBe('true');
    });

    it('should select option on Enter', () => {
      const onSelect = vi.fn();
      comboboxInstance = new Combobox({ input, listbox, onSelect });
      comboboxInstance.open();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(onSelect).toHaveBeenCalled();
      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close on Escape', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close on Tab', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      input.dispatchEvent(tabEvent);

      expect(input.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('selection', () => {
    it('should update input value on selection', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.selectOption(0);

      expect(input.value).toBe('Apple');
    });

    it('should call onSelect callback', () => {
      const onSelect = vi.fn();
      comboboxInstance = new Combobox({ input, listbox, onSelect });
      comboboxInstance.selectOption(0);

      expect(onSelect).toHaveBeenCalledWith('Apple', 0);
    });

    it('should close listbox on selection', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      comboboxInstance.selectOption(0);

      expect(listbox.style.display).toBe('none');
    });
  });

  describe('click interaction', () => {
    it('should select option on click', () => {
      const onSelect = vi.fn();
      comboboxInstance = new Combobox({ input, listbox, onSelect });
      
      const firstOption = listbox.querySelector('[role="option"]') as HTMLElement;
      firstOption.click();

      expect(input.value).toBe('Apple');
      expect(onSelect).toHaveBeenCalled();
    });

    it('should close when clicking outside', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();
      outsideElement.remove();

      expect(input.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.destroy();
      
      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      expect(listbox.style.display).toBe('none');
    });

    it('should close listbox if open', () => {
      comboboxInstance = new Combobox({ input, listbox });
      comboboxInstance.open();
      comboboxInstance.destroy();

      expect(listbox.style.display).toBe('none');
    });
  });
});
