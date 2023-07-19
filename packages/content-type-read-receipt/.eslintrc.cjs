module.exports = {
  root: true,
  extends: ["custom"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  rules: {
    "class-methods-use-this": "off",
  },
};
