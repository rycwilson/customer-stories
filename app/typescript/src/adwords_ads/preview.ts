initMasonry();
truncateLongHeadlines();

$('.ads-by-google').hover(
  function (this: HTMLElement) {
    $(this)
      .css('border-bottom-left-radius', '5px')
      .children('.svg-text')
        .css('display', 'inline-block');
  },
  function (this: HTMLElement) {
    setTimeout(() => {
      $(this)
        .css('border-bottom-left-radius', '0')
        .children('.svg-text')
          .hide();
    }, 400);
  }
)

$(document)
  .on('shown.bs.tab', '.nav-tabs.domain a', function (e: Event) {
    $('.nav-tabs.device')
      .has('a[href*="' + $(e.target).attr('href') + '"]')
      .show();
    $('.nav-tabs.device')
      .has('a:not([href*="' + $(e.target).attr('href') + '"])')
      .hide();
  })
  .on('shown.bs.tab', '.nav-tabs.device a', function (this: HTMLAnchorElement, e: Event) {
    const $tab = $(this);
    const deviceType = $tab.attr('href').slice($tab.attr('href').indexOf('-') + 1, $tab.attr('href').length);
    $('.nav-tabs.device a[href*="' + deviceType + '"]')
      .filter(function (this: HTMLAnchorElement) { return !$(this).is($tab) })
      .tab('show');
  })
  .on('shown.bs.tab', '[href="#websites"], [href="#websites-desktop"]', function () {
    $('#websites-desktop').imagesLoaded(function () {
      initMasonry();
      truncateLongHeadlines();
      // $('#websites-desktop').masonry('on', 'layoutComplete', function () {
      //   console.log('hello?')
      //   truncateLongHeadlines();
      // });
    });
  })
  .on('click', '.mobile__selector button', function (this: HTMLButtonElement) {
    const $carousel = $(this).closest('.mobile').find('.mobile__screen');
    $(this).children('.fa-pause').is(':visible') ? $carousel.carousel('pause') : $carousel.carousel('cycle');
    $(this).children('i').toggle();
    $(this).blur();
  })

function initMasonry() {
  $('#websites-desktop, #youtube-desktop').masonry({
    itemSelector: '.ad',
    columnWidth: 100,
    gutter: 40,
    // isFitWidth: true
    // disable initial layout ...
    // isInitLayout: false
  });
}

// ref https://stackoverflow.com/questions/3404508
function truncateLongHeadlines() {
  const $ads = $('.native-1, .native-2, .native-sm');
  const $longHeadlines = $ads.find('.long-headline');
  $longHeadlines.each(function (this: HTMLElement) {
    const $link = $(this).children('a');
    while ($link.outerHeight() > $(this).height()) {
      $link.text(function (index: number, text: string) {
        return text.replace(/\W*\s(\S)*$/, '...');
      });
    }
  });
}