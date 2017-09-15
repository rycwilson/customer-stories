
function contributorQuestionsListeners () {

  $(document)
    .on('change', 'select.contributor-questions', function (e) {

      var $newQuestion, $select = $(this),
          questionId = $select.select2('data')[0].id,
          questionText = $select.select2('data')[0].text,
          currentIndex = $('.contributor-questions').find('li').length,
          template = _.template($('#new-contributor-question-template').html()),
          scrollToQuestion = function ($question) {
            // scroll down if the new question falls below window...
            var bottomOffset = $question.offset().top + $question.height();
            if (bottomOffset > $(window).height()) {
              $('html, body').animate({
                scrollTop: (bottomOffset - $(window).height()) + ($(window).height() / 2)
              }, 400);
            }
          };
      // reset select to placeholder
      $select.val('').trigger('change.select2');
      // create new question
      if (questionId === '0') {
        $.when(
          $('.contributor-questions ul').append(
            template({ company: app.company, index: currentIndex, existingQuestion: null })
          )
        ).then(function () {
          $newQuestion = $('.contributor-questions li').last();
          scrollToQuestion($newQuestion);
          // ref: https://stackoverflow.com/questions/8380759 (2nd answer)
          setTimeout(function () { $newQuestion.find('textarea')[0].focus(); }, 0);
        });
      // add existing question
      } else {
        $.when(
          $('.contributor-questions ul').append(
            template(
              { company: app.company, index: currentIndex,
                existingQuestion: { id: questionId, question: questionText } }
            )
          )
        ).then(function () {
          // disable the selected question option
          $select.find('option[value="' + questionId + '"]').prop('disabled', true);
          // re-init select2 for disabled option to take effect
          $select.select2('destroy')
                 .select2({ theme: 'bootstrap', placeholder: 'Add a Question' });
          $newQuestion = $('.contributor-questions li').last();
          scrollToQuestion($newQuestion);
        });
      }
    })

    .on('click', '.contributor-question .remove-question', function () {
      var $question = $(this).closest('.contributor-question');
      $question.addClass('to-be-removed');
      $question.find('.save-or-cancel').removeClass('hidden');
      $question.find('input[type="checkbox"]').prop('checked', true);  // _destroy checkbox
    })

    .on('click', '.contributor-question.to-be-removed .cancel, ' +
                 '.contributor-question.to-be-removed .remove-question', function () {
      var $question = $(this).closest('.contributor-question');
      $question.removeClass('to-be-removed');
      $question.find('input[type="checkbox"]').prop('checked', false);  // _destroy checkbox
      $question.find('.save-or-cancel').addClass('hidden');
    })

    .on('click', '.contributor-question.new-question .cancel', function () {
      var $select = $('select.contributor-questions'),
          $question = $(this).closest('li.new-question'),
          questionId = $question.find('input[type="hidden"]:last-of-type').val();

      // enable the question option
      $select.find('option[value="' + questionId + '"]').prop('disabled', false);
      // re-init select2 for property change to take effect
      $select.select2('destroy')
             .select2({ theme: 'bootstrap', placeholder: 'Add a Question' });
      $question.remove();
    });

}