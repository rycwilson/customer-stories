
const { environment } = require('@rails/webpacker');
const webpack = require('webpack');
const erb = require('./loaders/erb');

// jquery
environment.plugins.append(
  'Provide', 
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery'
  })
);

// TODO where did this come from? 
environment.loaders.prepend('erb', erb);

module.exports = environment
