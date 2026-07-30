import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Tabs',
  render: () => `
    <div role="tablist" id="tabs-demo" class="tablist-demo">
      <button role="tab" id="tab-1" aria-controls="panel-1" aria-selected="true" tabindex="0" class="tab-demo">Tab 1</button>
      <button role="tab" id="tab-2" aria-controls="panel-2" aria-selected="false" tabindex="-1" class="tab-demo">Tab 2</button>
      <button role="tab" id="tab-3" aria-controls="panel-3" aria-selected="false" tabindex="-1" class="tab-demo">Tab 3</button>
    </div>
    <div id="panel-1" role="tabpanel" aria-labelledby="tab-1" class="tabpanel-demo">
      <p>Content for Tab 1. Use arrow keys to navigate between tabs.</p>
    </div>
    <div id="panel-2" role="tabpanel" aria-labelledby="tab-2" hidden class="tabpanel-demo">
      <p>Content for Tab 2.</p>
    </div>
    <div id="panel-3" role="tabpanel" aria-labelledby="tab-3" hidden class="tabpanel-demo">
      <p>Content for Tab 3.</p>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Tabs = module.Tabs;
    
    const tabList = canvasElement.querySelector('#tabs-demo') as HTMLElement;
    if (tabList && Tabs) {
      new Tabs({
        tabList,
      });
    }
  },
};
