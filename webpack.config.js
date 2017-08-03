var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

var PACKAGE = require(path.resolve(__dirname, 'package.json'));

const banner = "ChoosyGallery v" + PACKAGE.version +
  '\n\n' + fs.readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf8');

module.exports = {
  entry: path.resolve(__dirname, 'src/choosy-gallery.js'),
  output: {
    path: path.resolve(__dirname, 'build'),
    library: 'choosyGallery',
    libraryTarget: 'umd',
    filename: 'choosy-gallery.min.js'
  },
  module: {
    loaders: [
      {
        test: /.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
      new webpack.BannerPlugin(banner),
      new webpack.optimize.UglifyJsPlugin()
  ],
  devtool: 'source-map',
};
