
function successDetailsListeners () {

  var defaultViewHeight = "150px",  // win story expand / collapse
      contributionsData,  // data returned when the child row is opened; includes invitation templates, questions and answers
      winStory,  // success.description
      customerPath = function (customerId) { return '/customers/' + customerId; },
      successPath = function (successId) { return '/successes/' + successId; },
      contributionsDataPath = function (successId) { return '/successes/' + successId + '/contributions'; },
      expandedViewHeight = function ($tr, editorIsOpen) {
        // factor in height of the summernote toolbar
        return window.innerHeight - ((editorIsOpen ? 41.3 : 0) + $tr.height() + $tr.next().height() - $('#win-story-editor').height());
      },
      placeholderDropdown = function (context) {
        var ui = $.summernote.ui,
            button = ui.buttonGroup([
              ui.button({
                className: 'btn btn-default dropdown-toggle',
                data: {
                  toggle: 'dropdown',
                  placement: 'top'
                },
                contents: 'Insert Placeholder\xa0\xa0<span class="caret"></span>',
                // tooltip: 'Insert a data placeholder'
              }),
              ui.dropdown({
                className: 'summernote-custom dropdown-menu-right',
                contents: _.template($('#win-story-placeholders-dropdown-template').html())({
                            // customer:
                            contributionsData: contributionsData
                          }),
                callback: function ($dropdown) {
                  $dropdown.find('li').each(function () {
                    $(this).on('click', function () {
                      context.invoke('editor.saveRange');
                      context.invoke('editor.pasteHTML', $(this).data('placeholder'));
                      context.invoke('editor.restoreRange');
                      $('.success-form').trigger('input');  // enable Save button
                    });
                  });
                }
              })
            ]);
        return button.render();   // return button as jquery object
      },
      initWinStoryEditor = function ($tr, height, callback) {
        console.log('initWinStoryEditor() height', height)
        // use contenteditable instead of textarea because html can't be renderd in textarea
        $('#win-story-editor')
          .prop('contenteditable', true)
          .summernote({
            height: height,// expandedViewHeight($tr, true),
            dialogsInBody: true,
            focus: true,
            toolbar: [
              ['font', ['bold', 'italic', 'underline']], //, 'clear']],
              ['para', ['ul', 'ol', 'paragraph']],
              ['customButton', ['placeholderDropdown']]
            ],
            buttons: {
              placeholderDropdown: placeholderDropdown
            },
            callbacks: {
              onInit: function() {
                // unable to set this via stylesheets due to dynamic handling by summernote
                $('.note-editor .dropdown-menu.summernote-custom').css({
                  'max-height': 0.95 * $('.note-editable').last().outerHeight() + 'px',
                  'max-width': 0.95 * $('.note-editable').last().outerWidth() + 'px'
                });
                callback();
              }
            }
          });
      },
      populatePlaceholders = function () {
        var dtContributors = $('#prospect-contributors-table').DataTable();
        $('#win-story-editor').find('[data-contribution-id]').each(function () {
          var contributionId = $(this).data('contribution-id'),
              contributor = dtContributors.rows('[data-contribution-id="' + contributionId + '"]')
                                          .data()[0]
                                          .contributor,
              qAndA = [];

          // set the Q&A for this contribution
          contributionsData.answers.filter(function (answer) {
            return answer.contribution_id == contributionId;
          })
            .forEach(function (answer) {
              qAndA.push({
                question: contributionsData.questions.find(function (q) {
                            return q.id === answer.contributor_question_id;
                          }).question,
                answer: answer.answer
              })
            });
          $(this).replaceWith(
            _.template($('#individual-contribution-template').html())({
              contributionId: contributionId,
              contributor: contributor,
              qAndA: qAndA
            })
          );

        })
      },
      depopulatePlaceholders = function () {
        var dtContributors = $('#prospect-contributors-table').DataTable();
        $('.note-editable').find('[data-contribution-id]').each(function () {
          var contributionId = $(this).data('contribution-id'),
              contributor = dtContributors.rows('[data-contribution-id="' + contributionId + '"]').data()[0].contributor;
          $(this).replaceWith(
            '<div data-contribution-id="' + contributionId + '" contenteditable="false">' +
              '[Individual Contribution: ' + contributor.full_name + ']' +
            '</div>'
          )
        });
      }
      renderWinStory = function () {
        $('#win-story-editor').html(_.unescape(winStory))
        populatePlaceholders()

      };

  $(document)

    .on('click', 'button[data-target="#edit-customer-modal"]', function (e) {
      // clicking a row group will normally sort alphabetically; prevent this
      e.stopImmediatePropagation();
      $.ajax({
        url: customerPath($(this).data('customer-id')),
        method: 'get',
        dataType: 'json'
      })
        .done(function (customer, status, xhr) {
          $('#edit-customer-modal .modal-body').append(
            _.template($('#customer-form-template').html())({
              customer: customer
            })
          )
        })
    })

    .on('click', '.win-story-actions__expand', function (e, isEditClick) {
      var $tr = $('tr.shown'),
          $trChild = $tr.next(),
          expandView = !$('#win-story-editor').hasClass('expanded'),
          editorIsOpen = $('#win-story-editor[contenteditable="true"]').length;

      // the only way to resize with the editor open is to destroy and reinit
      // (but don't proceed if this is an automatic expansion due to clicking Edit button)
      if (editorIsOpen && !isEditClick) {
        $('#win-story-editor').summernote('destroy')
        initWinStoryEditor(
          $tr,
          expandView ? expandedViewHeight($tr, true) : parseInt(defaultViewHeight, 10),
          depopulatePlaceholders
        )
      } else {
        $('#win-story-editor').css(
          'height',
          expandView ? expandedViewHeight($tr, editorIsOpen) : defaultViewHeight
        );
      }

      // center
      window.scrollTo(0, $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2));
      $('#win-story-editor').toggleClass('expanded');
      $(this).find('i').toggle();
      $(this)[0].blur();
    })

    .on('click', '.win-story-actions__edit', function () {
      var $tr = $('tr.shown'),
          $trChild = $tr.next(),
          $expandBtn = $('.win-story-actions__expand'),
          isExpandedView = $('#win-story-editor').hasClass('expanded'),
          initEditor = typeof $('#win-story-editor').data('summernote') !== 'object';
      if (initEditor) {
        initWinStoryEditor($tr, expandedViewHeight($tr, true), depopulatePlaceholders);
      } else {
        // can't use .note-editor height because it will be 0
        $('#win-story-editor').css('height', $('.form-group.win-story').css('height'))
                              .prop('contenteditable', false)
                              .summernote('destroy')
        populatePlaceholders();
      }
      if (initEditor && !isExpandedView) {
        $expandBtn.trigger('click', [{ editClick: true }])
      }
      $(this).find('i, span').toggle();
      $(this)[0].blur();
    })

    .on('click', '.customer-logo .upload-image', function () {
      var $previewImg = $(this).closest('.fileinput').find('.fileinput-preview img');
      if ($previewImg.attr('src')) {
        // click on the preview
        $(this).closest('.fileinput').find('.thumbnail')[1].click();
      } else {
        // click on the placeholder
        $(this).closest('.fileinput').find('.thumbnail')[0].click();
      }
    })

    .on('hidden.bs.modal', '#edit-customer-modal', function () {
      $(this).find('.modal-body').empty();
    })

    .on('input', '#win-story-editor + .note-editor > .note-editing-area > .note-editable', function (e) {
      $('input[type="hidden"][name="success[description]"]').val(_.escape($(this).html()));
    })

    .on('click', 'td.success-details', function () {
      var $table = $(this).closest('table'),
          $tr = $(this).closest('tr'),
          $trChild,
          dt = $table.DataTable(),
          dtRow = dt.row($tr),
          successId = $tr.data('success-id'),
          success = dt.row($tr).data();

      $(this).children().toggle();  // toggle caret icons

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.removeClass('shown active');
      }
      else {
        $.when(
          $.ajax({
            url: successPath(successId),
            method: 'get',
            dataType: 'json'
          }),
          $.ajax({
            url: contributionsDataPath(successId),
            method: 'get',
            data: {
              win_story: true
            },
            dataType: 'json'
          })
        )
          .done(function (res1, res2) {
            winStory = res1[0].success.win_story
            contributionsData = res2[0].contributions_data
            console.log('winStory', winStory);
            console.log('contributionsData', contributionsData);
            renderWinStory();
          })

        // why doesn't this work? it's the same thing! or is it...
        // $.when(getWinStory(successId), getContributionsData(successId))
        //   .done(function (data1, data2) {
        //     console.log('data1', data1)
        //     console.log('data2', data2)
        //     console.log('winStory', winStory);
        //     console.log('contributionsData', contributionsData);
        //     renderWinStory()
        //   })

        dtRow.child(
          _.template($('#success-details-template').html())({
            success: success,
            successPath: successPath(successId)
          })
        ).show();
        $trChild = $tr.next();
        $tr.addClass('shown active');

        // close other open child rows
        $table.find('tr[data-success-id]').not($tr).each(function () {
          if (dt.row($(this)).child.isShown()) {
            dt.row($(this)).child.hide();
            $(this).removeClass('shown active');
            $(this).children('td.success-details').children().toggle();
          }
        });

        // scroll to center
        window.scrollTo(0, $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2));

        // enable Save button on input
        $tr.next().one('input', function (e) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        });

      }

    })

    // scroll boundaries
    .on('wheel', '#win-story-editor, .note-editable, .dropdown-menu.summernote-custom', function (e) {
      var maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
      // If this event looks like it will scroll beyond the bounds of the element,
      // prevent it and set the scroll to the boundary manually
      if ($(this).prop('scrollTop') + e.originalEvent.deltaY < 0 ||
          $(this).prop('scrollTop') + e.originalEvent.deltaY > maxY) {
        e.preventDefault();
        $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + e.originalEvent.deltaY)));
      }
    });
}
