
function attachContributionsListeners () {

  var scrollY,
      offset = 190,  // 130px padding + 60 px header
      qHeight = $('.form-group.question:first-of-type').outerHeight(true),
      currentActiveQ = 0,
      nextActiveQ = 0,
      $questions = $('#submission-form .form-group.question'),
      qScrollRanges = [],
      getActiveQ = function (scrollY) {
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
        var scrollAmt;
        if (CSP.screenSize === 'xs') {
          if ($formGroup.is('.linkedin')) {
            scrollAmt = 30;
          } else {
            scrollAmt = 120;
          }
        } else {
          scrollAmt = offset;
        }
        $('html, body').animate({ scrollTop: ($formGroup.offset().top - scrollAmt).toString() + 'px' }, 200);
      },
      updateProgress = function () {
        var numAnswered = 0, pctAnswered;
        $questions.each(function () {
          if (CSP.screenSize === 'xs') {
            if ($(this).find('.visible-xs-block textarea').val()) numAnswered++;
          } else {
            if ($(this).find('.hidden-xs textarea').val()) numAnswered++;
          }
        });
        pctAnswered = Math.round((numAnswered / $questions.length) * 100).toString() + "%";
        $('.progress-label').text(numAnswered + ' of ' + $questions.length + ' answered');
        $('.progress-bar')
          .attr('style', 'width:' + pctAnswered)
          .find('.sr-only').text(numAnswered + ' of ' + $questions.length + ' answered');
      };

  if ($questions.length) {
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

    $(document).on('scroll', function () {
      scrollY = $(document).scrollTop();
      nextActiveQ = getActiveQ(scrollY);
      if (currentActiveQ !== nextActiveQ)  {
        changeActiveQ(currentActiveQ, nextActiveQ);
      }
    });

  }

  $questions.on('click', function (e) {
    if ($(this).hasClass('active') || $(e.target).is('button')) {
      return false;
    }
    $questions.find('button').css('display', 'none');
    $(this).addClass('active');
    $questions.not($(this)).each(function () { $(this).removeClass('active'); });
    scrollToNext($(this));
    updateProgress();
  });

  $questions.each(function () {
    $(this).find('textarea').on('focus', function () {
      if (CSP.screenSize === 'xs') $('#submission-progress').hide();
    });
  });

  $questions.each(function () {
    $(this).find('textarea').on('blur', function () {
      if (CSP.screenSize === 'xs') $('#submission-progress').show();
    });
  });

  $('#submission-form .next-question button').on('click', function () {
    $(this).toggle();
    $(this).closest('.form-group').find('textarea').trigger('blur');
    if ($(this).closest('.form-group').is('.form-group:nth-of-type(' + $questions.length + ')')) {
      $(this).closest('.form-group').removeClass('active');
      scrollToNext($('.form-group.linkedin'));
    } else {
      $(this).closest('.form-group').next().find('textarea').trigger('click');
      if (CSP.screenSize !== 'xs') {
        $(this).closest('.form-group').next().find('textarea').trigger('focus');
      }
    }
    updateProgress();
  });


  $('#submission-form .form-group.question textarea').on('input', function () {
    $(this).closest('.form-group').find('button').css('display', 'inline-block');
  });

}