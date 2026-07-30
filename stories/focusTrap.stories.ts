import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'FocusTrap',
  render: () => `
    <p>Traps focus within a container. Tab/Shift+Tab will cycle within the modal.</p>
    <div class="controls" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
      <button class="btn-primary" id="open-modal-btn">Open Modal</button>
    </div>
    <div id="modal" class="modal-overlay hidden">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Modal with Focus Trap</h2>
        <p>Focus trapping is active. Try pressing Tab and Shift+Tab.</p>
        <div class="controls">
          <button class="btn-primary" id="modal-close-btn">Close (Escape also works)</button>
        </div>
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};
