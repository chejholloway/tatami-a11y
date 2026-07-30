import { createRequire } from 'module';
import type { TestRunnerConfig } from '@storybook/test-runner';

const require = createRequire(import.meta.url);

const config: TestRunnerConfig = {
  async postVisit(page) {
    await page.addScriptTag({
      path: require.resolve('axe-core'),
    });

    const result = await page.evaluate(() => {
      const axe = (window as any).axe;
      return axe.run(document.querySelector('#storybook-root'), {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      });
    });

    const violations = result.violations.filter(
      (v: { id: string }) => v.id !== 'document-title' && v.id !== 'html-has-lang',
    );

    if (violations.length > 0) {
      const messages = violations.map((v: any) => {
        const nodes = v.nodes.map(
          (n: any) => `    ${n.html} (${(n.target || []).join(', ')})`,
        );
        return `  [${v.impact}] ${v.id}: ${v.help}
       Help: ${v.helpUrl}
       Nodes:\n${nodes.join('\n')}`;
      });
      throw new Error(`Accessibility violations:\n${messages.join('\n')}`);
    }
  },
};

export default config;
