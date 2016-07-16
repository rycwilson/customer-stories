var VIDEO_LIB = {

  loadThumbnail: function () {

    var $thumbContainer = $(".video-thumb-container"),
        provider = $thumbContainer.data('provider'),
        videoId = $thumbContainer.data('video-id'),
        videoUrl = $thumbContainer.data("video-url"),
        src = null;

    if (provider === 'youtube') {
      // 1, 2, 3, hqdefault, mqdefault, default
      // ref: http://stackoverflow.com/questions/2068344
      src = '//img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + src + "'>" +
            "<i class='fa fa-5x fa-inverse fa-play-circle-o'></i>" +
          "</div>");
    } else if (provider === 'vimeo' ) {
      // 640 (large), 200x150 (medium), or 100x75 (small)
      // ref: http://stackoverflow.com/questions/1361149/
      // (can't use a direct url because there's a different id to get to the thumbnails)
      $.getJSON('//vimeo.com/api/v2/video/' + videoId + '.json', function (data, status) {
        src = data[0].thumbnail_medium;
        $thumbContainer.append(
          "<div>" +
            "<img class='video-thumb' src='" + src + "'>" +
            "<div class='fa fa-5x fa-inverse fa-play-circle-o'></div>" +
          "</div>");
      });
    }

    $thumbContainer.on('click', function () {

      // if ($(document).width < 600) {

      //   var $iframe = $('iframe'),
      //       query = "?autoplay=1&autohide=2&border=0&wmode=opaque&enablejsapi=1&controls=0&showinfo=0";

      //   if (provider === 'youtube') {
      //     $iframe.attr('src', "//www.youtube.com/embed/" + videoId + query);
      //   } else if (provider === 'vimeo') {
      //     $iframe.attr('src', "//player.vimeo.com/video/" + videoId + query);
      //   }
      //   $iframe.attr('src', src)
      //          .attr('frameborder', '0')

      //   iframe.setAttribute("src", "//www.youtube.com/embed/" + this.parentNode.dataset.id + "?autoplay=1&autohide=2&border=0&wmode=opaque&enablejsapi=1&controls=0&showinfo=0");
      //   iframe.setAttribute("frameborder", "0");
      //   iframe.setAttribute("id", "youtube-iframe");
      //   this.parentNode.replaceChild(iframe, this);

      // } else {

        var $modal = $('#story-video-modal'),
            $player = $modal.find('iframe'),
            videoUrl = $(this).data("video-url"),
            videoUrlAuto = videoUrl + "?modestbranding=1&rel=0&controls=0&showinfo=0&html5=1&autoplay=1";

        $player.attr('src', videoUrlAuto);

        $modal.find('button.close').on('click', function () {
          $player.attr('src', videoUrl);
        });

        $modal.on('hidden.bs.modal', function () {
          $player.attr('src', '');
        });

      // }


    });

  }

};