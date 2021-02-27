module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'react/jsx-props-no-spreading': 'off',
    'react/static-property-placement': 'off',
    'react/destructuring-assignment': 'warn',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'no-unused-vars': 'warn',
  },
  ignorePatterns: [],
  overrides: [
    {
      files: [
        'src/**/*.jsx',
        'src/**/*.js',
      ],
    },
  ],
};
