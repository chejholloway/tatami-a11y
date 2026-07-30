import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'TreeView',
  render: () => `
    <p>Accessible tree view with expand/collapse, keyboard navigation, and typeahead.</p>
    <div class="controls" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
      <button class="btn-secondary" id="treeview-single-btn">Single Select</button>
      <button class="btn-secondary" id="treeview-multi-btn">Multi Select</button>
    </div>
    <ul id="treeview-demo" class="treeview-demo">
      <li data-label="Documents" data-children="true">
        <span class="label">📄 Documents</span>
        <ul>
          <li data-label="Work" data-children="true">
            <span class="label">💼 Work</span>
            <ul>
              <li data-label="report.pdf"><span class="label">report.pdf</span></li>
              <li data-label="budget.xlsx"><span class="label">budget.xlsx</span></li>
            </ul>
          </li>
          <li data-label="Personal" data-children="true">
            <span class="label">🏠 Personal</span>
            <ul>
              <li data-label="resume.pdf"><span class="label">resume.pdf</span></li>
              <li data-label="notes.txt"><span class="label">notes.txt</span></li>
            </ul>
          </li>
        </ul>
      </li>
      <li data-label="Pictures" data-children="true">
        <span class="label">🖼️ Pictures</span>
        <ul>
          <li data-label="vacation" data-children="true">
            <span class="label">🌴 Vacation</span>
            <ul>
              <li data-label="beach.jpg"><span class="label">beach.jpg</span></li>
              <li data-label="sunset.jpg"><span class="label">sunset.jpg</span></li>
            </ul>
          </li>
          <li data-label="screenshot.png"><span class="label">screenshot.png</span></li>
        </ul>
      </li>
      <li data-label="Music"><span class="label">🎵 Music</span></li>
    </ul>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const TreeView = module.TreeView;
    
    const tree = canvasElement.querySelector('#treeview-demo') as HTMLElement;
    if (tree && TreeView) {
      new TreeView({
        tree,
        multiselect: true,
      });
    }
  },
};
