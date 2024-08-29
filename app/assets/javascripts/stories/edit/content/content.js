//= require ./video
//= require ./form_validator

function storiesEditContent () {
  loadVideoThumbnail();
  // storyFormValidator();
}

function storiesEditContentListeners () {
  storiesEditVideoListeners();

  var openFormControls = function () {
    $('.submission-footer--story').addClass('show');
  };
   
  $(document)

    // get and show contributions
    // setting X-Requested-With allows the js request without an InvalidCrossOriginRequest error  
    // https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection.html
    // see bottom answer: https://stackoverflow.com/questions/29310187/rails-invalidcrossoriginrequest
    .on('change', '#show-contributions', (e) => (
      e.currentTarget
        .querySelectorAll('.questions, .contributors')
          .forEach(wrapper => wrapper.classList.toggle('hidden'))
    ))
    .on('show.bs.collapse', '#show-contributions', (e) => {
      if (!e.currentTarget.dataset.didLoad) {
        fetch(`${location.pathname}?` + new URLSearchParams({ contributions: true }), {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }).then(res => res.text())
          .then(text => eval(text))
          .catch(error => console.error(error))
          .finally(() => {
            // btn.classList.remove('loading', 'still-loading');
          });
      }
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
      if ($(document).scrollTop() > (($('.narrative').offset().top + 200) - $(window).height())) {
        openFormControls();
      }
    })
}

function initStoriesEditContent () {
  $("[data-toggle='tooltip']").tooltip();
  loadVideoThumbnail();
  // storyFormValidator();
}