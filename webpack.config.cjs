const path = require('path');
const EslintPlugin = require('eslint-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

let mode = 'development';
if (process.env.NODE_ENV === 'production') {
  mode = 'production';
}
console.log(mode + ' mode');

module.exports = {
  entry: path.resolve(__dirname, './src/index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    clean: process.env.NODE_ENV === 'production'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "http": false, "browser": false, "https": false,
      "stream": false, "url": false, "buffer": false, "timers": false,
      "async_hooks": false, "bufferutil": false, "utf-8-validate": false,
      "fs": false, "net": false, "tls": false,
    }
  },
  plugins: [
    new EslintPlugin({ extensions: 'ts' }),
    new NodePolyfillPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: 'ts-loader',
      },
    ],
  },
};
