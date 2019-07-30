
export default {
  
  init: (options) => {
    const $container = $('#cs-tabbed-carousel');
    const $carousel = $container.find('.row-horizon')
    const $pagination = $container.find('.cs-pagination-row');
    const $arrows = $container.find('.cs-scroll-left, .cs-scroll-right');
    // const maxScrollPosition = scrollWidth - $carousel.width();
    const numPages = Math.ceil($carousel.prop('scrollWidth') / $carousel.width());
    addPagination($pagination, numPages);
    if (numPages > 1) {
      addScrollListeners($carousel, $pagination, $arrows, numPages);
    } else {
      $pagination.add($arrows).css('visibility', 'hidden');
    }
    // init the slideDrawer plugin 

  }

}

function addScrollListeners($carousel, $pagination, $arrows, numPages) {
  const pageWidth = Math.ceil($carousel.prop('scrollWidth') / numPages);
  const currentPage = (() => {
    let currPage = 1;
    return {
      set: (nextPage) => currPage = nextPage,
      get: () => currPage 
    };
  })();

  // this handler must be in the present scope so it can access currentPage
  const trackCurrentPage = function (e) {
    const scrollPosition = $carousel.scrollLeft();
    setTimeout(() => {
      if ($carousel.scrollLeft() === scrollPosition) {
        const nextPage = getPageNowShowing($carousel, numPages, pageWidth);
        if (nextPage !== currentPage.get()) {
          updatePagination($pagination, currentPage.get(), nextPage)
          currentPage.set(nextPage);
        }
      } else {
        trackCurrentPage();
      }
    }, 100);
  };
  $carousel.on('scroll', trackCurrentPage);
  $pagination.on(
    'click', 
    '.cs-page-dot', 
    function () {
      const $nextPage = $(this);
      scrollByPagination($carousel, $pagination, $nextPage, pageWidth)
        .then((didScroll) => {
          if (didScroll) {
            currentPage.set($nextPage.index() + 1);
            $carousel.on('scroll', trackCurrentPage);
          }
        });
    }
  )
  $arrows.on(
    'click', 
    function () {
      const $button = $(this);
      scrollByArrow($carousel, $pagination, $button, pageWidth)
        .then((didScroll) => {
          if (didScroll) {
            currentPage.set($pagination.find('.cs-current-page-dot').index() + 1);
            $carousel.on('scroll', trackCurrentPage);
          }
        })

    }
  )
}

function scrollByArrow($carousel, $pagination, $button, pageWidth) {
  const direction = $button.hasClass('cs-scroll-left') ? 'left' : 'right';
  const scrollPosition = $carousel.scrollLeft();
  const scrollRemaining = (direction === 'right') ? 
          $carousel.prop('scrollWidth') - (scrollPosition + $carousel.width()) :
          null;
  const $currentPage = $pagination.find('.cs-current-page-dot');
  const isLeftScroll = (direction === 'left') && ($currentPage.index() !== 0);
  const isRightScroll = (direction === 'right') && 
                        ($currentPage.index() !== $pagination.children().length - 1);
  if (isLeftScroll || isRightScroll) {
    const $nextPage = isLeftScroll ? $currentPage.prev() : $currentPage.next();
    $currentPage.add($nextPage).toggleClass('cs-current-page-dot');

    // turn off the scroll listener since pagination has been updated manually;
    // return a promise so the listener can be turned back on
    $carousel.off('scroll');
    return $carousel
              .animate(
                { 
                  scrollLeft: (direction === 'left') ? 
                    `-=${scrollPosition >= pageWidth ? pageWidth : scrollPosition}` :
                    `+=${scrollRemaining >= pageWidth ? pageWidth : scrollRemaining }`
                }, 
                1000,
              )
              .promise();
  } else {
    return $.Deferred().resolve(false);
  }
}

function scrollByPagination($carousel, $pagination, $nextPage, pageWidth) {
  const $currentPage = $pagination.find('.cs-current-page-dot');
  if ($nextPage.is($currentPage)) {
    return $.Deferred().resolve(false);
  }
  $currentPage.add($nextPage).toggleClass('cs-current-page-dot')

  // turn off the scroll listener since pagination has been updated manually;
  // return a promise so the listener can be turned back on
  $carousel.off('scroll');
  return $carousel
           .animate({ scrollLeft: pageWidth * $nextPage.index() }, 1000)
           .promise();
}

function getPageNowShowing($carousel, numPages, pageWidth) {
  for (let i = 1; i <= numPages; i++) {
    if ($carousel.scrollLeft() + ($carousel.width() / 2) < pageWidth * i) {
      return i;
    }
  }
}

function addPagination($pagination, numPages) {
  for (let i = 0; i < numPages; i++) {
    $pagination.append(
      `<div class="cs-page-dot ${i === 0 ? 'cs-current-page-dot' : ''}"></div>`
    )
  }
}

function updatePagination($pagination, currentPage, nextPage) {
  $pagination
    .find(`div:nth-of-type(${currentPage})`)
      .removeClass('cs-current-page-dot')
      .end()
    .find(`div:nth-of-type(${nextPage})`)
      .addClass('cs-current-page-dot');
}


/*
  when scrolling past boundaries with trackpad, prevent default browser behavior
  (back/forward navigation)
*/
// function xScrollBoundaries () {
//   var maxX = null;
//   $(document).on('wheel', '.row-horizon', function (event) {
//     maxX = $(this).prop('scrollWidth') - $(this).prop('offsetWidth');
//     // If this event looks like it will scroll beyond the bounds of the element,
//     //  prevent it and set the scroll to the boundary manually
//     if ($(this).prop('scrollLeft') + event.originalEvent.deltaX < 0 ||
//         $(this).prop('scrollLeft') + event.originalEvent.deltaX > maxX) {
//       event.preventDefault();
//       $(this).prop('scrollLeft', Math.max(0, Math.min(maxX, $(this).prop('scrollLeft') + event.originalEvent.deltaX)));
//     }
//   });
// }

