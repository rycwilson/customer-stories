
function successDetailsListeners () {

  var defaultViewHeight = "150px",  // win story expand / collapse
      summernoteToolbarHeight = 41.3,
      summernoteResizebarHeight = 8,
      winStoryLabelHeight = 23,
      customer,
      winStory,
      contributionsData,  // data returned when the child row is opened; includes invitation templates, questions and answers
      customerPath = function (customerId) { return '/customers/' + customerId; },
      successPath = function (successId) { return '/successes/' + successId; },
      contributionsDataPath = function (successId) { return '/successes/' + successId + '/contributions'; },
      expandedViewHeight = function ($tr, editorIsOpen) {
        // factor in height of the summernote toolbar
        return window.innerHeight - ((editorIsOpen ? summernoteToolbarHeight : 0) + $tr.height() + $tr.next().height() - $('#win-story-editor').height());
      },
      placeholderDropdown = function (customerId) {
        return function (context) {
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
                              customerId: customerId,
                              contributionsData: contributionsData
                            }),
                  callback: function ($dropdown) {
                    $dropdown.find('li').each(function () {
                      $(this).on('click', function () {
                        context.invoke('editor.restoreRange');   // restore cursor position
                        context.invoke('editor.pasteHTML', $(this).data('placeholder'))
                        context.invoke('editor.saveRange');  // save cursor position
                      });
                    });
                  }
                })
              ]);
          return button.render();   // return button as jquery object
        }
      },
      initWinStoryEditor = function ($tr, height, callback) {
        // console.log('initWinStoryEditor() height', height)
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
              ['customButton', ['placeholderDropdown']],
              ['view', ['codeview']],
            ],
            buttons: {
              placeholderDropdown: placeholderDropdown($tr.data('customer-id'))
            },
            callbacks: {
              // without this, insertion of a new line doesn't trigger input; critical for inserting placeholders
              onInit: function (summernote) {
                // console.log('summernote', summernote)
                // unable to set this via stylesheets due to dynamic handling by summernote
                $('.note-editor .dropdown-menu.summernote-custom').css({
                  'max-height': 0.95 * $('.note-editable').last().outerHeight() + 'px',
                  'max-width': 0.95 * $('.note-editable').last().outerWidth() + 'px'
                });
                summernote.editable.on('click', function (e) {
                  summernote.note.summernote('saveRange');
                })
                callback();
              },
              onEnter: function () {
              },
              onFocus: function (e) {
              },
              onPaste: function () {
              },
              onChange: function (content) {
                $('form[id*="success-form"]')
                  .find('button[type="submit"]').prop('disabled', false);
                $('input[type="hidden"][name="success[win_story]"]')
                  .val(JSON.stringify(content));
              }
            }
          });
      },
      // get Q&A associated with a give question (group contribution) or contribution (individual contribution)
      getQandA = function ($placeholder) {
        var theQandA = [],
            // only one of these exist
            questionId = $placeholder.data('question-id'),
            contributionId = $placeholder.data('contribution-id');
        contributionsData.answers.filter(function (answer) {
          if (questionId) {
            return answer.contributor_question_id == questionId;
          } else if (contributionId) {
            return answer.contribution_id == contributionId
          }
        })
          .forEach(function (answer) {
            theQandA.push({
              question: contributionsData.questions.find(function (q) {
                          return q.id === answer.contributor_question_id;
                        }).question,
              answer: answer.answer
            })
          });
        return theQandA;
      },
      populatePlaceholders = function () {
        var $placeholder = $(this),
            dtContributors = $('#prospect-contributors-table').DataTable()
        // customer logo
        $('#win-story-editor').find('.placeholder.customer-logo').each(function () {
          var $placeholder = $(this);
          $placeholder.replaceWith(
            _.template($('#win-story-customer-logo-template').html())({
              customer: customer,
              placeholder: _.escape($placeholder.wrap('<p/>').parent().html()),
              className: $placeholder.attr('class').replace('placeholder', '')
            })
          );
        });
        // customer description
        $('#win-story-editor').find('.placeholder.customer-description').each(function () {
          var $placeholder = $(this);
          $placeholder.replaceWith(
            '<p class="customer-description" data-placeholder="' + _.escape($placeholder.wrap('<p/>').parent().html()) + '">' +
              customer.description +
            '</p>'
          );
        });
        // group contributions
        $('#win-story-editor').find('.placeholder[data-question-id]').each(function () {
          var $placeholder = $(this),
              questionId = $placeholder.data('question-id');
          $placeholder.replaceWith(
            _.template($('#group-contribution-template').html())({
              questionId: questionId,
              contributor: contributor,
              qAndA: getQandA($placeholder),
              placeholder: _.escape($placeholder.wrap('<p/>').parent().html())
            })
          );
        })
        // individual contributions
        $('#win-story-editor').find('.placeholder[data-contribution-id]').each(function () {
          var $placeholder = $(this),
              contributionId = $placeholder.data('contribution-id'),
              contributor = dtContributors.rows('[data-contribution-id="' + contributionId + '"]')
                                          .data()[0]
                                          .contributor;
          $placeholder.replaceWith(
            _.template($('#individual-contribution-template').html())({
              contributionId: contributionId,
              contributor: contributor,
              qAndA: getQandA($placeholder),
              placeholder: _.escape($placeholder.wrap('<p/>').parent().html())
            })
          );
        })
      },
      depopulatePlaceholders = function () {
        $('.note-editable')
          .find('.customer-logo, .customer-description, [data-contribution-id], [data-question-id]')
          .each(function () {
            $(this).replaceWith(_.unescape($(this).data('placeholder')));
          });
      },
      renderWinStory = function () {
        if (winStory) {  // might be null or blank => will cause JSON error
          $('#win-story-editor').html(JSON.parse(winStory))
          $('input[type="hidden"][name="success[win_story]"]').val(winStory)
          populatePlaceholders()
        }
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
          $.when(
            $('#edit-customer-modal .modal-body').append(
              _.template($('#customer-form-template').html())({
                customer: customer
              })
            )
          ).done(function () { initS3Upload(true) })
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
          expandView ? expandedViewHeight($tr, true) : parseInt(defaultViewHeight, 10) - (summernoteToolbarHeight + summernoteResizebarHeight),
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
        initWinStoryEditor(
          $tr,
          expandedViewHeight($tr, true),
          depopulatePlaceholders
        );
      } else {
        // can't use .note-editor height because it will be 0
        // why do I need to do the .last thing for win story??
        $('#win-story-editor')
          .css('height', isExpandedView ? (parseInt($('.form-group.win-story').last().css('height'), 10) - winStoryLabelHeight).toString() + 'px' : defaultViewHeight)
          .prop('contenteditable', false)
          .summernote('destroy')
        populatePlaceholders();
        window.scrollTo(0, $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2));
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

    // remove the templated form
    .on('hidden.bs.modal', '#edit-customer-modal', function () {
      $(this).find('.modal-body').empty();
    })

    // on file upload, the customer name will get removed by jasny js => replace it
    .on('change.bs.fileinput', '#customer-form .fileinput', function (e) {
      var customerName = $(this).find('.fileinput-new .customer-name').text().trim(),
          showName = $(this).find('input[type="checkbox"][name="customer[show_name_with_logo]"]')
                            .prop('checked');
      // execute on file upload only
      if ($(e.target).is(':not([type="checkbox"])')) {
        $(this)
          .find('.fileinput-preview')
          .append(
            '<div class="customer-name" style="line-height: 18px !important; ' + (showName ? '' : 'display:none') +  '">' +
              '<span>' + customerName + '</span>' +
            '</div>'
          )
      }
    })
    .on('change', '.customer-logo input[name*="show_name_with_logo"]', function () {
      $(this).closest('.customer-logo').find('.customer-name').toggle();
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
            customer = res1[0].customer;
            winStory = res1[0].win_story;
            contributionsData = res2[0].contributions_data;
            // console.log('winStory', winStory);
            // console.log('contributionsData', contributionsData);
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

  // https://github.com/summernote/summernote/issues/702
  // function pasteHtmlAtCaret(html) {
  //   var sel, range;
  //   if (window.getSelection) {
  //       // IE9 and non-IE
  //       sel = window.getSelection();
  //       if (sel.getRangeAt && sel.rangeCount) {
  //           range = sel.getRangeAt(0);
  //           range.deleteContents();

  //           // Range.createContextualFragment() would be useful here but is
  //           // only relatively recently standardized and is not supported in
  //           // some browsers (IE9, for one)
  //           var el = document.createElement("div");
  //           el.innerHTML = html;
  //           var frag = document.createDocumentFragment(), node, lastNode;
  //           while ( (node = el.firstChild) ) {
  //               lastNode = frag.appendChild(node);
  //           }
  //           range.insertNode(frag);

  //           // Preserve the selection
  //           if (lastNode) {
  //               range = range.cloneRange();
  //               range.setStartAfter(lastNode);
  //               range.collapse(true);
  //               sel.removeAllRanges();
  //               sel.addRange(range);
  //           }
  //       }
  //   } else if (document.selection && document.selection.type != "Control") {
  //       // IE < 9
  //       document.selection.createRange().pasteHTML(html);
  //   }
  // }

}
