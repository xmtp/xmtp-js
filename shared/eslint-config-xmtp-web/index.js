module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb",
    "airbnb/hooks",
    "airbnb-typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  ignorePatterns: ["lib/**/*", "dist/**/*"],
  plugins: ["react"],
  rules: {
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    "import/extensions": "off",
    "jsx-a11y/label-has-associated-control": [
      "error",
      {
        assert: "either",
      },
    ],
    "no-nested-ternary": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "variable",
        modifiers: ["destructured"],
        format: null,
      },
    ],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/unbound-method": [
      "error",
      {
        ignoreStatic: true,
      },
    ],
    "import/prefer-default-export": "off",
    "import/extensions": "off",
    "react/no-array-index-key": "warn",
    "react/require-default-props": "off",
    "react/prop-types": "off",
    "react/jsx-props-no-spreading": "off",
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "no-console": ["error", { allow: ["error"] }],
    "no-void": ["error", { allowAsStatement: true }],
    "no-restricted-syntax": [
      "error",
      {
        selector: "ForInStatement",
        message:
          "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
      },
      {
        selector: "WithStatement",
        message:
          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
    ],
  },
  overrides: [
    // allow devDependencies in configuration files
    {
      files: ["*.ts", "*.js", "*.cjs", "**/*.test.tsx", "**/*.test.ts"],
      rules: {
        "import/no-extraneous-dependencies": [
          "error",
          {
            devDependencies: true,
            optionalDependencies: false,
            peerDependencies: false,
          },
        ],
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    // allow require in .cjs files
    {
      files: ["*.cjs"],
      rules: {
        "global-require": "off",
      },
    },
  ],
};
