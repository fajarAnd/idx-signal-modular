module.exports = {
    env: {
        node: true,
        es2021: true,
        mocha: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        'no-console': 'warn',
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': 'error',
        'curly': 'error',
        'brace-style': ['error', '1tbs'],
        'comma-dangle': ['error', 'never'],
        'indent': ['error', 2],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        'no-multiple-empty-lines': ['error', { 'max': 2 }]
    },
    globals: {
        'describe': 'readonly',
        'it': 'readonly',
        'before': 'readonly',
        'after': 'readonly',
        'beforeEach': 'readonly',
        'afterEach': 'readonly'
    }
};