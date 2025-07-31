import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import unicorn from 'eslint-plugin-unicorn'

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ ignores: ['dist/**', 'src/generated/prisma/**', 'coverage/**'] },
	js.configs.recommended,
	// Configurazione separata per file che non sono nel progetto TypeScript (deve essere prima)
	{
		files: ['tests/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				// Non specificare project per questi file
			},
			globals: {
				jest: 'readonly',
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier,
			unicorn,
		},
		rules: {
			'no-console': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'unicorn/filename-case': ['error', { case: 'kebabCase' }],
			'no-multiple-empty-lines': ['warn', { max: 1 }],
			'unicorn/no-empty-file': 'error',
		},
	},
	{
		files: ['prisma/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				// Non specificare project per questi file
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier,
			unicorn,
		},
		rules: {
			'no-console': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'unicorn/filename-case': ['error', { case: 'kebabCase' }],
			'no-multiple-empty-lines': ['warn', { max: 1 }],
			'unicorn/no-empty-file': 'error',
		},
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier,
			unicorn,
		},
		rules: {
			'no-console': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/consistent-type-exports': 'warn',
			'unicorn/filename-case': ['error', { case: 'kebabCase' }],
			'no-multiple-empty-lines': ['warn', { max: 1 }],
			'unicorn/no-empty-file': 'error',
			'no-useless-escape': 'error',
		},
	},
]
