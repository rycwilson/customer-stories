
function attachContributionsListeners () {

  var $questions = $('#submission-form .form-group.question'),
      offsetTop = $questions.length && $questions.eq(0).offset().top,
      qHeights = $questions.map(function (index) {
        return $(this).outerHeight(true);
      }).get(),
      qBreakpoints = qHeights.map(function (height, index, arr) {
        return arr.slice(0, index + 1).reduce(function (a, b) {
          return a + b;
        }, offsetTop);
      }),
      currentActiveQ = 0,
      nextActiveQ = 0,
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
        // if ($questions.eq(currentActiveQ).find('textarea').val()) {
        //   $questions.eq(currentActiveQ).find('button').show();
        // }
        updateProgress()
      },
      scrollHandler = function (e) {
        nextActiveQ = qBreakpoints.findIndex(function (breakpoint) {
          return $(document).scrollTop() < breakpoint;
        })
        if (currentActiveQ !== nextActiveQ)  {
          changeActiveQ(nextActiveQ);
        }
      }
      scrollToQ = function ($question) {
        changeActiveQ($questions.index($question))
        $(document).off('scroll', scrollHandler);  // turn off scroll listener while animating
        $('html, body').animate(
          { scrollTop: $question.offset().top - (currentActiveQ > 0 ? Math.min(offsetTop, qHeights[currentActiveQ - 1]) : offsetTop).toString() + 'px' },
          200,
          function () {
            $(document).on('scroll', scrollHandler);
          }
        );
      };

  if ($questions.length && $('body').hasClass('contributions edit')) {
    // remove duplicate form input depending on screen size
    $('#submission-form .linkedin-container:not(:visible)').remove();

    // add the first breakpoint
    qBreakpoints.unshift(offsetTop);

    // monitor scrolling and adjust active question as necessary
    $(document).on('scroll', scrollHandler);

    // update the progress bar
    updateProgress();
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

  if (CSP.screenSize === 'xs') {
    $questions.each(function () {
      $(this).find('textarea').on('blur', function () {
         $('#submission-progress').show();
      });
    });
  }

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

  $('#submission-form [name="contribution[publish_contributor]"]').on('change', function () {
    if ($(this).prop('checked')) {
      $('[name="contribution[publish_contributor]"][type="checkbox"]').not($(this)).prop('checked', true);
    } else {
      $('[name="contribution[publish_contributor]"][type="checkbox"]').not($(this)).prop('checked', false);
    }
  })

}