import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'ReorderableList',
  render: () => `
    <p>Use <kbd>Ctrl+ArrowUp</kbd>/<kbd>Ctrl+ArrowDown</kbd> to reorder items.</p>
    <div class="controls" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
      <button class="btn-secondary" id="reorder-reset-btn">Reset Order</button>
    </div>
    <ul id="reorderable-demo">
      <li><span class="label">🍎 Apples</span></li>
      <li><span class="label">🍌 Bananas</span></li>
      <li><span class="label">🍒 Cherries</span></li>
      <li><span class="label">🍇 Grapes</span></li>
      <li><span class="label">🍊 Oranges</span></li>
    </ul>
  `,
};

export default meta;

export const Default: StoryObj = {};
