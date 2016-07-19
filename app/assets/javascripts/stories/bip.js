var BIP = BIP || {

  listeners: function () {

    // update video
    $(".best_in_place[data-bip-attribute='embed_url']").on("ajax:success",
      function (event, data) {
        var newUrl = JSON.parse(data).embed_url,
            $newVideo = null;

        if (newUrl.includes("youtube")) {
          $newVideo =
            "<iframe id='youtube-iframe' width='320' height='180' " +
              "src='" + newUrl + "?autohide=2&&enablejsapi=1&controls=0&showinfo=0&rel=0'" +
              "frameborder='0'></iframe>";

        } else if (newUrl.includes("vimeo")) {
          $newVideo =
            "<iframe id='vimeo-iframe' width='320' height='180' " +
              "src='" + newUrl + "' " +
              "frameborder='0'></iframe>";

        } else if (newUrl.includes("wistia")) {  // wistia
          // are wistia assets already defined?
          if (typeof Wistia === 'undefined') {
            $.getScript(newUrl);
            $.getScript('//fast.wistia.com/assets/external/E-v1.js');
          }
          // this must come after the $.getScript statements above!
          $newVideo =
            "<div class='wistia_embed wistia_async_" +
              newUrl.match(/\/(\w+)($|\.\w+$)/)[1] +
              "' style='width:320px;height:180px'>&nbsp;</div>";
        }

        $('.video-container').empty().append($newVideo);

        $(".best_in_place[data-bip-attribute='embed_url']").text(newUrl);

    });

    // best-in-place errors
    $(document).on('best_in_place:error', function (event, data, status, xhr) {
      var errors = JSON.parse(data.responseText);
      flashDisplay(errors.join(', '), "danger");
    });

    /*
      tabindex=-1 on these elements prevents them from gaining focus
      after a bip field is submitted (with tab)()
      also has the side-effect of keeping focus on the element,
      which we'll prevent with ...
    */
    $('a.accordion-toggle').on('focus', function () {
      var $_this = $(this);
      window.setTimeout(function () { $_this.blur(); }, 200);
    });

  }

};

