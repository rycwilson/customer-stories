
function crowdsourcingTemplatesListeners () {

  $(document)

    .on('click', 'a.new-template', function () {

      $.ajax({
        url: '/companies/' + app.company.id + '/crowdsourcing_templates/new',
        method: 'get',
        dataType: 'html',
        success: function (html, status, xhr) {
          $.when( $('#crowdsourcing-template-container').empty().append(html) )
            .then(function () {
              initEmailRequestEditor();
              $('select.contributor-questions')
                // .prepend('<option selected/>')  // empty option for placeholder
                .select2({
                  theme: 'bootstrap',
                  placeholder: 'Add a question'
                });
            });
        }
      });
    })

    .on('change', 'select[name="template[name]"]', function () {
      /*
        This event will get triggered by a re-populating of the select options,
        such as happens when all templates are restored to default.
        When this happens, if no template has been loaded, do not send a GET
      */
      if ($(this).val() === null)
        return false;

      var initTemplate = function () {
        initEmailRequestEditor();
        $('select.contributor-questions')
          // .prepend('<option selected/>')  // empty option for placeholder
          .select2({
            theme: 'bootstrap',
            placeholder: 'Add a question'
          });
      };

      var enableActions = function () {
        $('#template-actions-dropdown .copy-template, ' +
          '#template-actions-dropdown .test-template, ' +
          '#template-actions-dropdown .delete-template')
            .each(function () { $(this).parent().removeClass('disabled'); });
      };

      $.ajax({
        url: '/companies/' + app.company.id +
                '/crowdsourcing_templates/' + $(this).val() + '/edit',
        method: 'get',
        dataType: 'html',
        success: function (html, status, xhr) {
          $.when( $('#crowdsourcing-template-container').empty().append(html) )
            .then(function () {
              initTemplate();
              enableActions();
            });
        }
      });

    })

    .on('change', 'select.contributor-questions', function (e) {
      var $newQuestion,
          questionId = $(this).select2('data')[0].id,
          questionText = $(this).select2('data')[0].text,
          currentIndex = $('.contributor-questions').find('li').length.toString(),
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
      $(this).val('').trigger('change.select2');
      // create new question
      if (questionId === '0') {
        $.when(
          $('.contributor-questions ul').append(
            template({ company: app.company, index: currentIndex, existingQuestion: null })
          )
        ).then(function () {
          $newQuestion = $('.contributor-questions li').last();
          scrollToQuestion($newQuestion);
          $newQuestion.find('textarea')[0].focus();
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
      $(this).closest('li.new-question').remove();
    })

    .on('submit', '#crowdsourcing-template-form', function () {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    })



    // load selected email template for editing
    // .on('change', '.templates-select', function () {
    //   /*
    //     This event will get triggered by a re-populating of the select options,
    //     such as happens when all templates are restored to default.
    //     When this happens, if no template has been loaded, do not send a GET
    //   */
    //   if ($(this).val() === null)
    //     return false;

    //   $.get('/email_templates/' + $(this).val(), function (data, status, xhr) {
    //     // enable the editor
    //     $('.note-editable').attr('contenteditable', 'true');
    //     $('#template_subject').val(data.subject);
    //     $('.note-editable').html(data.body);
    //     $('#email-templates-form').attr('action', '/email_templates/' + data.id);
    //     $('.note-editable').trigger('loadTemplate');
    //   });
    // })

    .on('loadTemplate', '.note-editable', function () {
      // show the editor
      // $(this).closest('form-group')
      // restore this template
      $('#restore-current-template').parent().removeClass('disabled');
      // test template
      $('#test-template').prop('disabled', false);
      // save
      $(this).closest('form').find('[type=submit]').prop('disabled', true);
      // cancel
      $('#cancel-template').prop('disabled', true);
    })

    /*
      Detect changes in template editor (subject or body)
    */
    .on('input summernote.change',
                   '#template_subject, #email-template-editor', function () {
      // textarea responds to .text(); text field responds to .val()
      if ($(this).text().length > 0 || $(this).val().length > 0) {
        $('#save-template').prop('disabled', false);
        $('#test-template').prop('disabled', false);
        $('#cancel-template').prop('disabled', false);
      } else {
        $('#save-template').prop('disabled', true);
        $('#test-template').prop('disabled', true);
        // cancel stays active once a change is made
      }
    })

    .on('click', '#restore-current-template', function () {
      if ($(this).parent().hasClass('disabled'))
        return false;

      var $a = $(this);
      $.ajax({
        url: '/email_templates/' +
                $('#email-templates-form').find('select:first').val(),
        method: 'put',
        data: { 'restore': true },
        success: function (data, status, xhr) {
          $('#template-subject').text(data.template.subject);
          $('.note-editable').html(data.template.body);
          $a.closest('form').find('[type=submit]').prop('disabled', true);
          $('#cancel-template').prop('disabled', true);
          flashDisplay(data.flash, 'success');
        }
      });
    })

    .on('click', '#restore-all-templates', function () {
      var templateId = $('#email-templates-form').find('select:first').val(),
          newOptions = "",
          responseTemplateId;
      if (templateId === "")
        templateId = 0;
      $.ajax({
        url: '/email_templates/' + templateId,
        method: 'put',
        data: { 'restore_all': true },
        success: function (data, status, xhr) {
          // if no loaded template when request was made,
          // a null current_template is returned
          responseTemplateId = (data.current_template || { id: 0 }).id;
          data.templates_select.forEach(function (option, index) {
            // if this is the first option AND no template was loaded,
            // first option to allow for placeholder
            if (index === 0 && responseTemplateId === 0) {
              newOptions += "<option value></option>";
            } else if (option[1] === responseTemplateId) {
              newOptions += "<option selected='selected' value='" + option[1] + "'>" + option[0] + "</option>";
            } else {
              newOptions += "<option value='" + option[1] + "'>" + option[0] + "</option>";
            }
          });
          // select2 doesn't currently support wholesale replacement of options;
          // here's a workaround:
          // (https://github.com/select2/select2/issues/2830#issuecomment-74971872)
          $('.templates-select').html(newOptions).change();
          flashDisplay(data.flash, 'success');
        }
      });
    })

    .on('click', '#test-template', function () {
      // don't use .serialize() or it will send a PUT request
      // (not that it really matters what kind of request it is - POST or PUT is fine)
      var data = {
        subject: $('#template_subject').val(),
           body: $('.note-editable').html()
      };
      $.post(
          '/email_templates/' + $('.templates-select').val() + '/test',
          data,
          function (data, status) {
            flashDisplay(data.flash, 'info');
          }
      );
    })

    .on('click', '#cancel-template', function () {
      $('.templates-select').trigger('change');
    });

}