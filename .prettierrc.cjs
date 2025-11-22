module.exports = {
  arrowParens: "always",
  bracketSameLine: true,
  bracketSpacing: true,
  embeddedLanguageFormatting: "auto",
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "css",
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: "preserve",
  quoteProps: "as-needed",
  semi: true,
  singleAttributePerLine: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
  overrides: [
    {
      files: "!**/*.md",
      options: {
        plugins: [
          "@ianvs/prettier-plugin-sort-imports",
          "prettier-plugin-packagejson",
        ],
        importOrder: [
          "<BUILTIN_MODULES>",
          "<THIRD_PARTY_MODULES>",
          "^@(/.*)$",
          "^@test(/.*)$",
          "^@bench(/.*)$",
          "^[.]",
        ],
        importOrderTypeScriptVersion: "5.9.3",
      },
    },
  ],
};
