import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import unicorn from 'eslint-plugin-unicorn'

// Configurazione base condivisa per TypeScript
const baseTypeScriptConfig = {
	languageOptions: {
		parser: tsParser,
		parserOptions: { sourceType: 'module' },
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
		'no-restricted-syntax': [
			'error',
			{
				selector: 'ExportNamedDeclaration[declaration]',
				message:
					'Exports must be grouped in a single statement at the end of the file. Use: const foo = ...; export { foo };',
			},
			{
				selector: 'ExportDefaultDeclaration[declaration.type!="Identifier"]',
				message:
					'Export default must be at the end of the file. Declare the variable/function first, then export it.',
			},
		],
	},
}

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ ignores: ['dist/**', 'src/generated/prisma/**', 'coverage/**'] },
	js.configs.recommended,

	// Test files
	{
		files: ['tests/**/*.ts'],
		...baseTypeScriptConfig,
		languageOptions: {
			...baseTypeScriptConfig.languageOptions,
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
	},

	// Prisma files
	{
		files: ['prisma/**/*.ts'],
		...baseTypeScriptConfig,
		languageOptions: {
			...baseTypeScriptConfig.languageOptions,
			globals: {
				console: 'readonly',
				process: 'readonly',
			},
		},
	},

	// Source files (con type checking)
	{
		files: ['src/**/*.ts'],
		...baseTypeScriptConfig,
		languageOptions: {
			...baseTypeScriptConfig.languageOptions,
			parserOptions: {
				...baseTypeScriptConfig.languageOptions.parserOptions,
				project: './tsconfig.json',
			},
		},
		rules: {
			...baseTypeScriptConfig.rules,
			'@typescript-eslint/consistent-type-exports': 'warn',
			'no-useless-escape': 'error',
		},
	},
]
