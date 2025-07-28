import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import unicorn from 'eslint-plugin-unicorn'

/** @type {import('eslint').Linter.Config[]} */
export default [
    { ignores: ['dist/**', 'src/generated/prisma/**'] },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
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
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'prettier/prettier': [
                'warn',
                {
                    endOfLine: 'crlf',
                },
            ],
            'unicorn/filename-case': ['error', { case: 'kebabCase' }],
            'no-multiple-empty-lines': ['warn', { max: 1 }],
        },
    },
]
