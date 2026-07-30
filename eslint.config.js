import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  js.configs.recommended,

  // TypeScript
  ...tseslint.configs.recommended,

  // JSX a11y
  {
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'jsx-a11y/no-autofocus': 'off',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'surge/**',
      'stories/**',
      '.storybook/**',
    ],
  },
];
