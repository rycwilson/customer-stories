
// ref: http://stackoverflow.com/questions/8737709
function popoverListeners () {
  var maxY = null;
  $(document).on('wheel', '.popover-content', function (event) {
    maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
    // If this event looks like it will scroll beyond the bounds of the element,
    // prevent it and set the scroll to the boundary manually
    if ($(this).prop('scrollTop') + event.originalEvent.deltaY < 0 ||
        $(this).prop('scrollTop') + event.originalEvent.deltaY > maxY) {
      event.preventDefault();
      $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + event.originalEvent.deltaY)));
    }
  });

  $(document).on('click', '.popover-title + button.close', function () {
    $(this).closest('.popover').popover('hide');
  });
}

// function buttonListeners () {
//   $(document).on('focus', 'button', function () {
//     var _this = $(this);
//     window.setTimeout(function () {
//       _this.blur();
//     }, 200);
//   });
// }
