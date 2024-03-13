module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'always',
  printWidth: 80,
  plugins: [
    'prettier-plugin-packagejson',
    '@ianvs/prettier-plugin-sort-imports',
  ],
  importOrder: [
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',
    '^@(/.*)$',
    '^@test(/.*)$',
    '^@bench(/.*)$',
    '^[.]',
  ],
  importOrderTypeScriptVersion: '5.4.2',
}
