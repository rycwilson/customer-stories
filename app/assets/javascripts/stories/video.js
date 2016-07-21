var VIDEO_LIB = {

  // ref: http://www.labnol.org/internet/light-youtube-embeds/27941/
  loadThumbnail: function () {

    var $thumbContainer = $(".video-thumb-container"),
        provider = $thumbContainer.data('provider'),
        videoId = $thumbContainer.data('video-id'),
        videoUrl = $thumbContainer.data("video-url"),
        videoQuery = '',
        thumbSrc = '';

    if (provider === 'youtube') {
      videoQuery = "/?autoplay=1&enablejsapi=1&controls=0&iv_load_policy=3&showinfo=0&rel=0";
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
      videoQuery = "/?autoplay=1";
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

    $thumbContainer.on('click', 'img, .play-button', function (e) {

      // presently only the show page loads a thumbnail for youtube and vimeo,
      // so if this event was triggered we know we're on stories#show
      var $modal = $('#story-video-modal'),
          modalPlayerWindow = $modal.find('iframe')[0].contentWindow,
          pausePlayer = function () {
            if (provider === 'youtube') {
              modalPlayerWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } else if (provider === 'vimeo') {
              modalPlayerWindow.postMessage('{"method":"pause"}', '*');
            }
          };

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
  } // loadThumbnail

};






