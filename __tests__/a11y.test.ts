import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

type AxeViolation = { id: string };
type AxeResultsLike = { violations: Array<unknown> };

function isAxeViolation(v: unknown): v is AxeViolation {
  return (
    typeof v === 'object' &&
    v !== null &&
    'id' in v &&
    typeof (v as { id?: unknown }).id === 'string'
  );
}

describe('Accessibility (axe-core)', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accessibility Test</title>
      </head>
      <body>
        <div id="test-root"></div>
      </body>
      </html>
    `);

    document = dom.window.document;

    // Make axe-core work with JSDOM
    // (global is typed as unknown / NodeJS.Global in many setups, so cast carefully)
    (global as unknown as { document: Document }).document = document;
    (global as unknown as { window?: { document: Document } }).window = { document };
  });

  afterEach(() => {
    dom.window.close();
  });

  const filterRelevantViolations = (results: AxeResultsLike) => {
    return results.violations
      .filter(isAxeViolation)
      .filter((v) => v.id !== 'document-title' && v.id !== 'html-has-lang');
  };

  describe('Dropdown component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <button id="dropdown-trigger" aria-haspopup="true" aria-expanded="false">Menu</button>
        <div id="dropdown-menu" role="menu" aria-hidden="true" style="display: none;">
          <button role="menuitem" tabindex="-1">Option 1</button>
          <button role="menuitem" tabindex="-1">Option 2</button>
          <button role="menuitem" tabindex="-1">Option 3</button>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Tabs component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <div role="tablist">
          <button role="tab" id="tab1" aria-selected="true" aria-controls="panel1" tabindex="0">Tab 1</button>
          <button role="tab" id="tab2" aria-selected="false" aria-controls="panel2" tabindex="-1">Tab 2</button>
        </div>
        <div id="panel1" role="tabpanel" aria-labelledby="tab1">Panel 1 content</div>
        <div id="panel2" role="tabpanel" aria-labelledby="tab2" hidden>Panel 2 content</div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Modal component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <button id="modal-trigger" aria-haspopup="dialog">Open Modal</button>
        <div id="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden>
          <h2 id="modal-title">Modal Title</h2>
          <p>Modal content</p>
          <button>Close</button>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Accordion component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <div>
          <button aria-expanded="false" aria-controls="panel1">Section 1</button>
          <div id="panel1" role="region" hidden>Panel 1 content</div>
          <button aria-expanded="false" aria-controls="panel2">Section 2</button>
          <div id="panel2" role="region" hidden>Panel 2 content</div>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('TreeView component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <div role="tree">
          <div role="treeitem" aria-level="1" aria-expanded="true" tabindex="0">Item 1</div>
          <div role="group">
            <div role="treeitem" aria-level="2" tabindex="-1">Item 1.1</div>
            <div role="treeitem" aria-level="2" tabindex="-1">Item 1.2</div>
          </div>
          <div role="treeitem" aria-level="1" aria-expanded="false" tabindex="-1">Item 2</div>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Listbox component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <div role="listbox" aria-multiselectable="false">
          <div role="option" aria-selected="true" tabindex="0">Option 1</div>
          <div role="option" aria-selected="false" tabindex="-1">Option 2</div>
          <div role="option" aria-selected="false" tabindex="-1">Option 3</div>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Combobox component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <input type="text" role="combobox" aria-autocomplete="list" aria-controls="listbox" aria-activedescendant="option1" />
        <ul role="listbox" id="listbox">
          <li role="option" id="option1" aria-selected="true">Option 1</li>
          <li role="option" id="option2" aria-selected="false">Option 2</li>
        </ul>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Carousel component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <div role="region" aria-roledescription="carousel" aria-label="Featured content">
          <div role="group" aria-roledescription="slide" aria-label="1 of 3">Slide 1</div>
          <div role="group" aria-roledescription="slide" aria-label="2 of 3" hidden>Slide 2</div>
          <div role="group" aria-roledescription="slide" aria-label="3 of 3" hidden>Slide 3</div>
          <button aria-label="Previous slide">Previous</button>
          <button aria-label="Next slide">Next</button>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Dialog component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <button aria-haspopup="dialog">Open Dialog</button>
        <div role="dialog" aria-modal="false" aria-labelledby="dialog-title" hidden>
          <h2 id="dialog-title">Dialog Title</h2>
          <p>Dialog content</p>
          <button>Close</button>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Toast notifications', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <div role="alert" aria-live="assertive" aria-atomic="true">
          <p>Notification message</p>
          <button aria-label="Dismiss">✕</button>
        </div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });

  describe('Tooltip component', () => {
    it('should have no axe violations when properly configured', async () => {
      const root = document.getElementById('test-root')!;
      root.innerHTML = `
        <button aria-describedby="tooltip-desc">Hover me</button>
        <div id="tooltip-desc" role="tooltip">Tooltip content</div>
      `;

      const results = (await axe.run(root)) as unknown as AxeResultsLike;
      const relevantViolations = filterRelevantViolations(results);

      expect(relevantViolations).toEqual([]);
    });
  });
});
