
//= require ./linkedin
//= require modernizr/widget_modernizr
//= require js/classie
//= require plugins/grid_overlays

function cspInitOverlays ($container) {

  loading = function ($storyCard) {
      $storyCard.addClass('cs-loading');
      $container.find('a').css('pointer-events', 'none');
      setTimeout(function () {
        if (!$storyCard.hasClass('cs-loaded')) {
          $storyCard.addClass('cs-still-loading');
        }
      }, 1000);
    };

  $container.on('click', 'a.published, a.preview-published', function (e) {
    e.preventDefault();
    var $story, $storyCard = $(this);
    if ($storyCard.hasClass('cs-loaded')) {
      setTimeout(function () {
        $storyCard.removeClass('cs-loading cs-still-loading');
      }, 300);  // matches overlay animation time
      return false;
    } else {
      loading($storyCard);
      $.ajax({
        url: $storyCard.attr('href'),
        method: 'GET',
        data: {
          is_widget: true,
          window_width: $(window).width()
        },
        dataType: 'jsonp'
      })
        .done(function (data, status, jqxhr) {
          $story = $container.find('.content__item:nth-of-type(' + ($storyCard.index() + 1) + ')');
          $.when(
            $story.html(data.html),
            $storyCard.addClass('cs-loaded')
          )
            .then(function () { linkedinListener($story); })
            .then(function () {
              if ($storyCard.hasClass('has-video')) {
                cspInitVideo($story);
              }
              initLinkedIn();

              // when loading, all cards were set to pointer-events: none
              // now undo that...
              $container.find('a').removeAttr('style');

              // avoid double-tap behavior
              $container.on('click touchend', '.close-button-xs', function () {
                $(this).closest('.cs-content').find('.close-button').trigger('click');
              });

              // the grid_overlays.js listener is vanilla js, won't pick up on $storyCard.trigger('click')
              $storyCard[0].click();

            });
        })
        .fail(function () {

        });
    }

    });

}