var path = require('path');
var webpack = require('webpack');

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
  devtool: 'source-map',
};
