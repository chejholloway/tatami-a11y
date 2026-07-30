/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'tatami-a11y',
  tagline: 'Framework-agnostic, accessibility-first UI primitives for vanilla JavaScript',
  url: 'https://tatami-a11y-demo.surge.sh',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.ico',
  organizationName: 'chejholloway',
  projectName: 'tatani-a11y',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/chejholloway/tatani-a11y/edit/main/',
          routeBasePath: '/',
          exclude: ['**/superpowers/**'],
        },
        theme: { customCss: require.resolve('./docs/custom.css') },
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
          href: 'https://github.com/chejholloway/tatani-a11y',
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
