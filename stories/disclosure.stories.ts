import type { Meta, StoryObj } from '@storybook/html-vite';

const meta: Meta = {
  title: 'Disclosure',
  render: () => `
    <button class="disclosure-trigger-demo" id="disclosure-trigger">Toggle Advanced Settings</button>
    <div id="disclosure-content" class="disclosure-content-demo" style="display:none;">
      <p style="margin-bottom:.5rem;">Here are some advanced settings you can configure.</p>
      <label><input type="checkbox"> Enable turbo mode</label>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Disclosure = module.Disclosure;
    
    const trigger = canvasElement.querySelector('#disclosure-trigger') as HTMLButtonElement;
    const content = canvasElement.querySelector('#disclosure-content') as HTMLElement;
    if (trigger && content && Disclosure) {
      new Disclosure({
        trigger,
        content,
      });
    }
  },
};
