
module.exports = {
  "presets": [
    ["env", {
      "targets": {
        "browsers": ["last 2 Chrome versions"]
      }
    }]
  ],
  "plugins": [
    ["@babel/plugin-transform-runtime", {
      "corejs": 2
    }]
  ]
}
