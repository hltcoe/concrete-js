module.exports = {
  env: {node: true, es6: true, browser: true, mocha: true},
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
  overrides: [
    {
      files: ['gen-nodejs/*'],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/triple-slash-reference": "off",
        "no-constant-condition": "off",
        "no-prototype-builtins": "off",
        "no-duplicate-case": "off",
      },
    },
  ],
};
