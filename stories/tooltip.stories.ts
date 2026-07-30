import type { Meta, StoryObj } from '@storybook/html';

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

export const Default: StoryObj = {};
