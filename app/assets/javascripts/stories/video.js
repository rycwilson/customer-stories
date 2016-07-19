var VIDEO_LIB = {

  loadThumbnail: function () {

    var $thumbContainer = $(".video-thumb-container"),
        $modal = $('#story-video-modal'),
        provider = $thumbContainer.data('provider'),
        videoId = $thumbContainer.data('video-id'),
        videoUrl = $thumbContainer.data("video-url"),
        videoQuery = '',
        thumbSrc = '',
        $player = null;

    if (provider === 'youtube') {
      videoQuery = "?autoplay=1&autohide=2&&enablejsapi=1&controls=0&showinfo=0&rel=0";
      // 1, 2, 3, hqdefault, mqdefault, default
      // ref: http://stackoverflow.com/questions/2068344
      thumbSrc = '//img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + thumbSrc + "'>" +
            "<i class='fa fa-5x fa-inverse fa-play-circle-o'></i>" +
          "</div>");

    } else if (provider === 'vimeo' ) {
      videoQuery = "?autoplay=1";
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

      if ($(document).width() < 600) {

        e.stopPropagation();  // stop modal from being triggered

        var $iframe = $('<iframe></iframe>');

        if (provider === 'youtube') {
          $iframe.attr('src', "//www.youtube.com/embed/" + videoId + videoQuery);
        } else if (provider === 'vimeo') {
          $iframe.attr('src', "//player.vimeo.com/video/" + videoId + videoQuery);
        }
        $iframe.attr('frameborder', '0');
        $(this).parent().replaceWith($iframe);

      } else { // play video in modal
        var $player = $modal.find('iframe'),
            videoUrlAuto = videoUrl + videoQuery;

        $player.attr('src', videoUrlAuto);

        $modal.find('button.close').on('click', function () {
          $player.attr('src', '');
        });

        $modal.on('hidden.bs.modal', function () {
          $player.attr('src', '');
        });
      }

    });
  } // loadThumbnail

};






