
// ref: https://codepen.io/patrickkahl/pen/DxmfG
// ref: http://stackoverflow.com/questions/4068373
// ref: http://stackoverflow.com/questions/24046807
function initSocialShare() {

  $('#social-buttons .linkedin').on('click', function (e) {
    $(this).socialSharePopup(e, 550, 544);
  });
  $('#social-buttons .twitter').on('click', function (e) {
    $(this).socialSharePopup(e, 500, 260);
  });
  $('#social-buttons .facebook').on('click', function (e) {
    $(this).socialSharePopup(e, 600, 424);
  });

  $.fn.socialSharePopup = function (e, width, height) {
    // Prevent default anchor event
    e.preventDefault();
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    // Set values for window
    width = width || '550';
    height = height || '442';

    var left = ((windowWidth / 2) - (width / 2)) + dualScreenLeft;
    var top = ((windowHeight / 2) - (height / 2)) + dualScreenTop;

    // Set title and open popup with focus on it
    var strTitle = ((typeof this.attr('title') !== 'undefined') ? this.attr('title') : 'Social Share'),
        strParam = 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',resizable=no',
        objWindow = window.open(this.attr('href'), 'shareWindow', strParam).focus();
  };
}