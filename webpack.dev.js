// eslint-disable-next-line spaced-comment
// @ts-nocheck
/* eslint-disable import/no-extraneous-dependencies */
const { merge } = require("webpack-merge");
const common = require("./webpack.config");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
    port: 8080,
    open: true,
  },
});
