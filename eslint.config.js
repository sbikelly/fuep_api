/**
 * ESLint Flat Config (CJS) for environments where ESM config isn't picked
 * If eslint.config.mjs is present, ESLint will prefer that. This file is kept
 * for compatibility and mirrors the same rules using CommonJS.
 */
/** @type {import('eslint').Linter.FlatConfig[]} */
const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.changeset/**',
      '**/.husky/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
      'react-hooks': reactHooks,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      // Keep hooks rules defined (so disable comments are recognized), but off
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
