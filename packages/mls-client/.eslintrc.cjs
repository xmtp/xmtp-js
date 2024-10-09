module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "standard",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "eslint-config-prettier",
  ],
  parserOptions: {
    sourceType: "module",
    warnOnUnsupportedTypeScriptVersion: false,
    project: "tsconfig.json",
  },
  rules: {
    "@typescript-eslint/consistent-type-exports": [
      "error",
      {
        fixMixedExportsWithInlineTypeSpecifier: false,
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
      },
    ],
    "prettier/prettier": "error",
    "no-restricted-syntax": [
      "error",
      {
        selector: "ImportDeclaration[source.value=/^\\.\\./]",
        message:
          "Relative parent imports are not allowed, use path aliases instead.",
      },
    ],
  },
  plugins: ["@typescript-eslint", "prettier"],
};
