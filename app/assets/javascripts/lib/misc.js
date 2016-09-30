
/**
 * Get the value of a querystring
 * @param  {String} field The field to get the value of
 * @param  {String} url   The URL to get the value from (optional)
 * @return {String}       The field value
 */
function getQueryString (field, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
    var string = reg.exec(href);
    return string ? string[1] : null;
}

/*
  Since gettinng the image centered vertically with css is a pain,
  do it with jquery instead
*/
function centerLogos () {
  $('#stories-gallery img, .drawer-items img').each(function (image) {
    var height = $(this).outerHeight(),
        maxHeight = parseInt($(this).css('max-height')),
        diff = maxHeight - height;

    // prevent repeat executions of this code by checking 'data-modified' attribute
    if (diff && !$(this).data('modified')) {
      // if there is no caption for the thumbnail, there is already a
      // margin-top to compensate for this ...
      // factor this in ...
      var newMarginTop = (diff / 2) + parseInt($(this).css('margin-top'), 10);
      $(this).css('margin-top', newMarginTop);
      $(this).css('margin-bottom', diff / 2);
      $(this).data('modified', true);
    }
  });
}