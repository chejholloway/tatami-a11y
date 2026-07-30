import type { Meta, StoryObj } from '@storybook/html-vite';

const meta: Meta = {
  title: 'Tooltip',
  render: () => `
    <div class="tooltip-wrapper">
      <button class="btn-primary" id="tooltip-trigger">Hover or Focus Me</button>
      <div id="tooltip-content" class="tooltip-demo" style="display:none;" role="tooltip">
        This is helpful additional information!
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Tooltip = module.Tooltip;
    
    const trigger = canvasElement.querySelector('#tooltip-trigger') as HTMLButtonElement;
    const content = canvasElement.querySelector('#tooltip-content') as HTMLElement;
    if (trigger && content && Tooltip) {
      new Tooltip({
        trigger,
        tooltip: content,
      });
    }
  },
};
