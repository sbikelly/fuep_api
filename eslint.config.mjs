/**
 * ESLint Flat Config (ESM) for the monorepo
 */
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
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
      // Keep hooks rules defined (so disable comments work), but off for now
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
