module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        targets: {
          browsers: ['>0.25%', 'not dead'],
        },
      },
    ],
  ],
};
