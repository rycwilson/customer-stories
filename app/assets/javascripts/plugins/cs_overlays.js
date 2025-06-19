//= require modernizr/widget_modernizr
//= require js/classie
//= require vendor/grid_overlays
//= require css-element-queries/src/ResizeSensor

function cspInitOverlays ($, $container, subdomain, isDemo, env) {
  //console.log('cspInitOverlays()')

  // subset of playVideo function in stories_main
  const playVideo = (e) => {
    if (e.target.closest('iframe')) return false;   // trigger this function ONLY by clicking the thumbnail image or play button
    const provider = e.currentTarget.dataset.provider;
    const url = e.currentTarget.dataset.videoUrl;
    const sharedParams = 'autoplay=1';
    const youtubeParams = 'enablejsapi=1&controls=0&iv_load_policy=3&showinfo=0&rel=0';
    const params = (
      `${url.includes('?') ? '&' : '?'}` + sharedParams + `${provider === 'youtube' ? `&${youtubeParams}` : ''}`
    );
    const videoFrame = e.currentTarget.querySelector('iframe');
    const pauseVideo = (e) => {
      videoFrame.contentWindow.postMessage(
        provider === 'youtube' ? '{"event":"command","func":"pauseVideo","args":""}' : '{"method":"pause"}', 
        '*'
      );
    }
    videoFrame.addEventListener('load', (e) => {
      const frame = e.currentTarget;
      frame.classList.remove('hidden');
      [...frame.parentElement.children].forEach(el => { if (!el.isSameNode(frame)) el.remove(); });
    }, { once: true });
    videoFrame.src = url + params;
    videoFrame.closest('.cs-story-wrapper').querySelectorAll('.cs-story-header button').forEach(btn => {
      btn.addEventListener('click', pauseVideo);
      btn.addEventListener('touchend', pauseVideo);
    });
  }

  var pixleeCtaTop, getPixleeCtaTop
      doPixleeStuff = function () {
        getPixleeCtaTop = function ($storyOverlay) {
          return parseInt($storyOverlay.find('.cs-story-wrapper').css('margin-top'), 10) +
                 $storyOverlay.find('.cs-story-header').outerHeight(true) +
                 $storyOverlay.find('.cs-testimonial').outerHeight(true) +
                 ($storyOverlay.find('.story-results.hidden-xs:not(.visible-xs-block .story-results)').length ? $storyOverlay.find('.story-results.hidden-xs:not(.visible-xs-block .story-results)').outerHeight(true) : 0) +
                 ($storyOverlay.find('.story-ctas.hidden-xs:not(.visible-xs-block .story-ctas)').length ? $storyOverlay.find('.story-ctas.hidden-xs:not(.visible-xs-block .story-ctas)').outerHeight(true) : 0) - 25;  // 25 is margin between header and cta
        };

        // listener for fixing CTA (ref https://stackoverflow.com/questions/24270036)
        document.addEventListener('scroll', function (e) {
          if ($(e.target).is('section.content--show .scroll-wrap')) {
            var currentScroll = $(e.target).scrollTop();
            if (currentScroll > pixleeCtaTop) {
              $('.pixlee-cta').css({    // scroll to that element or below it
                position: 'fixed',
                height: '400px',
                width: $('.story-sidebar').width().toString() + 'px',
                top: '25px',  // header height + margin
                left: ($('.story-sidebar').offset().left + parseInt($('.story-sidebar').css('padding-left'), 10)).toString() + 'px'
              });
            } else {
              $('.pixlee-cta').css({
                position: 'static'
              });
            }
          }
        }, { capture: true, passive: true });
      },
      applyScrollBoundaries = function () {
        var maxY, startY = 0;
        $container
          .find('.scroll-wrap').on('touchstart', function (e) {
              startY = e.originalEvent.touches[0].pageY;
            })
            .end()
          .find('.scroll-wrap').on('touchmove', function (e) {
            var offsetY;
            maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
            offsetY = startY - e.originalEvent.touches[0].pageY;
            // prevent scroll if it's going past the boundary
            if ($(this).prop('scrollTop') + offsetY < 0 || $(this).prop('scrollTop') + offsetY > maxY) {
              e.preventDefault();
              $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + offsetY)));
            }
          });
      },
      storyLoading = function ($storyCard) {
        $container.find('a.published, a.preview-published').css('pointer-events', 'none');
        // the forceRedraw() isn't necessary as in index.js because default is always prevented
        $storyCard.addClass('cs-loading cs-still-loading');  // .forceRedraw();
      },
      showPrimaryCtaXs = function ($storyOverlay) {
        setTimeout(function () {
          $storyOverlay.find('.primary-cta-xs').addClass('open');
        }, 3000);
      },
      initOverlay = function ($storyCard, $storyOverlay) {
        // console.log('initOverlay()')
        $storyOverlay.find('*').addClass('cs');
        $storyOverlay.find('.cs-share-buttons a').each(function () {
          var redirectUrl, replaceRegex, replacement;

          // the query param identifying the story locally (?cs=) won't yet be present
          // if the story is loaded async'ly
          if (location.href.match(/\?cs=/)) {
            redirectUrl = location.href
          } else {
            // grab the story slug from the encoded href (%2F = /)
            var storySlug = $(this).attr('href').slice(
                               $(this).attr('href').lastIndexOf('%2F') + 3,
                               $(this).attr('href').length
                             );
            redirectUrl = location.href + '?cs=' + storySlug;
          }

          // set provider-specific regex to be matched
          if ($(this).is('[href*="facebook"]')) {
            replaceRegex = new RegExp(/sharer.php\?u=.+$/);
          } else if ($(this).is('[href*="twitter"]')) {
            replaceRegex = new RegExp(/share\?url=.+$/)
          } else if ($(this).is('[href*="linkedin"]')) {
            replaceRegex = new RegExp(/shareArticle\?mini=true&url=.+$/)
          }

          if ($(this).is('[href*="mailto"]')) {
            replaceRegex = /&body=.+$/;
            replacement = '&body=' + encodeURIComponent(redirectUrl)
          } else {
            replacement = function (match, index) {
                return match + encodeURIComponent('?redirect_uri=' + redirectUrl)
              }
          }

          // modify the share url to include the encoded redirect_url
          $(this).attr('href', $(this).attr('href').replace(replaceRegex, replacement))
        });

        $storyOverlay[0].querySelectorAll('.video-thumb-container').forEach(container => {
          container.addEventListener('click', playVideo);
          container.addEventListener('touchend', playVideo);
        })

        $storyOverlay[0].querySelectorAll('.cs-share-button').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();   // don't follow the link
            const width = parseInt(link.dataset.windowWidth);
            const height = parseInt(link.dataset.windowHeight);
            const top = screenTop + (document.documentElement.clientHeight / 2) - (height / 2);
            const left = screenLeft + (document.documentElement.clientWidth / 2) - (width / 2);
            window.open(
              e.currentTarget.href, 
              'Share Customer Story', 
              `width=${width},height=${height},top=${top},left=${left},resizable=no`
            );
          });
        });

        trackStoryVisitor($storyCard);
      },
      initPreselected = function () {
        if ($container.find('.story-card.cs-loaded').length) {
          var $storyCard = $('.story-card.cs-loaded'),
              storyIndex = $container.is('#cs-gallery') ? 
                             $storyCard.index() + 1 : 
                             $storyCard.parent().index() + 1,
              $storyOverlay = $container.find('.content__item:nth-of-type(' + storyIndex + ')');
          initOverlay($storyCard, $storyOverlay);
        }
      },
      getStory = function ($storyCard, $storyOverlay) {
        $.ajax({
          url: $storyCard.find('a').attr('href'),
          method: 'GET',
          data: {
            is_plugin: true,
            window_width: window.innerWidth
          },
          dataType: 'jsonp'
        })
          .done(function (data, status, jqxhr) {
            $.when(
              $storyOverlay.html(data.html),
              $storyCard.removeClass('cs-still-loading').addClass('cs-loaded')
            )
              .then(function () {
                initOverlay($storyCard, $storyOverlay);
                $storyCard.find('a')[0].click();
                showPrimaryCtaXs($storyOverlay);
              })

          })
          .fail(function () {});

      },
      openOrGetStory = function ($storyCard, $storyOverlay) {
        if ($storyCard.hasClass('cs-loaded')) {
          // grid overlays handler will open overlay
          showPrimaryCtaXs($storyOverlay);
          if (subdomain === 'pixlee') {
            pixleeCtaTop = getPixleeCtaTop($storyOverlay);
          }
        } else {
          storyLoading($storyCard);
          getStory($storyCard, $storyOverlay);
        }
      },
      resetStoryCardListener = function ($storyCard) {
        // undo hover and click listener if clicking anywhere outside the story card
        // the callback function here was executing on initial tap - why? and why isn't this an issue in index.js?
        // => prevent this with a timeout
        setTimeout(function () {
          $('body').one(
            'touchstart',
            function (e) {
              // console.log('body touchstart')
              if ($(e.target).is($storyCard) || $storyCard.has(e.target).length ) {
                // do nothing
              } else {
                $storyCard.removeClass('cs-hover')
              }
            }
          );
        }, 100)
      };

  applyScrollBoundaries();
  initPreselected();

  if (subdomain === 'pixlee') doPixleeStuff();

  // event listeners
  $container
    .on('click', '.cs-close-xs', function (e) {
      // there are multiple close buttons in the story header; don't trigger them all
      $('.content__item--show .cs-close').first().trigger('click');
    })

    .on('click', '.primary-cta-xs.open', function (e) {
      if ($(e.target).closest('button').length) { 
        $('.primary-cta-xs').each(function () { $(this).remove(); });
        // TODO add a cookie
      } else if (!$(e.target).is('a')) {
        $(this).find('a')[0].click();
      }
    })

    .on('click touchstart', '.story-card--published a', function (e) {
      // console.log('click touchstart')
      var $storyLink = $(this),
          $storyCard = $(this).parent(),
          storyIndex = $container.is('#cs-gallery') ? 
                         $storyCard.index() + 1 : 
                         $storyCard.parent().index() + 1,
          $storyOverlay = $container.find('.content__item:nth-of-type(' + storyIndex + ')');

      e.preventDefault();

      if (e.type === 'click') {
        openOrGetStory($storyCard, $storyOverlay);

      } else {  // touchstart
        if ($storyCard.hasClass('cs-hover')) {
          $storyLink[0].click();

        } else {
          $storyCard.addClass('cs-hover');
          $container.find('.story-card').not($storyCard).each(function () {
            $(this).removeClass('cs-hover');
          });

          // stop the subsequent touchend event from triggering the <a> tag
          $storyLink.one('touchend', function (e) {
            e.preventDefault();
          });

          // undo hover style when clicking anywhere outside the story card
          resetStoryCardListener($storyCard);
        }
      }
    });

  function trackStoryVisitor ($storyCard) {
    if (env === 'customerstories.net' && !isDemo) {
      $storyCard.append(
        '<iframe class="cs-iframe" height="0" width="0" style="display:none" ' +
          'src="' + $storyCard.attr('href') + '?track=1"' +
        '></iframe>'
      );
    }
  }
}