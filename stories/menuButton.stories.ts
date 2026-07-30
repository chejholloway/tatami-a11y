import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'MenuButton',
  render: () => `
    <p>Click the button to open the menu. Uses <code>aria-haspopup="menu"</code>.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-primary" id="menu-button-trigger">Open Menu</button>
    </div>
    <div id="menu-button-menu" class="menu-button-menu menu-button-menu-demo" style="display:none;">
      <button class="menu-button-item menu-button-item-demo" role="menuitem">Option 1</button>
      <button class="menu-button-item menu-button-item-demo" role="menuitem">Option 2</button>
      <button class="menu-button-item menu-button-item-demo" role="menuitem">Option 3</button>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};
