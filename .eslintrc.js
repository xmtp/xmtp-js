module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'standard',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-prettier',
  ],
  parserOptions: {
    sourceType: 'module',
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    'prettier/prettier': 'error',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  ignorePatterns: ['dist', 'node_modules', 'examples', 'scripts', 'src/types'],
}
