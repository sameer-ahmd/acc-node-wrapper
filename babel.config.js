/* eslint-disable */
// ts-ignore

module.exports = {
  parserOpts: { strictMode: true },
  sourceMaps: "inline",
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "commonjs",
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    "babel-plugin-const-enum",
    [
      "module-resolver",
      {
        alias: {
          "@": "./src",
        },
      },
    ],
  ],
};
