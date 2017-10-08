module.exports = {
  "env": {
    "browser": true
  },
  "globals": {
    "define": false,
    "require": false,
    "Papa": false
  },
  "rules": {
    "no-debugger": "error",
    "no-bitwise": "error",
    "curly": "error",
    "eqeqeq": "error",
    "guard-for-in": "error",
    "block-scoped-var": "off",
    "no-use-before-define": "warn",
    "max-params": "off",
    "no-caller": "error",
    "no-new": "error",
    "no-shadow": "error",
    "strict": "off",
    "no-undef": "error",
    "no-unused-vars": "error",
    "no-eval": "off",
    "indent": ["error", 2, {
      "SwitchCase": 1
    }],
    "quotes": ["error", "single"]
  }
};
