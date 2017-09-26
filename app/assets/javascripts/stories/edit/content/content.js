
//= require ./video
//= require ./results

function storiesEditContent () {

  loadVideoThumbnail();

}

function storiesEditContentListeners () {

  storiesEditVideoListeners();
  storiesEditResultsListeners();

  $(document)
    .on('submit', '#story-content-form', function (e) {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    })

    .on('wheel', '.carousel-caption-custom', function (event) {
      // console.log('scrollHeight: ', $(this).prop('scrollHeight'))
      // console.log('offsetHeight: ', $(this).prop('offsetHeight'))
      // console.log('scrollTop: ', $(this).prop('scrollTop'))
      var maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
      // If this event looks like it will scroll beyond the bounds of the element,
      //  prevent it and set the scroll to the boundary manually
      if ($(this).prop('scrollTop') + event.originalEvent.deltaY < 0 ||
          $(this).prop('scrollTop') + event.originalEvent.deltaY > maxY) {
        event.preventDefault();
        $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + event.originalEvent.deltaY)));
      }
    });

}

function initStoriesEditContent () {
  initSummernote();
  loadVideoThumbnail();
}

