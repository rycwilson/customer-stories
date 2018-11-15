
function attachContributionsListeners () {

  var $questions = $('#submission-form .form-group.question'),
      qHeight = $questions.eq(0).outerHeight(true),
      offsetTop = $questions.length && $questions.eq(0).offset().top,
      currentActiveQ = 0,
      updateProgress = function () {
        var numAnswered = 0, pctAnswered;
        $questions.each(function () {
          if ($(this).find('textarea').val()) numAnswered++;
        });
        pctAnswered = Math.round((numAnswered / $questions.length) * 100).toString() + "%";
        $('.progress-label').text(numAnswered + ' of ' + $questions.length + ' answered');
        $('.progress-bar')
          .attr('style', 'width:' + pctAnswered)
          .find('.sr-only').text(numAnswered + ' of ' + $questions.length + ' answered');
      },
      changeActiveQ = function (nextQ) {
        $questions.eq(nextQ).addClass('active');
        $questions.not($questions.eq(nextQ)).each(function () {
          $(this).removeClass('active')
                 .find('textarea').trigger('blur')
                   .end()
                 .find('button').hide();
        });
        currentActiveQ = nextQ;
        if ($questions.eq(currentActiveQ).find('textarea').val()) {
          $questions.eq(currentActiveQ).find('button').show();
        }
        updateProgress()
      },
      scrollHandler = function (e) {
        // console.log('scroll')
        var nextActiveQ = Math.floor($(document).scrollTop() / qHeight);
        if (currentActiveQ !== nextActiveQ)  {
          changeActiveQ(nextActiveQ);
        }
      }
      scrollToQ = function ($question) {
        var scrollAmt;
        if (CSP.screenSize === 'xs') {
          if ($question.is('.linkedin')) {
            scrollAmt = 30;
          } else {
            scrollAmt = 120;
          }
        } else {
          scrollAmt = offsetTop;
        }
        changeActiveQ($questions.index($question))
        $(document).off('scroll', scrollHandler);  // turn off scroll listener while animating
        $('html, body').animate(
          { scrollTop: ($question.offset().top - scrollAmt).toString() + 'px' },
          200,
          function () {
            $(document).on('scroll', scrollHandler);
          }
        );
      };

  // monitor scrolling and adjust active question as necessary
  if ($questions.length && $('body').hasClass('contributions edit')) {
    console.log('test')
    $(document).on('scroll', scrollHandler);
  }

  $questions.on('click', function (e) {
    if ($(this).hasClass('active') || $(e.target).is('button')) {
      return false;
    }
    $(this).find('textarea').trigger('focus')
  });

  $questions.each(function () {
    $(this).on('focusin', function () {
      if (CSP.screenSize === 'xs') {
        $('#submission-progress').hide();
      } else {
        if (!$(this).hasClass('active')) {
          scrollToQ($(this));
        }
      }
    });
  });

  $questions.each(function () {
    $(this).find('textarea').on('blur', function () {
      if (CSP.screenSize === 'xs') $('#submission-progress').show();
    });
  });

  $('#submission-form .next-question button').on('click', function () {
    $(this).toggle();
    if (currentActiveQ === $questions.length - 1) {
      scrollToQ($('.form-group.linkedin'));
    } else {
      $questions.eq(currentActiveQ + 1).find('textarea').trigger('focus')
    }
  });

  $('#submission-form .form-group.question textarea').on('input', function () {
    if ($(this).val()) {
      $(this).next().find('button').show();
    } else {
      $(this).next().find('button').hide();
    }
  });

}