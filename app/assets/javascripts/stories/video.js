var VIDEO_LIB = {

  loadThumbnail: function () {

    var $thumbContainer = $(".video-thumb-container"),
        provider = $thumbContainer.data('provider'),
        vidId = $thumbContainer.data('id'),
        src = null;

    if (provider === 'youtube') {
      // 1, 2, 3, hqdefault, mqdefault, default
      src = '//img.youtube.com/vi/' + vidId + '/hqdefault.jpg';
      $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + src + "'>" +
            "<i class='fa fa-5x fa-inverse fa-play-circle-o'></i>" +
          "</div>");
    } else if (provider === 'vimeo' ) {
      // 640 (large), 200x150 (medium), or 100x75 (small)
      // (can't use a direct url because there's a different id to get to the thumbnails)
      $.getJSON('//vimeo.com/api/v2/video/' + vidId + '.json', function (data, status) {
        src = data[0].thumbnail_medium;
        $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + src + "'>" +
            "<div class='play-button'></div>" +
          "</div>");
      });
    }

    $thumbContainer.on('click', function () {

      var $modal = $('#story-video-modal'),
          $player = $modal.find('iframe'),
          videoUrl = $(this).data("video-url"),
          videoUrlAuto = videoUrl + "?modestbranding=1&rel=0&controls=0&showinfo=0&html5=1&autoplay=1";

      $player.attr('src', videoUrlAuto);

      $modal.find('button.close').on('click', function () {
        $player.attr('src', videoUrl);
      });

      $modal.on('hidden.bs.modal', function () {
        $player.attr('src', videoUrl);
      });

    });

  }

};