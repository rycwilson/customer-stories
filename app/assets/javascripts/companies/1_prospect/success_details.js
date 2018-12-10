
function successDetailsListeners () {

  var defaultHeight = "150px",  // win story expand / collapse
      contributionsData,  // data returned when the child row is opened; includes invitation templates, questions and answers
      winStory,  // success.description
      expandedHeight = function ($tr, isEditMode) {
        // factor in height of the summernote toolbar
        return window.innerHeight - ((isEditMode ? 41.3 : 0) + $tr.height() + $tr.next().height() - $('#win-story-editor').height());
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
      applyDropdownScrollBoundaries = function () {
        var maxY = null;
        $(document).on('wheel', '.dropdown-menu.summernote-custom', function (e) {
          maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
          // If this event looks like it will scroll beyond the bounds of the element,
          // prevent it and set the scroll to the boundary manually
          if ($(this).prop('scrollTop') + e.originalEvent.deltaY < 0 ||
              $(this).prop('scrollTop') + e.originalEvent.deltaY > maxY) {
            e.preventDefault();
            $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + e.originalEvent.deltaY)));
          }
        });
      }
      initWinStoryEditor = function ($tr, contributions) {
        // use contenteditable instead of textarea because html can't be renderd in textarea
        $('#win-story-editor')
          .prop('contenteditable', true)
          .summernote({
            height: expandedHeight($tr, true),
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
                applyDropdownScrollBoundaries();

                // unable to set this via stylesheets due to dynamic handling by summernote
                $('.note-editor .dropdown-menu.summernote-custom').css({
                  'max-height': 0.95 * $('.note-editable').last().outerHeight() + 'px',
                  'max-width': 0.95 * $('.note-editable').last().outerWidth() + 'px'
                });
              }
            }
          });
      },
      // getWinStory = function (successId) {
      //   $.ajax({
      //     url: '/successes/' + successId,
      //     method: 'get',
      //     dataType: 'json'
      //   })
      //     .done(function (res, status, xhr) {
      //       console.log('getWinStory response', res);
      //       winStory = res.success.win_story
      //     })
      // },
      // getContributionsData = function (successId) {
      //   $.ajax({
      //     url: '/successes/' + successId + '/contributions',
      //     method: 'get',
      //     data: {
      //       win_story: true
      //     },
      //     dataType: 'json'
      //   })
      //     .done(function (res, status, xhr) {
      //       console.log('getContributionsData response', res)
      //       contributionsData = res.contributions_data
      //     })
      // },
      renderWinStory = function () {

        $('#win-story-editor').html(_.unescape(winStory))

        // self.request_subject = self.invitation_template.request_subject
        //   .sub('[customer_name]', self.customer.name)
        //   .sub('[company_name]', self.company.name)
        //   .sub('[contributor_first_name]', self.contributor.first_name)
        //   .sub('[contributor_full_name]', self.contributor.full_name)
        // self.request_body = self.invitation_template.request_body
        //   .gsub('[customer_name]', self.customer.name)
        //   .gsub('[company_name]', self.company.name)
        //   .gsub('[contributor_first_name]', self.contributor.first_name)
        //   .gsub('[contributor_last_name]', self.contributor.last_name)
        //   .gsub('[referrer_full_name]', self.referrer.try(:full_name) || '<span style="color:#D9534F">Unknown Referrer</span>')
        //   .gsub('[curator_full_name]', "<span style='font-weight:bold'>#{self.curator.full_name}</span>")
        //   .gsub('[curator_phone]', self.curator.phone || '')
        //   .gsub('[curator_title]', self.curator.title || '')
        //   .gsub('[curator_img_url]', self.curator.photo_url || '')
        //   .gsub('[contribution_submission_url]', invitation_link('contribution'))
        //   .gsub('[feedback_submission_url]', invitation_link('feedback'))
        //   .html_safe
      };

  $(document)

    .on('click', 'button[data-target="#edit-customer-modal"]', function (e) {
      // clicking a row group will normally sort alphabetically; prevent this
      e.stopImmediatePropagation();

      $.ajax({
        url: '/customers/' + $(this).data('customer-id'),
        method: 'GET',
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

    .on('click', '.win-story-actions__expand', function () {
      var $tr = $('tr.shown'),
          $trChild = $tr.next(),
          $editBtn = $('button.win-story-actions__edit'),
          editorIsOpen = $('#win-story-editor[contenteditable="true"]').length;
      $('#win-story-editor').css(
        'height',
        $('#win-story-editor').hasClass('expanded') ? defaultHeight : expandedHeight($tr, false)
      );
      $('#win-story-editor').toggleClass('expanded');
      $editBtn.prop('disabled', $('#win-story-editor').hasClass('expanded'))
      $(this)[0].blur();
      $(this).find('span').toggle();
      window.scrollTo(0, $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2));
    })

    .on('click', '.win-story-actions__edit', function () {
      var $tr = $('tr.shown'),
          $trChild = $tr.next(),
          $expandBtn = $('button.win-story-actions__expand'),
          openEditor = typeof $('#win-story-editor').data('summernote') !== 'object';
      if (openEditor) {
        initWinStoryEditor($tr);
      } else {
        $('#win-story-editor').prop('contenteditable', false)
                              .summernote('destroy')
        $(this)[0].blur();
      }
      $expandBtn.prop('disabled', openEditor)
                .find('span').toggle();
      $('#win-story-editor').toggleClass('expanded');
      window.scrollTo(0, $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2));
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
          successPath = '/successes/' + successId,
          success = dt.row($tr).data();

      $(this).children().toggle();  // toggle caret icons

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.removeClass('shown active');
      }
      else {
        $.when(
          $.ajax({
            url: '/successes/' + successId,
            method: 'get',
            dataType: 'json'
          }),
          $.ajax({
            url: '/successes/' + successId + '/contributions',
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
            successPath: successPath
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

    });
}
