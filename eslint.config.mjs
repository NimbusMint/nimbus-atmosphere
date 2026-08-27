import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * This package ships TypeScript source, not built output. Consumers wire it in
 * with `file:` + Next's `transpilePackages`, which means its `src/` sits inside
 * *their* lint runs — nimbus-fe's eslint covers this submodule, and its gates
 * run inside the deploy rather than pre-merge. A lint error introduced here
 * fails a downstream deploy, and until this config existed nothing here caught
 * one first: a ref written during render passed `tsc --noEmit` and still broke
 * nimbus-fe's rollout on `react-hooks/refs`.
 *
 * So the rule set approximates what eslint-config-next 16 enforces over this
 * code — react-hooks (the compiler rules, as errors), the React and jsx-a11y
 * recommendations, and typescript-eslint. It is deliberately no laxer than
 * nimbus-fe's run: nimbus-fe switches `react-hooks/purity` and
 * `react-hooks/set-state-in-effect` off for patterns in its own codebase, and
 * this package does not need that exemption, so both stay on here.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      react,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...react.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // The JSX transform is automatic; React is never imported as a value.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
);
