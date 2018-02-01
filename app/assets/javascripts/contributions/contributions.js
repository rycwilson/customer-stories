
function attachContributionsListeners () {

  var scrollY,
      offset = 200,
      qHeight = $('.form-group.question:first-of-type').outerHeight(true),
      currentActiveQ = 0,
      nextActiveQ = 0,
      $questions = $('#submission-form .form-group.question'),
      qScrollRanges = [];

  for (var i = 0; i < $questions.length; i ++) {
    if (i === 0) {
      qScrollRanges.push([ 0, offset ]);
    } else {
      qScrollRanges.push([ offset + ((i - 1) * qHeight), offset + (i * qHeight) ]);
    }
  }
  qScrollRanges.push([
    qScrollRanges[$questions.length - 1][1],
    qScrollRanges[$questions.length - 1][1] + $('.form-group.linkedin').outerHeight()
  ]);

  var getActiveQ = function (scrollY) {
        return qScrollRanges.findIndex(function (range) {
          return scrollY >= range[0] && scrollY <= range[1];
        });
      },
      changeActiveQ = function (currentQ, nextQ) {
        $questions.eq(currentQ).removeClass('active');
        $questions.find('button').css('display', 'none');
        if (nextQ !== -1) {
          $questions.eq(nextQ).addClass('active');
          currentActiveQ = nextQ;
        }
      },
      scrollToNext = function ($formGroup) {
        $('html, body').animate({ scrollTop: ($formGroup.offset().top - 200).toString() + 'px' }, 200);
      };

  $(document).on('scroll', function () {
    scrollY = $(document).scrollTop();
    nextActiveQ = getActiveQ(scrollY);
    if (currentActiveQ !== nextActiveQ)  {
      changeActiveQ(currentActiveQ, nextActiveQ);
    }
  });

  $questions.on('click', function (e) {
    if ($(this).hasClass('active') || $(e.target).is('button')) {
      return false;
    }
    $questions.find('button').css('display', 'none');
    $(this).addClass('active');
    $questions.not($(this)).each(function () { $(this).removeClass('active'); });
    scrollToNext($(this));
  });

  $('#submission-form .next-question button').on('click', function () {
    $(this).toggle();
    if ($(this).closest('.form-group').is('.form-group:nth-of-type(' + $questions.length + ')')) {
      $(this).closest('.form-group').removeClass('active');
      scrollToNext($('.form-group.linkedin'));
    } else {
      $(this).closest('.form-group').next().find('textarea').trigger('click').trigger('focus');
    }
  });


  $('#submission-form textarea').on('input', function () {
    $(this).closest('.form-group').find('button').css('display', 'inline-block');
  });

}