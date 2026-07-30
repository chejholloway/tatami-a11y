import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Dropdown',
  render: () => `
    <p>Click the button to open the dropdown menu. Use Arrow keys to navigate, Enter to select, Escape to close.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-primary" id="dropdown-trigger">Open Menu</button>
    </div>
    <div id="dropdown-menu" class="dropdown-menu dropdown-menu-demo">
      <button class="dropdown-item dropdown-item-demo" role="menuitem">Option 1</button>
      <button class="dropdown-item dropdown-item-demo" role="menuitem">Option 2</button>
      <button class="dropdown-item dropdown-item-demo" role="menuitem">Option 3</button>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Dropdown = module.Dropdown;
    
    const trigger = canvasElement.querySelector('#dropdown-trigger') as HTMLButtonElement;
    const menu = canvasElement.querySelector('#dropdown-menu') as HTMLElement;
    if (trigger && menu && Dropdown) {
      new Dropdown({
        trigger,
        menu,
      });
    }
  },
};
