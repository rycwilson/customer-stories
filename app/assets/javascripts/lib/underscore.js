
(function () {

  // this changes underscore to use {{ }} delimiters
  // (so doesn't clash with erb <% %>)
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g,
    escape:      /\{\{-(.+?)\}\}/g
  };
  // provide a .each_slice method for the template
  // this is for rendering the stories index
  Array.prototype.each_slice = function (size, callback) {
    for (var i = 0, l = this.length; i < l; i += size) {
      callback.call(this, this.slice(i, i + size));
    }
  };

}());

