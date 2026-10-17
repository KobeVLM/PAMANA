import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui primitives and context modules intentionally co-export
      // helpers/cva variants alongside components.
      'react-refresh/only-export-components': 'off',
      // All in-app audio is short recorded voiceover for text already shown
      // on screen, so there is no captions track to attach.
      'jsx-a11y/media-has-caption': 'off',
      // React Compiler advisories: this app fetches data inside effects and
      // uses manual memoization intentionally; these are optimization hints,
      // not correctness errors.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
])
