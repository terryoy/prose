module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: '>0.25%, not dead',
        useBuiltIns: false,
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
  ],
};
