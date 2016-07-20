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
      // 1, 2, 3, hqdefault, mqdefault, default
      // ref: http://stackoverflow.com/questions/2068344
      thumbSrc = '//img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + thumbSrc + "'>" +
            "<i class='fa fa-5x fa-inverse fa-play-circle-o'></i>" +
          "</div>" );

    } else if (provider === 'vimeo') {
      videoQuery = "/?autoplay=1";
      // 640 (large), 200x150 (medium), or 100x75 (small)
      // ref: http://stackoverflow.com/questions/1361149/
      // (can't use a direct url because there's a different id to get to the thumbnails)
      $.getJSON('//vimeo.com/api/v2/video/' + videoId + '.json', function (data, status) {
        thumbSrc = data[0].thumbnail_medium;
        $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + thumbSrc + "'>" +
            "<i class='fa fa-5x fa-inverse fa-play-circle-o'></i>" +
          "</div>");
      });
    }

    $thumbContainer.on('click', 'img, i', function (e) {

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






