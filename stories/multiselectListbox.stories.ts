import type { Meta, StoryObj } from '@storybook/html';

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
    <div id="msl-listbox" class="msl-listbox">
      <div>🍎 Apples</div>
      <div>🍌 Bananas</div>
      <div>🍒 Cherries</div>
      <div>🍇 Grapes</div>
      <div>🥝 Kiwis</div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};
