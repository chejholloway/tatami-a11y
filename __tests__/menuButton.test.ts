import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MenuButton } from '../src/components/menuButton.js';

describe('MenuButton', () => {
  let trigger: HTMLElement;
  let menu: HTMLElement;
  let menuButtonInstance: MenuButton;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.textContent = 'Menu';
    
    menu = document.createElement('div');
    menu.id = 'menu';
    menu.innerHTML = `
      <button role="menuitem">Option 1</button>
      <button role="menuitem">Option 2</button>
      <button role="menuitem">Option 3</button>
    `;
    
    document.body.appendChild(trigger);
    document.body.appendChild(menu);

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
    if (menuButtonInstance) {
      menuButtonInstance.destroy();
    }
    trigger.remove();
    menu.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes on trigger', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });

      expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set up ARIA attributes on menu', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });

      expect(menu.getAttribute('role')).toBe('menu');
      expect(menu.getAttribute('aria-hidden')).toBe('true');
    });

    it('should initially hide menu', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });

      expect(menu.style.display).toBe('none');
    });
  });

  describe('open', () => {
    it('should open menu and set ARIA attributes', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(menu.getAttribute('aria-hidden')).toBe('false');
      expect(menu.style.display).toBe('block');
    });

    it('should focus first menu item', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();

      const firstItem = menu.querySelector('[role="menuitem"]') as HTMLElement;
      expect(document.activeElement).toBe(firstItem);
    });

    it('should call onOpen callback', () => {
      const onOpen = vi.fn();
      menuButtonInstance = new MenuButton({ trigger, menu, onOpen });
      menuButtonInstance.open();

      expect(onOpen).toHaveBeenCalled();
    });

    it('should not open if already open', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      menuButtonInstance.open();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('close', () => {
    it('should close menu and set ARIA attributes', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      menuButtonInstance.close();

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(menu.getAttribute('aria-hidden')).toBe('true');
      expect(menu.style.display).toBe('none');
    });

    it('should call onClose callback', () => {
      const onClose = vi.fn();
      menuButtonInstance = new MenuButton({ trigger, menu, onClose });
      menuButtonInstance.open();
      menuButtonInstance.close();

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close if already closed', () => {
      const onClose = vi.fn();
      menuButtonInstance = new MenuButton({ trigger, menu, onClose });
      menuButtonInstance.close();

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('should open menu when closed', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      trigger.click();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close menu when open', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      trigger.click();

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('keyboard navigation', () => {
    it('should toggle on Enter key', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      trigger.dispatchEvent(enterEvent);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should toggle on Space key', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      trigger.dispatchEvent(spaceEvent);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should open and focus first item on ArrowDown', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      trigger.dispatchEvent(arrowDownEvent);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const firstItem = menu.querySelector('[role="menuitem"]') as HTMLElement;
      expect(document.activeElement).toBe(firstItem);
    });

    it('should open and focus last item on ArrowUp', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      trigger.dispatchEvent(arrowUpEvent);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const items = menu.querySelectorAll('[role="menuitem"]');
      const lastItem = items[items.length - 1] as HTMLElement;
      expect(document.activeElement).toBe(lastItem);
    });

    it('should close on Escape key', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      menu.dispatchEvent(escapeEvent);

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
    });

    it('should move focus down on ArrowDown in menu', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const items = menu.querySelectorAll('[role="menuitem"]');
      const firstItem = items[0] as HTMLElement;
      const secondItem = items[1] as HTMLElement;
      
      firstItem.focus();
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      menu.dispatchEvent(arrowDownEvent);

      expect(document.activeElement).toBe(secondItem);
    });

    it('should move focus up on ArrowUp in menu', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const items = menu.querySelectorAll('[role="menuitem"]');
      const secondItem = items[1] as HTMLElement;
      const firstItem = items[0] as HTMLElement;
      
      secondItem.focus();
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      menu.dispatchEvent(arrowUpEvent);

      expect(document.activeElement).toBe(firstItem);
    });

    it('should focus first item on Home', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const items = menu.querySelectorAll('[role="menuitem"]');
      const lastItem = items[items.length - 1] as HTMLElement;
      const firstItem = items[0] as HTMLElement;
      
      lastItem.focus();
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      menu.dispatchEvent(homeEvent);

      expect(document.activeElement).toBe(firstItem);
    });

    it('should focus last item on End', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const items = menu.querySelectorAll('[role="menuitem"]');
      const firstItem = items[0] as HTMLElement;
      const lastItem = items[items.length - 1] as HTMLElement;
      
      firstItem.focus();
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      menu.dispatchEvent(endEvent);

      expect(document.activeElement).toBe(lastItem);
    });

    it('should select item on Enter', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const firstItem = menu.querySelector('[role="menuitem"]') as HTMLElement;
      const clickSpy = vi.spyOn(firstItem, 'click');
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      menu.dispatchEvent(enterEvent);

      expect(clickSpy).toHaveBeenCalled();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should select item on Space', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const firstItem = menu.querySelector('[role="menuitem"]') as HTMLElement;
      const clickSpy = vi.spyOn(firstItem, 'click');
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      menu.dispatchEvent(spaceEvent);

      expect(clickSpy).toHaveBeenCalled();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('click interaction', () => {
    it('should toggle menu on trigger click', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      trigger.click();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close menu when clicking outside', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();
      outsideElement.remove();

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.destroy();
      
      trigger.click();

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close menu if open', () => {
      menuButtonInstance = new MenuButton({ trigger, menu });
      menuButtonInstance.open();
      menuButtonInstance.destroy();

      expect(menu.style.display).toBe('none');
    });
  });
});
