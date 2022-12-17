
function successChildRowListeners () {

  var $form,    // the active success form, assigned when a child row is opened
      $editor,  // the active $('#win-story-editor'), assigned when a child row is opened
      contributionsData,  // invitation templates, questions and answers associated with active success
      defaultViewHeight = "200px",  // win story expand / collapse
      summernoteToolbarHeight = 41.3,
      summernoteResizebarHeight = 8,
      winStoryHeaderHeight = 23,
      submitButtonHeight = 45,
      customButtonHelpPopoverContent = "You can insert contributions in their original form or with a placeholder. The latter is useful for organizing your document while in Edit mode, but will preclude any changes to the underlying content. Toggle to the View mode to see the populated/saved content.",
      winStory, winStoryText, winStoryCompleted,
      winStoryRecipientsSelectOptions,
      successPath = function (successId) { return '/successes/' + successId; },
      expandedViewHeight = function ($tr, isEditMode) {
        var totalHeight = window.innerHeight,  // the total height available
            childRowPadding = parseInt($('tr.shown').next().children().css('padding-top'), 10) +
                              parseInt($('tr.shown').next().children().css('padding-bottom'), 10),
            reservedHeight = $tr.height() + childRowPadding + winStoryHeaderHeight + submitButtonHeight +
                             (isEditMode ? summernoteToolbarHeight + summernoteResizebarHeight : 0);
        return totalHeight - reservedHeight;
      },
      collapsedViewHeight = function () {
        return parseInt(defaultViewHeight, 10) - (summernoteToolbarHeight + summernoteResizebarHeight);
      }
      individualContributionTemplate = function (contributionId, contributionsData, $placeholder) {
        return _.template($('#individual-contribution-template').html())({
          placeholder: $placeholder ? _.escape($placeholder.wrap('<p/>').parent().html()) : null,
          contributionId: contributionId,
          contributor: getContributor(contributionId),
          theQandA: contributionsData.answers.filter(function (a) {
                      return a.contribution_id == contributionId;
                    })
                      .map(function (a) {
                        return {
                          question: contributionsData.questions.find(function (q) {
                                      return q.id === a.contributor_question_id;
                                    }).question,
                          answer: a.answer
                        };
                      })
        });
      },
      groupContributionTemplate = function (questionId, contributionsData, $placeholder) {
        return _.template($('#group-contribution-template').html())({
          placeholder: $placeholder ? _.escape($placeholder.wrap('<p/>').parent().html()) : null,
          question: contributionsData.questions.filter(function (q) {
                      return q.id == questionId;
                    })[0],
          answers: contributionsData.answers.filter(function (a) {
                     return a.contributor_question_id == questionId;
                   })
                     .map(function (a) {
                       return {
                         answer: a.answer,
                         contributor: getContributor(a.contribution_id)
                       }
                     })
        });
      },
      noteInsertionDropdownTemplate = function (customerId, contributionsData, type) {
        return _.template($('#note-insertion-dropdown-template').html())({
                  customerId: customerId,
                  contributionsData: contributionsData,
                  type: type
                });
      },
      noteInsertionDropdown = function (customerId, contributionsData, type) {
        return function (context) {
          var $editor = $('#win-story-editor'),
              ui = $.summernote.ui,
              button = ui.buttonGroup([
                ui.button({
                  className: 'btn btn-default dropdown-toggle\xa0' + type,
                  data: {
                    toggle: 'dropdown',
                    placement: 'top'
                  },
                  contents: (type === 'contributions' ? 'Contributions\xa0\xa0' : 'Placeholders\xa0\xa0') + '<span class="caret"></span>',
                  // tooltip: 'Insert a data placeholder'
                }),
                ui.dropdown({
                  className: 'summernote-custom dropdown-menu-right\xa0' + type,
                  contents: noteInsertionDropdownTemplate(customerId, contributionsData, type),
                  callback: function ($dropdown) {
                    $dropdown.find('li').each(function () {
                      $(this).on('click', function () {
                        var pasteHtml,  
                            isContributionsDropdown = $dropdown.hasClass('contributions'),
                            isPlaceholdersDropdown = $(this).data('placeholder');
                        if (isContributionsDropdown && $(this).data('contribution-id')) {
                          pasteHtml = individualContributionTemplate(
                                        $(this).data('contribution-id'),
                                        contributionsData,
                                        null
                                      );
                        } else if (isContributionsDropdown && $(this).data('question-id')) {
                          pasteHtml = groupContributionTemplate(
                                        $(this).data('question-id'),
                                        contributionsData,
                                        null
                                      );
                        } else if (isPlaceholdersDropdown) {
                          pasteHtml = $(this).data('placeholder');
                        }
                        $editor.summernote('restoreRange');   // restore cursor position
                        $editor.summernote('pasteHTML', pasteHtml)
                        $editor.summernote('saveRange');  // save cursor position
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
            // dialogsInBody: true,
            focus: true,
            toolbar: [
              ['font', ['bold', 'italic', 'underline']], //, 'clear']],
              ['para', ['ul', 'ol', 'paragraph']],
              ['customButton', ['contributionsDropdown', 'placeholdersDropdown']],
              // code editor is handy in development
              // ['view', <%= Rails.env.development? ? ['codeview'] : [] %>],
            ],
            buttons: {
              contributionsDropdown: noteInsertionDropdown($tr.data('customer-id'), contributionsData, 'contributions'),
              placeholdersDropdown: noteInsertionDropdown($tr.data('customer-id'), contributionsData, 'placeholders')
            },
            callbacks: {
              // without this, insertion of a new line doesn't trigger input; critical for inserting placeholders
              onInit: function (summernote) {
                // console.log('summernote', summernote)
                // unable to set this via stylesheets due to dynamic handling by summernote
                $('.note-editor .dropdown-menu.summernote-custom').css({
                  'max-height': 0.95 * $('.note-editable').last().outerHeight() + 'px',
                  'max-width': 0.9 * $('.note-editable').last().outerWidth() + 'px'
                });
                summernote.editable.on('click', function (e) {
                  summernote.note.summernote('saveRange');
                })
                callback();
              },
              onEnter: function (e) {
                // $(this).summernote('pasteHTML', '<br></br>');
                // e.preventDefault();
              },
              onFocus: function (e) {
              },
              onPaste: function () {
              },
              onChange: function (content) {
                $form.find('button[type="submit"]').prop('disabled', false);
              }
            }
          });
      },
      initWinStoryEmailEditor = function () {
        $('#win-story-email-editor')
          .summernote({
            // focus: true,
            toolbar: [
              ['font', ['bold', 'italic', 'underline']], //, 'clear']],
              ['para', ['ul', 'ol', 'paragraph']],
            ],
            callbacks: {
              onInit: function (summernote) {
              },
              onChange: function (content) {
                // what to do with changes??
                // $('form[id*="success-form"]')
                //   .find('button[type="submit"]').prop('disabled', false);
                // $('input[type="hidden"][name="success[win_story_html]"]')
                //   // .val(JSON.stringify(content));
                //   .val(content);
              }
            }
          });
      }
      getContributor = function (contributionId) {
        return $('#prospect-contributors-table')
                  .DataTable()
                  .rows('[data-contribution-id="' + contributionId + '"]')
                  .data()[0]
                  .contributor;
      },
      populatePlaceholders = function (html) {
        var $wrapper = $(html).wrapAll('<div class="wrapper"></div>').parent();
            dtContributors = $('#prospect-contributors-table').DataTable();

        // customer logo
        // $wrapper.find('.placeholder.customer-logo').each(function () {
        //   var $placeholder = $(this);
        //   $placeholder.replaceWith(
        //     _.template($('#win-story-customer-logo-template').html())({
        //       customer: customer,
        //       placeholder: _.escape($placeholder.wrap('<p/>').parent().html()),
        //       className: $placeholder.attr('class').replace('placeholder', '')
        //     })
        //   );
        // });

        // customer description
        // $wrapper.find('.placeholder.customer-description').each(function () {
        //   var $placeholder = $(this);
        //   $placeholder.replaceWith(
        //     '<p class="customer-description" data-placeholder="' + _.escape($placeholder.wrap('<p/>').parent().html()) + '">' +
        //       customer.description +
        //     '</p>'
        //   );
        // });

        // group contributions
        $wrapper.find('.placeholder[data-question-id]').each(function () {
          var $placeholder = $(this),
              questionId = $placeholder.data('question-id');
          $placeholder.replaceWith(
            groupContributionTemplate(questionId, contributionsData, $placeholder)
          );
        })

        // individual contributions
        $wrapper.find('.placeholder[data-contribution-id]').each(function () {
          var $placeholder = $(this),
              contributionId = $placeholder.data('contribution-id');
          $placeholder.replaceWith(
            individualContributionTemplate(contributionId, contributionsData, $placeholder)
          );
        })

        return $wrapper.html();
      },
      depopulatePlaceholders = function () {
        $('.note-editable')
          .find('[data-placeholder]')
          .each(function () {
            $(this).replaceWith(_.unescape($(this).data('placeholder')));
          });
      },
      renderWinStory = function (winStory, winStoryCompleted) {
        if (winStory) {
          $editor.html(winStory);
          $form.find('input[name="success[win_story_completed]"]').val(winStoryCompleted);
          if (!winStoryCompleted) {
            $form.find('button[type="submit"]')
                 .prop('disabled', false)
                 .show();
          }

          // don't need this anymore
          // $form.find('input[type="checkbox"][name="success[win_story_completed]"]')
          //      .prop('checked', winStoryCompleted);

          // this doesn't need to happen until submitting the form...
          // $('input[type="hidden"][name="success[win_story_html]"]').val(winStory);
          // $('input[type="hidden"][name="success[win_story_text]"]').val(winStoryText);
        }
      },
      initWinStoryRecipientsSelect = function (selectOptions, invitationTemplates) {
        $('select[name="win_story_email[recipients]"]').select2({
          theme: "bootstrap",
          tags: true,
          data: selectOptions,
          placeholder: 'Add Recipients',
        });
        $('#win-story-email-modal #add-template-recipients').empty();
        invitationTemplates
          .filter(function (template) { return template.name !== 'Customer' })
          .forEach(function (template) {
            $('#win-story-email-modal #add-template-recipients').append(
              '<div>' +
                '<label>' +
                  '<input type="checkbox" value="' + template.id + '">' +
                  '<span>&nbsp;&nbsp;' + template.name + '</span>' +
                '</label>' +
              '</div>'
            )
          })
        $('[name="win_story_email[subject]').val($('tr.shown > td:nth-of-type(2)').text())
      };

  // conversion to markdown calls for removal of all whitespace and newlines
  // ref https://stackoverflow.com/questions/1539367
  jQuery.fn.htmlClean = function() {
    this.contents().filter(function() {
      if (this.nodeType != 3) {
        $(this).htmlClean();
        return false;
      } else {
        this.textContent = $.trim(this.textContent);
        return !/\S/.test(this.nodeValue);
      }
    }).remove();
    return this;
  }

  // initialize the win story email editor
  initWinStoryEmailEditor();

  $(document)

    .on('click', '[data-target="#add-template-recipients"]', function (e) {
      $(this).find('i').toggle();
    })

    .on('change', '#win-story-email-modal input[type="checkbox"]', function (e) {
      var dtContributors = $('#prospect-contributors-table').DataTable().rows().data().toArray(),
          templateId = $(this).val(),
          successId = $('tr.shown').data('success-id'),
          recipientIds = $('select[name="win_story_email[recipients]"]').val(),
          templateContributorIds = dtContributors.filter(function (contribution) {
                                     return contribution.invitation_template &&
                                            contribution.invitation_template.id == templateId &&
                                            contribution.success.id == successId;
                                   })
                                     .map(function (contribution) {
                                       return contribution.contributor.id.toString();  //  select2 wants a string
                                     })
      if ($(this).prop('checked')) {
        recipientIds = _.union(recipientIds, templateContributorIds)
      } else {
        recipientIds = _.difference(recipientIds, templateContributorIds)
      }
      $('select[name="win_story_email[recipients]"]').val(recipientIds).trigger('change.select2')
    })

    .on('click', '.win-story-actions__expand', function (e, isEditClick) {
      var $tr = $('tr.shown'),
          $trChild = $tr.next(),
          isCollapse = $('#win-story-editor').hasClass('expanded'),
          isExpansion = !isCollapse,
          isEditMode = typeof $('#win-story-editor').data('summernote') === 'object';

      // the only way to resize with the editor open is to destroy and reinit
      // (but don't proceed if this is an automatic expansion due to clicking Edit button)
      if (isEditMode && !isEditClick) {
        $('#win-story-editor').summernote('destroy')
        initWinStoryEditor(
          $tr,
          isExpansion ? expandedViewHeight($tr, true) : collapsedViewHeight(),
          function () {
            depopulatePlaceholders();
            $('.note-customButton').append(
              '<label class="insert-contributions">Insert</label><button type="button" class="help" data-toggle="popover"><i class="fa fa-fw fa-question-circle-o"></i></button>'
            );
            $('.note-customButton button.help').popover({
              container: 'body',
              trigger: 'focus',
              placement: 'left',
              content: customButtonHelpPopoverContent,
              template: '<div class="popover" style="min-width: 400px; role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>'
            });

            // some buttons we don't want active while editing
            $('.win-story-actions__copy').prop('disabled', true);
            $('.win-story-actions__zapier').prop('disabled', true);
          }
        )
      } else {
        $('#win-story-editor').css(
          'height',
          isExpansion ? expandedViewHeight($tr, isEditMode) : defaultViewHeight
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
          initEditor = typeof $('#win-story-editor').data('summernote') !== 'object',
          $submitBtn = $form.find('button[type="submit"]');

      if (initEditor) {
        initWinStoryEditor(
          $tr,
          expandedViewHeight($tr, true),
          function () {
            depopulatePlaceholders();
            $('.note-customButton').append(
              '<label class="insert-contributions">Insert</label><button type="button" class="help" data-toggle="popover"><i class="fa fa-fw fa-question-circle-o"></i></button>'
            );
            $('.note-customButton button.help').popover({
              container: 'body',
              trigger: 'focus',
              placement: 'left',
              content: customButtonHelpPopoverContent,
              template: '<div class="popover" style="min-width: 400px; role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>'
            });
            $('.win-story-actions__copy').prop('disabled', true);

            // $('.mark-completed').addClass('disabled');
            $submitBtn.prop('disabled', true)
                      .toggleClass('mark-completed save-changes')
                      .find('span.save-changes, span.mark-completed').toggle()
                        .end()
                      .show();

          }
        );

      } else {

        // save changes (if there are any)
        if ($submitBtn.prop('disabled')) {
          $submitBtn.toggleClass('mark-completed save-changes')
          $submitBtn.find('span.mark-completed, span.save-changes').toggle();
          if ($form.find('input[name="success[win_story_completed]"]').val() === 'true') {
            $submitBtn.hide();
          } else {
            $submitBtn.prop('disabled', false)
          }
        } else {
          $submitBtn.trigger('click');
        }

        // can't use .note-editor height because it will be 0
        // why do I need to do the .last thing for win story??
        $editor
          .css('height', isExpandedView ? (parseInt($('.form-group.win-story').last().css('height'), 10) - winStoryHeaderHeight).toString() + 'px' : defaultViewHeight)
          .prop('contenteditable', false)
          .summernote('destroy')  // note this doesn't return $editor => can't chain
        $editor.html( populatePlaceholders( $('#win-story-editor').html() ) );
        $('.win-story-actions__copy').prop('disabled', false);
        // $('.mark-completed').removeClass('disabled');

        // scroll to center
        window.scrollTo(0, $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2));
      }
      if (initEditor && !isExpandedView) {
        $expandBtn.trigger('click', [{ editClick: true }])
      }
      $(this).find('i, span').toggle();
      $(this)[0].blur();
    })

    .on('click', '.win-story-actions__email', function () {
      var isEditMode = typeof $('#win-story-editor').data('summernote') === 'object',
          winStoryHtml = isEditMode ? $editor.summernote('code') : $editor.html();
      $('#win-story-email-editor').summernote('code', winStoryHtml);
      $('#win-story-email-modal').modal('show');
    })

    .on('click', '.win-story-actions__copy', function () {
      var isEditMode = typeof $('#win-story-editor').data('summernote') === 'object',
          copyStr = isEditMode ? $editor.summernote('code') : $editor.html(),
          listener = function (e) {
            e.clipboardData.setData("text/html", copyStr);
            e.clipboardData.setData("text/plain", copyStr);
            e.preventDefault();
          };
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
    })

    // Catch Hook to Sheets: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
    // Catch Hook to Slack: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/

    .on('click', '#win-story-zapier-modal .slack button', function () {
      var successId = $('tr.shown').data('success-id'),
          webhookUrl = $(this).prev().val();

      $.ajax({
        url: successPath(successId),
        method: 'get',
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          // console.log(data)
          $.ajax({
            url: webhookUrl,
            method: 'post',
            data: {
              customer: {
                name: data.customer.name,
                description: data.customer.description,
                logo_url: data.customer.logo_url
              },
              win_story_html: data.win_story_html,
              win_story_text: data.win_story_text,
              win_story_markdown: data.win_story_markdown
            }
          })
            .done(function (data, status, xhr) {
              // console.log(data)
              // console.log(status)
              // console.log(xhr)
            })
        })
    })

    .on('click', '[id*="success-form-"] button[type="submit"]', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      // ignore if the button is disabled or has already been submitted
      if ($(this).hasClass('disabled') || $form.data('submitted')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }

      var isEditMode = typeof $editor.data('summernote') === "object",
          markedAsCompleted = !isEditMode,  // submitting from view mode = marking as completed
          winStoryHtml = isEditMode ?
                           populatePlaceholders($editor.summernote('code')) :
                           $editor.html(),
          $htmlInput = $form.find('input[type="hidden"][name="success[win_story_html]"]'),
          $textInput = $form.find('input[type="hidden"][name="success[win_story_text]"]'),
          $markdownInput = $form.find('input[type="hidden"][name="success[win_story_markdown]"]');

      // set hidden input fields
      $htmlInput.val(winStoryHtml);
      $textInput.val(
        $(winStoryHtml.replace(/<\/p>/g, "</p>\r\n"))    // add line breaks after paragraphs (summernote doesn't)
          .wrapAll('<div class="wrapper"></div>').parent()
          .text()
      );
      $markdownInput.val(
        $(winStoryHtml).wrapAll('<div class="wrapper"></div>').parent()
          .htmlClean()
          .html()
          .replace(/<i>/, " <i>")       // preserve spaces around italicized text (htmlClean will have removed)
          .replace(/<\/i>/, "<\/i> ")
      );

      if (markedAsCompleted) {
        $('input[name="success[win_story_completed]"]').val('true');
        $form.find('span.mark-completed, i.fa-spin').toggle();
      } else {
        $form.find('span.save-changes, i.fa-spin').toggle();
      }

      // disallow toggling either the child row or view/edit mode
      $('td.toggle-success-child').addClass('disabled');
      $('button.win-story-actions__edit').prop('disabled', true);

      $form.attr('data-submitted', 'true');
      $form.submit();
    })

    .on('click', 'button.edit-customer', editCustomer)

    .on('click', 'td.toggle-success-child', function () {
      var toggleButton = $(this),
          $table = $('#successes-table'),
          dt = $table.DataTable(),
          $tr = $(this).closest('tr'),
          $trChild,
          successId = $tr.data('success-id'),
          success = dt.row($tr).data(),
          childRowIsOpen = function () { return dt.row($tr).child.isShown(); },
          closeChildRow = function () {
            toggleButton.children().toggle();  // toggle caret icons
            dt.row($tr).child.hide();
            $tr.removeClass('shown active');
          };

      if (childRowIsOpen()) {
        var unsavedChanges = typeof $('#win-story-editor').data('summernote') === 'object' &&
                             !$form.find('button[type="submit"]').prop('disabled');
        if (unsavedChanges) {
          bootbox.confirm({
            size: 'small',
            className: 'confirm-unsaved-changes',
            closeButton: false,
            message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Unsaved changes will be lost</span>",
            buttons: {
              confirm: {
                label: 'Continue',
                className: 'btn-default'
              },
              cancel: {
                label: 'Cancel',
                className: 'btn-default'
              }
            },
            callback: function (continueWithoutSave) {
              if (continueWithoutSave) {
                closeChildRow();
              }
            }
          });

        // form is clean
        } else {
          closeChildRow();
        }

      } else {
        toggleButton.children().toggle();  // caret icons

        Promise.all([
          fetch(`/successes/${successId}.json`).then(res => res.json()),
          fetch(`/successes/${successId}/contributions.json?win_story=true`).then(res => res.json())
        ])
          .then(([success, contributionsData]) => {
            renderWinStory(success.win_story_html, success.win_story_completed);
            initWinStoryRecipientsSelect(
              success.win_story_recipients_select_options,
              contributionsData.invitation_templates
            );
          });

        dt.row($tr).child(
          _.template($('#success-child-row-template').html())({
            success: success,
            successPath: successPath(successId)
          })
        ).show();
        $trChild = $tr.next();
        $tr.addClass('shown active');
        $form = $trChild.find('form');
        $editor = $('#win-story-editor');

        // close other open child rows
        $table.find('tr[data-success-id]').not($tr).each(function () {
          if (dt.row($(this)).child.isShown()) {
            dt.row($(this)).child.hide();
            $(this).removeClass('shown active');
            $(this).children('td.toggle-success-child').children().toggle();
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
    // (removed these: #win-story-editor, .note-editable)
    .on('wheel', '.dropdown-menu.summernote-custom', function (e) {
      var maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
      // If this event looks like it will scroll beyond the bounds of the element,
      // prevent it and set the scroll to the boundary manually
      if ($(this).prop('scrollTop') + e.originalEvent.deltaY < 0 ||
          $(this).prop('scrollTop') + e.originalEvent.deltaY > maxY) {
        e.preventDefault();
        $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + e.originalEvent.deltaY)));
      }
    });

  // fetches a script that initializes the customer modal
  function editCustomer(e) {
    e.stopImmediatePropagation();   // prevent row group sorting
    const btn = e.currentTarget;
    
    // dynamically add and remove the spin behavior so that the page isn't full of perpetually spinning elements
    const toggleSpinner = () => btn.lastElementChild.children[0].classList.toggle('fa-spin');
    const loadingTimer = setTimeout(() => {
      toggleSpinner();
      btn.classList.add('still-loading');
    }, 1000);
    btn.classList.add('loading');
    
    // setting X-Requested-With allows the js request without an InvalidCrossOriginRequest error  
    // https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection.html
    // see bottom answer: https://stackoverflow.com/questions/29310187/rails-invalidcrossoriginrequest
    fetch(`/customers/${btn.dataset.customerId}/edit`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      }
    }).then(res => {
        clearTimeout(loadingTimer);
        return res.text();
      })
      .then(txt => {
        eval(txt);
        btn.classList.remove('loading', 'still-loading');
        toggleSpinner();
      })
      .catch(error => console.error(error));
  }
}
