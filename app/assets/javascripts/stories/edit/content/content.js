
//= require ./video
//= require ./results
//= require ./form_validator

function storiesEditContent () {

  loadVideoThumbnail();
  // storyFormValidator();

}

function storiesEditContentListeners () {

  storiesEditVideoListeners();
  storiesEditResultsListeners();

  var openFormControls = function () {
    $('#story-content-submit').addClass('show');
  };

  $(document)
    .on('shown.bs.collapse', '#contributions-carousel', function () {
      $('[href="#contributions-carousel"][data-toggle="collapse"] > span').toggle();
    })
    .on('hidden.bs.collapse', '#contributions-carousel', function () {
      $('[href="#contributions-carousel"][data-toggle="collapse"] > span').toggle();
    })

    // form changes
    .on('input', '#story-content-form', function () {})
    .on('click', '.add-result, .remove-result', function () {})

    .on('wheel', '.contribution-content, #story_summary', function (event) {
      var maxY = $(this).prop('scrollHeight') - $(this).prop('clientHeight');
      if (maxY > 0) {
        // If this event looks like it will scroll beyond the bounds of the element,
        //  prevent it and set the scroll to the boundary manually
        if ($(this).prop('scrollTop') + event.originalEvent.deltaY < 0 ||
            $(this).prop('scrollTop') + event.originalEvent.deltaY > maxY) {
          event.preventDefault();
          $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + event.originalEvent.deltaY)));
        }
      }
    })

    .on('input', '#story-content-form', openFormControls)
    .on('click', '#story-content-form .add-result, #story-content-form .remove-result', openFormControls)
    .on('scroll', function () {
      if (!$('a[href="#story-content"]').parent().hasClass('active')) {
        return false;
      }
      if ($(document).scrollTop() > (($('.main-content').offset().top + 200) - $(window).height())) {
        openFormControls();
      }
    });
}

function initStoriesEditContent () {

  $("[data-toggle='tooltip']").tooltip();
  initSummernote();
  loadVideoThumbnail();
  // storyFormValidator();

}

