import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Accordion } from '../src/components/accordion.js';

describe('Accordion', () => {
  let container: HTMLElement;
  let accordionInstance: Accordion;

  beforeEach(() => {
    // Create accordion container with headers and panels
    container = document.createElement('div');
    container.innerHTML = `
      <button id="header-1" role="button" aria-controls="panel-1">Panel 1</button>
      <div id="panel-1">Content 1</div>
      <button id="header-2" role="button" aria-controls="panel-2">Panel 2</button>
      <div id="panel-2">Content 2</div>
      <button id="header-3" role="button" aria-controls="panel-3">Panel 3</button>
      <div id="panel-3">Content 3</div>
    `;
    document.body.appendChild(container);

    // Mock requestAnimationFrame for reduced motion tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    // Mock setTimeout for animation tests
    vi.spyOn(window, 'setTimeout').mockImplementation((cb: (...args: any[]) => void, _delay?: number) => {
      cb();
      return 0 as any;
    });
  });

  afterEach(() => {
    if (accordionInstance) {
      accordionInstance.destroy();
    }
    container.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes on container', () => {
      accordionInstance = new Accordion({ container });

      expect(container.getAttribute('role')).toBe('region');
    });

    it('should set up ARIA attributes on headers', () => {
      accordionInstance = new Accordion({ container });

      const headers = container.querySelectorAll('button[aria-controls]');
      headers.forEach((header) => {
        expect(header.getAttribute('role')).toBe('button');
        expect(header.getAttribute('aria-expanded')).toBe('false');
        expect(header.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should set up ARIA attributes on panels', () => {
      accordionInstance = new Accordion({ container });

      const panels = container.querySelectorAll('[id^="panel-"]');
      panels.forEach((panel, index) => {
        expect((panel as HTMLElement).getAttribute('role')).toBe('region');
        expect((panel as HTMLElement).hidden).toBe(true);
      });
    });

    it('should default to single panel mode', () => {
      accordionInstance = new Accordion({ container });

      expect(accordionInstance).toBeDefined();
    });

    it('should support multiple panel mode', () => {
      accordionInstance = new Accordion({ container, allowMultiple: true });

      expect(accordionInstance).toBeDefined();
    });
  });

  describe('togglePanel', () => {
    it('should expand collapsed panel', () => {
      accordionInstance = new Accordion({ container });
      accordionInstance.togglePanel(0);

      const header = container.querySelector('#header-1');
      const panel = container.querySelector('#panel-1');

      expect(header?.getAttribute('aria-expanded')).toBe('true');
      expect((panel as HTMLElement)?.hidden).toBe(false);
    });

    it('should collapse expanded panel', () => {
      accordionInstance = new Accordion({ container });
      accordionInstance.togglePanel(0);
      accordionInstance.togglePanel(0);

      const header = container.querySelector('#header-1');
      const panel = container.querySelector('#panel-1');

      expect(header?.getAttribute('aria-expanded')).toBe('false');
      expect((panel as HTMLElement)?.hidden).toBe(true);
    });

    it('should call onToggle callback', () => {
      const onToggle = vi.fn();
      accordionInstance = new Accordion({ container, onToggle });
      accordionInstance.togglePanel(0);

      expect(onToggle).toHaveBeenCalledWith(0, true);
    });
  });

  describe('expandPanel', () => {
    it('should expand panel', () => {
      accordionInstance = new Accordion({ container });
      accordionInstance.expandPanel(0);

      const header = container.querySelector('#header-1');
      const panel = container.querySelector('#panel-1');

      expect(header?.getAttribute('aria-expanded')).toBe('true');
      expect((panel as HTMLElement)?.hidden).toBe(false);
    });

    it('should not expand if already expanded', () => {
      const onToggle = vi.fn();
      accordionInstance = new Accordion({ container, onToggle });
      accordionInstance.expandPanel(0);

      accordionInstance.expandPanel(0);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should collapse other panels in single mode', () => {
      accordionInstance = new Accordion({ container, allowMultiple: false });
      accordionInstance.expandPanel(0);
      accordionInstance.expandPanel(1);

      const header1 = container.querySelector('#header-1');
      const panel1 = container.querySelector('#panel-1');
      const header2 = container.querySelector('#header-2');
      const panel2 = container.querySelector('#panel-2');

      expect(header1?.getAttribute('aria-expanded')).toBe('false');
      expect((panel1 as HTMLElement)?.hidden).toBe(true);
      expect(header2?.getAttribute('aria-expanded')).toBe('true');
      expect((panel2 as HTMLElement)?.hidden).toBe(false);
    });

    it('should not collapse other panels in multiple mode', () => {
      accordionInstance = new Accordion({ container, allowMultiple: true });
      accordionInstance.expandPanel(0);
      accordionInstance.expandPanel(1);

      const header1 = container.querySelector('#header-1');
      const panel1 = container.querySelector('#panel-1');
      const header2 = container.querySelector('#header-2');
      const panel2 = container.querySelector('#panel-2');

      expect(header1?.getAttribute('aria-expanded')).toBe('true');
      expect((panel1 as HTMLElement)?.hidden).toBe(false);
      expect(header2?.getAttribute('aria-expanded')).toBe('true');
      expect((panel2 as HTMLElement)?.hidden).toBe(false);
    });
  });

  describe('collapsePanel', () => {
    it('should collapse panel', () => {
      accordionInstance = new Accordion({ container });
      accordionInstance.expandPanel(0);
      accordionInstance.collapsePanel(0);

      const header = container.querySelector('#header-1');
      const panel = container.querySelector('#panel-1');

      expect(header?.getAttribute('aria-expanded')).toBe('false');
      expect((panel as HTMLElement)?.hidden).toBe(true);
    });

    it('should not collapse if already collapsed', () => {
      const onToggle = vi.fn();
      accordionInstance = new Accordion({ container, onToggle });

      accordionInstance.collapsePanel(0);

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should toggle panel on Enter key', () => {
      accordionInstance = new Accordion({ container });
      const header = container.querySelector('#header-1') as HTMLElement;

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      header.dispatchEvent(enterEvent);

      expect(header.getAttribute('aria-expanded')).toBe('true');
    });

    it('should toggle panel on Space key', () => {
      accordionInstance = new Accordion({ container });
      const header = container.querySelector('#header-1') as HTMLElement;

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      header.dispatchEvent(spaceEvent);

      expect(header.getAttribute('aria-expanded')).toBe('true');
    });

    it('should move to next panel on ArrowDown', () => {
      accordionInstance = new Accordion({ container });
      const header1 = container.querySelector('#header-1') as HTMLElement;
      const header2 = container.querySelector('#header-2') as HTMLElement;

      header1.focus();
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      header1.dispatchEvent(arrowDownEvent);

      expect(document.activeElement).toBe(header2);
    });

    it('should move to previous panel on ArrowUp', () => {
      accordionInstance = new Accordion({ container });
      const header2 = container.querySelector('#header-2') as HTMLElement;
      const header3 = container.querySelector('#header-3') as HTMLElement;

      header3.focus();
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      header3.dispatchEvent(arrowUpEvent);

      expect(document.activeElement).toBe(header2);
    });

    it('should move to first panel on Home', () => {
      accordionInstance = new Accordion({ container });
      const header3 = container.querySelector('#header-3') as HTMLElement;
      const header1 = container.querySelector('#header-1') as HTMLElement;

      header3.focus();
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      header3.dispatchEvent(homeEvent);

      expect(document.activeElement).toBe(header1);
    });

    it('should move to last panel on End', () => {
      accordionInstance = new Accordion({ container });
      const header1 = container.querySelector('#header-1') as HTMLElement;
      const header3 = container.querySelector('#header-3') as HTMLElement;

      header1.focus();
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      header1.dispatchEvent(endEvent);

      expect(document.activeElement).toBe(header3);
    });
  });

  describe('click interaction', () => {
    it('should toggle panel on click', () => {
      accordionInstance = new Accordion({ container });
      const header = container.querySelector('#header-1') as HTMLElement;

      header.click();

      expect(header.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      accordionInstance = new Accordion({ container });
      accordionInstance.destroy();

      const header = container.querySelector('#header-1') as HTMLElement;
      header.click();

      expect(header.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
