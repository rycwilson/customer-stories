
function moreStoriesScrollHandlers () {

  var $carousel = $('.row-horizon'),
      $paginationContainer = $('.cs-pagination-row'),
      scrollWidth = $carousel.prop('scrollWidth'),
      maxScrollPosition = scrollWidth - $carousel.width(),
      numPages = Math.ceil(scrollWidth / $carousel.width()),
      pageWidth = Math.ceil(scrollWidth / numPages),
      currentPage = 1,
      scrollPosition = null, scrollRemaining = null,
      dynamicPage = null, lastPage = null,
      calculateDynamicPage = function (position, numPages, pageWidth, carouselWidth) {
        for (var i = 1; i <= numPages; i++) {
          if (position + (carouselWidth / 2) < pageWidth * i) { return i; }
        }
      },
      paginationTrackScroll = function () {
        dynamicPage =
          calculateDynamicPage($(this).scrollLeft(), numPages, pageWidth, $(this).width());
        if (dynamicPage !== currentPage) {
          lastPage = currentPage;
          currentPage = dynamicPage;
          $paginationContainer.find('div:nth-of-type(' + lastPage.toString() + ')')
                              .removeClass('cs-current-page-dot');
          $paginationContainer.find('div:nth-of-type(' + currentPage.toString() + ')')
                              .addClass('cs-current-page-dot');
        }
      },
      paginationScroll = function ($carousel, pageWidth, paginationTrackScroll) {
        // $(this) refers to the div.page-dot clicked
        return function (e) {
          var goToPage = null, scrollTo = null;

          if ($(this).hasClass('cs-current-page-dot')) { e.preventDefault(); }

          // turn off other handlers until animation is complete
          $carousel.off('scroll', paginationTrackScroll);
          // .. but not the currently executing handler ... things get weird
          // $('.cs-page-dot').off('click', paginationScroll)

          $(this).addClass('goto-page-dot');
          $('.cs-current-page-dot').removeClass('cs-current-page-dot');
          $('.cs-page-dot').each(function (index, pageDot) {
            if ($(this).hasClass('goto-page-dot')) {
              scrollTo = index * pageWidth;
              $(this).addClass('cs-current-page-dot')
                     .removeClass('goto-page-dot');
              return false;
            }
          });
          $carousel.animate({ scrollLeft: scrollTo }, 1000, function () {
            $carousel.on('scroll', paginationTrackScroll);
          });
        };
      },
      arrowScrollLeft = function ($carousel, pageWidth) {
        return function (e) {
          var scrollPosition = $carousel.scrollLeft();
          $('.cs-page-dot').off('click', paginationScroll);
          if (scrollPosition >= pageWidth) {
            $carousel.animate({ scrollLeft: '-=' + pageWidth.toString() }, 1000,
              function () { $('.cs-page-dot').on('click', paginationScroll); });
          }
          else {
            $carousel.animate({ scrollLeft: '-=' + scrollPosition.toString() }, 1000,
              function () { $('.cs-page-dot').on('click', paginationScroll); });
          }
        };
      },
      arrowScrollRight = function ($carousel, pageWidth, scrollWidth) {
        return function (e) {
          var scrollPosition = $carousel.scrollLeft(),
              scrollRemaining = scrollWidth - (scrollPosition + $carousel.width());
          $('.cs-page-dot').off('click', paginationScroll);
          if (scrollRemaining >= pageWidth) {
            $carousel.animate({ scrollLeft: '+=' + pageWidth.toString() }, 1000,
              function () { $('.cs-page-dot').on('click', paginationScroll); });
          } else {
            $carousel.animate({ scrollLeft: '+=' + scrollRemaining.toString() }, 1000,
              function () { $('.cs-page-dot').on('click', paginationScroll); });
          }
        };
      };

  // set up pagination
  for (var i = 0; i < numPages; i++) {
    if (i === 0) {
      $paginationContainer
        .append("<div class='cs-page-dot cs-current-page-dot'></div>");
    } else {
      $paginationContainer
        .append("<div class='cs-page-dot'></div>");
    }
  }

  if (numPages > 1) {

    $carousel.on('scroll', paginationTrackScroll);
    $('.cs-scroll-left')
      .on('click', arrowScrollLeft($carousel, pageWidth));
    $('.cs-scroll-right')
      .on('click', arrowScrollRight($carousel, pageWidth, scrollWidth));
    $('.cs-page-dot')
      .on('click', paginationScroll($carousel, pageWidth, paginationTrackScroll));

  } else {
    $('.cs-pagination-row, .cs-scroll-left, .cs-scroll-right')
      .css('visibility', 'hidden');
  }
}

/*
  when scrolling past boundaries with trackpad, prevent default browser behavior
  (back/forward navigation)
*/
function xScrollBoundaries () {
  var maxX = null;
  $(document).on('wheel', '.row-horizon', function (event) {
    maxX = $(this).prop('scrollWidth') - $(this).prop('offsetWidth');
    // If this event looks like it will scroll beyond the bounds of the element,
    //  prevent it and set the scroll to the boundary manually
    if ($(this).prop('scrollLeft') + event.originalEvent.deltaX < 0 ||
        $(this).prop('scrollLeft') + event.originalEvent.deltaX > maxX) {
      event.preventDefault();
      $(this).prop('scrollLeft', Math.max(0, Math.min(maxX, $(this).prop('scrollLeft') + event.originalEvent.deltaX)));
    }
  });
}

// function buttonListeners () {
//   $(document).on('focus', 'button', function () {
//     var _this = $(this);
//     window.setTimeout(function () {
//       _this.blur();
//     }, 200);
//   });
// }
