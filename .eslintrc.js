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
  },
  rules: {
    'prettier/prettier': 'error',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns': 'off',
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
