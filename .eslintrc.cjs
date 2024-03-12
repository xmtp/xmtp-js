module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'standard',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-prettier',
    'plugin:jsdoc/recommended',
  ],
  parserOptions: {
    sourceType: 'module',
    warnOnUnsupportedTypeScriptVersion: false,
    project: 'tsconfig.json',
  },
  rules: {
    '@typescript-eslint/consistent-type-exports': [
      'error',
      {
        fixMixedExportsWithInlineTypeSpecifier: false,
      },
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    'prettier/prettier': 'error',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns': 'off',
    // this is necessary to ensure that the crypto library is available
    // in node and the browser
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ImportDeclaration[source.value=/^(node:)?crypto$/]',
        message:
          'Do not import directly from `crypto`, use `src/crypto/crypto` instead.',
      },
    ],
  },
  plugins: ['@typescript-eslint', 'prettier', 'jsdoc'],
  ignorePatterns: [
    'dist',
    'node_modules',
    'examples',
    'scripts',
    'src/types',
    'docs',
    'tmp',
  ],
}
