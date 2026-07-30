import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Accordion',
  render: () => `
    <div id="accordion-demo">
      <button id="accordion-header-1" aria-controls="accordion-panel-1"
        class="accordion-header accordion-header-demo">Panel 1</button>
      <div id="accordion-panel-1" class="accordion-panel accordion-panel-demo" hidden>
        Content for panel 1. Use arrow keys to navigate between headers.
      </div>
      <button id="accordion-header-2" aria-controls="accordion-panel-2"
        class="accordion-header accordion-header-demo">Panel 2</button>
      <div id="accordion-panel-2" class="accordion-panel accordion-panel-demo" hidden>
        Content for panel 2.
      </div>
      <button id="accordion-header-3" aria-controls="accordion-panel-3"
        class="accordion-header accordion-header-demo">Panel 3</button>
      <div id="accordion-panel-3" class="accordion-panel accordion-panel-demo" hidden>
        Content for panel 3.
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    // Load the library dynamically
    const module = await import('../dist/index.mjs');
    const Accordion = module.Accordion;
    
    const accordionDemo = canvasElement.querySelector('#accordion-demo') as HTMLElement;
    if (accordionDemo && Accordion) {
      console.log('Initializing Accordion component');
      new Accordion({
        container: accordionDemo,
        allowMultiple: false,
      });
      console.log('Accordion initialized');
    } else {
      console.error('Failed to initialize Accordion:', { accordionDemo, Accordion });
    }
  },
};
