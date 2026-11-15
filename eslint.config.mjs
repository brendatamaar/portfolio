import tseslint from 'typescript-eslint'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

// Lints .js/.mjs and .ts. Astro and Svelte components are checked by
// `astro check` and `svelte-check` in their own packages.
export default tseslint.config(
  // Build output: linting it reports thousands of errors that are not ours
  {
    ignores: ['**/dist/**', '**/build/**', '**/.svelte-kit/**', '**/.astro/**'],
  },
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
)
