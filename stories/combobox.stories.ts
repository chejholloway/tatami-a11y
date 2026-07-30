import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Combobox',
  render: () => `
    <input type="text" id="combobox-input" class="combobox-input combobox-input-demo"
      placeholder="Type to filter fruits…" autocomplete="off">
    <div id="combobox-listbox" class="combobox-listbox combobox-listbox-demo" style="display:none;">
      <div class="combobox-option combobox-option-demo" role="option" data-value="Apple">Apple</div>
      <div class="combobox-option combobox-option-demo" role="option" data-value="Banana">Banana</div>
      <div class="combobox-option combobox-option-demo" role="option" data-value="Cherry">Cherry</div>
      <div class="combobox-option combobox-option-demo" role="option" data-value="Date">Date</div>
      <div class="combobox-option combobox-option-demo" role="option" data-value="Elderberry">Elderberry</div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Combobox = module.Combobox;
    
    const input = canvasElement.querySelector('#combobox-input') as HTMLInputElement;
    const listbox = canvasElement.querySelector('#combobox-listbox') as HTMLElement;
    if (input && listbox && Combobox) {
      new Combobox({
        input,
        listbox,
      });
    }
  },
};
