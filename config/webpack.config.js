const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist/umd'),
    filename: 'index.js',
    library: 'xmtp',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts(x*)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'config/tsconfig.umd.json',
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
    alias: {
      // These two modules have some issues with their exports.
      // This paves over those issues
      // This issue seems related, although I get a different error: https://github.com/alanshaw/it-pipe/issues/12
      'it-pipe': path.resolve(
        __dirname,
        '../node_modules/it-pipe/dist/src/index.js'
      ),
      'it-length-prefixed': path.resolve(
        __dirname,
        '../node_modules/it-length-prefixed/dist/src/index.js'
      ),
    },
    fallback: {
      assert: false,
      crypto: false,
      stream: false,
      constants: false,
      fs: false,
      path: false,
      util: false,
    },
  },
}
