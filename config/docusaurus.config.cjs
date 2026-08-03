/** @type {import('@docusaurus/types').Config} */
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const DOCS_URL = process.env.DOCS_URL || 'https://tatami-a11y-docs.surge.sh';

module.exports = {
  title: 'tatami-a11y',
  tagline: 'Framework-agnostic, accessibility-first UI primitives for vanilla JavaScript',
  url: DOCS_URL,
  baseUrl: '/',
  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.svg',
  organizationName: 'chejholloway',
  projectName: 'tatami-a11y',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.ts'),
          editUrl: 'https://github.com/chejholloway/tatami-a11y/edit/main/',
          routeBasePath: '/',
          exclude: ['**/superpowers/**'],
        },
          theme: { customCss: require.resolve('../docs/custom.css') },
      },
    ],
  ],

  plugins: [],

  themeConfig: {
    navbar: {
      title: 'tatami-a11y',
      items: [
        { to: '/', label: 'Docs', position: 'left' },
        {
          href: 'https://github.com/chejholloway/tatami-a11y',
          label: 'GitHub',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} tatami-a11y. MIT License.`,
    },
  },
};
