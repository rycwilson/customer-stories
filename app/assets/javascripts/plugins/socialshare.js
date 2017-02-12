
// ref: https://codepen.io/patrickkahl/pen/DxmfG
// ref: http://stackoverflow.com/questions/4068373
// ref: http://stackoverflow.com/questions/24046807
function initSocialShare() {

  $(document).on('click', '#social-buttons .linkedin-share', function (e) {
    $(this).socialSharePopup(e, 550, 544);
  });
  $(document).on(''#social-buttons .twitter-share').on('click', function (e) {
    $(this).socialSharePopup(e, 500, 260);
  });
  $('#social-buttons .facebook-share').on('click', function (e) {
    $(this).socialSharePopup(e, 600, 424);
  });


}