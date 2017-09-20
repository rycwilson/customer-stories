
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
    });

}

function initStoriesEditContent () {
  initSummernote();
  loadVideoThumbnail();
}

