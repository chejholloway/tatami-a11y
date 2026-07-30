import type { Meta, StoryObj } from '@storybook/html-vite';

const meta: Meta = {
  title: 'MultiselectListbox',
  render: () => `
    <p>Accessible listbox with single/multi-select, keyboard navigation, Shift+Click range, and Ctrl+Click toggle.</p>
    <div class="controls" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
      <button class="btn-secondary" id="msl-single-btn">Single Select</button>
      <button class="btn-secondary" id="msl-multi-btn">Multi Select</button>
      <button class="btn-secondary" id="msl-select-all-btn">Select All</button>
      <button class="btn-secondary" id="msl-clear-btn">Clear</button>
    </div>
    <div id="msl-listbox" class="msl-listbox" role="listbox" aria-label="Select fruits">
      <div>🍎 Apples</div>
      <div>🍌 Bananas</div>
      <div>🍒 Cherries</div>
      <div>🍇 Grapes</div>
      <div>🥝 Kiwis</div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const MultiselectListbox = module.MultiselectListbox;
    
    const listbox = canvasElement.querySelector('#msl-listbox') as HTMLElement;
    const singleBtn = canvasElement.querySelector('#msl-single-btn') as HTMLButtonElement;
    const multiBtn = canvasElement.querySelector('#msl-multi-btn') as HTMLButtonElement;
    const selectAllBtn = canvasElement.querySelector('#msl-select-all-btn') as HTMLButtonElement;
    const clearBtn = canvasElement.querySelector('#msl-clear-btn') as HTMLButtonElement;
    
    if (listbox && MultiselectListbox) {
      let listboxInstance = new MultiselectListbox({
        listbox,
        multiselect: true,
      });
      
      // Handle mode switching
      if (singleBtn) {
        singleBtn.addEventListener('click', () => {
          listboxInstance.destroy();
          listboxInstance = new MultiselectListbox({ listbox, multiselect: false });
        });
      }
      
      if (multiBtn) {
        multiBtn.addEventListener('click', () => {
          listboxInstance.destroy();
          listboxInstance = new MultiselectListbox({ listbox, multiselect: true });
        });
      }
      
      // Select all and clear buttons only work in multiselect mode
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          const items = Array.from(listbox.children) as HTMLElement[];
          items.forEach((item, idx) => item.setAttribute('aria-selected', 'true'));
        });
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          const items = Array.from(listbox.children) as HTMLElement[];
          items.forEach((item) => item.setAttribute('aria-selected', 'false'));
        });
      }
    }
  },
};
