// eslint-disable-next-line spaced-comment
// @ts-nocheck
/* eslint-disable import/no-extraneous-dependencies */
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("./webpack.config");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimizer: ["...", new CssMinimizerPlugin()],
  },
});
