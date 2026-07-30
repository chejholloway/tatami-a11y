import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|js|mdx)'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/html-vite',
  core: {
    disableTelemetry: true,
  },
};

export default config;
