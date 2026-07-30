import type { Meta, StoryObj } from '@storybook/html-vite';

const meta: Meta = {
  title: 'Modal',
  render: () => `
    <p>Click the button to open the modal. The modal includes a focus trap, backdrop, and Escape-to-close.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-primary" id="modal-component-trigger">Open Modal</button>
    </div>
    <div id="modal-component-backdrop" class="modal-overlay modal-overlay-demo hidden">
      <div id="modal-component" class="modal modal-component-demo" role="dialog" aria-modal="true"
        aria-labelledby="modal-component-title">
        <h2 id="modal-component-title">Modal Component</h2>
        <p>This Modal uses focus trap, focus restoration, and announcements.</p>
        <div class="controls">
          <button class="btn-primary" id="modal-component-close-btn">Close (Escape also works)</button>
        </div>
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Modal = module.Modal;
    
    const trigger = canvasElement.querySelector('#modal-component-trigger') as HTMLButtonElement;
    const modal = canvasElement.querySelector('#modal-component') as HTMLElement;
    const backdrop = canvasElement.querySelector('#modal-component-backdrop') as HTMLElement;
    const closeBtn = canvasElement.querySelector('#modal-component-close-btn') as HTMLButtonElement;
    
    if (trigger && modal && backdrop && closeBtn && Modal) {
      new Modal({
        trigger,
        modal,
        backdrop,
      });
    }
  },
};
