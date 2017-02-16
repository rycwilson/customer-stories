
//= require ./index
//= require ./show
//= require ./edit

function attachStoriesListeners () {
  storiesIndexListeners();
  storiesEditListeners();
  storiesPlayVideoListener();

  $(document).on('click', '.cta-form',
    function () {
      $('#outbound-form-modal').modal('show');
    });

  // this does not play nicely with the linkedin widgets
  // if scroll while widgets are loading, somehow visibility gets set to
  // hidden, but the More Stories header doesn't appear
  // document.addEventListener('scroll', function () {
  //   if ($('body').hasClass('stories show') &&
  //       $('#more-stories').css('visibility') === 'hidden' &&
  //       ($(window).scrollTop() - $('#story-section-testimonial').offset().top) > 0) {
  //         initMoreStories();
  //       }
  // });

}

function loadVideoThumbnail () {

  var $thumbContainer = $(".video-thumb-container"),
      provider = $thumbContainer.data('provider'),
      videoId = $thumbContainer.data('video-id'),
      videoUrl = $thumbContainer.data("video-url"),
      videoQuery = '',
      thumbSrc = '';

  if ($thumbContainer.length === 0) { return false; }

  if (provider === 'youtube') {
    // ref: http://stackoverflow.com/questions/2068344
    thumbSrc = '//i1.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
    $thumbContainer.append(
      "<div>" +
        "<img class='video-thumb' src='" + thumbSrc + "'>" +
      "</div>"
    );
    // wait for image to load before overlaying play button ...
    $thumbContainer.find('img').one('load', function () {
      $(this).after(
        "<div class='play-button'>" +
          "<i class='fa fa-2x fa-inverse fa-play'></i>" +
        "</div>"
      );
    });

  } else if (provider === 'vimeo') {
    $.getJSON('//vimeo.com/api/oembed.json?url=https%3A//vimeo.com/' + videoId + '.json',
        function (data, status) {
          thumbSrc = data.thumbnail_url_with_play_button;
          $thumbContainer.append(
            "<div>" +
              "<img class='video-thumb' src='" + thumbSrc + "'>" +
            "</div>"
          );
        });
  }
} // loadThumbnail

function storiesPlayVideoListener () {

  $(document).on('click',
    '.video-thumb-container img, .video-thumb-container .play-button',
    function (e) {

    var $thumbContainer = $('.video-thumb-container'),
        $modal = $('#story-video-modal'),
        provider = $thumbContainer.data('provider'),
        videoId = $thumbContainer.data('video-id'),
        videoUrl = $thumbContainer.data("video-url"),
        modalPlayerWindow = $modal.find('iframe')[0].contentWindow,
        pausePlayer = function () {
          if (provider === 'youtube') {
            modalPlayerWindow.postMessage(
              '{"event":"command","func":"pauseVideo","args":""}', '*'
            );
          } else if (provider === 'vimeo') {
            modalPlayerWindow.postMessage(
              '{"method":"pause"}', '*'
            );
          }
        };

    if (provider === 'youtube') {
      videoQuery = '/?autoplay=1&enablejsapi=1&controls=0&iv_load_policy=3&showinfo=0&rel=0';
    } else if (provider === 'vimeo') {
      videoQuery = '/?autoplay=1';
    }

    if ($(document).width() < 600) {
      e.stopPropagation();  // stop modal from being triggered
      $(this).parent().replaceWith($("<iframe src='" + videoUrl + videoQuery + "'frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>"));

    } else { // play video in modal

      modalPlayerWindow.location.replace(videoUrl + videoQuery);

      $modal.find('button.close').on('click', function () {
        pausePlayer();
      });

      $modal.one('hide.bs.modal', function () {
        pausePlayer();
      });

      $modal.one('hidden.bs.modal', function () {
        modalPlayerWindow.location.replace('');
      });
    }
  });
}






