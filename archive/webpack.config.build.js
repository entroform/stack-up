const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'stack-up/stack-up.ts'),
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'stack-up.js',
    library: 'stack-up',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          'ts-loader',
        ],
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
        ],
      },
    ],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'stack-up/'),
    },
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin()
      ],
    },
  ],
}