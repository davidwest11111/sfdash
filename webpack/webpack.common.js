const Path = require('path');
const Webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


const OUTPUT_PATH = Path.resolve(__dirname, '../', 'build');
const CONTEXT = Path.resolve(__dirname, '../', 'src');
const IMAGES_PATH = Path.resolve(CONTEXT, 'images/**/*');
const JS_PATH = Path.resolve(CONTEXT, 'js');

module.exports = {
  context: CONTEXT,
  entry: {
    app: './index.jsx',
  },
  output: {
    path: OUTPUT_PATH,
    filename: 'js/[name].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new Webpack.ProvidePlugin({
      $: 'jquery', // required for angular
      jquery: 'jquery',
      'window.jQuery': 'jquery',
      jQuery: 'jquery',
    }),
    new CopyPlugin([
      { from: IMAGES_PATH },
    ]),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      'node_modules',
      JS_PATH,
    ],
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|txt|ttf|woff|woff2)(\?.*)?$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
      },
      {
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src'],
          },
        },
      },
    ],
  },
};
