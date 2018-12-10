
function successDetailsListeners () {

  var defaultHeight = "150px",  // win story expand / collapse
      contributionsData,  // data returned when the child row is opened; includes invitation templates, questions and answers
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
          .prop('contenteditiable', true)
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
                $('.note-editor .dropdown-menu.summernote-custom').css({
                  'max-height': 0.95 * $('.note-editable').last().outerHeight() + 'px',
                  'max-width': 0.95 * $('.note-editable').last().outerWidth() + 'px'
                });
                applyDropdownScrollBoundaries();
              }
            }
          });
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

    .on('click', 'td.success-details', function () {
      var $table = $(this).closest('table'),
          $tr = $(this).closest('tr'),
          $trChild,
          dt = $table.DataTable(),
          dtRow = dt.row($tr),
          successId = $tr.data('success-id'),
          successPath = '/successes/' + successId,
          success = dt.row($tr).data(),
          winStory,
          getWinStory = $.Deferred(),
          getContributionsData = $.Deferred();

      $.ajax({
        url: '/successes/' + successId,
        method: 'get',
        dataType: 'json',
      })
        .done(function (res, status, xhr) {
          winStory = res.success.win_story;
          getWinStory.resolve();
        })

      $.ajax({
        url: '/successes/' + successId + '/contributions',
        method: 'get',
        data: {
          win_story: true
        },
        dataType: 'json',
      })
        .done(function (res, status, xhr) {
          contributionsData = res.contributions_data;
          getContributionsData.resolve();
        })


      $.when(getWinStory, getContributionsData).done(function () {
        // console.log(winStory)
        // console.log(contributions)
      })


      $(this).children().toggle();  // toggle caret icons

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.removeClass('shown active');
      }
      else {
        dtRow.child(
          _.template($('#success-details-template').html())({
            success: success,
            referrer: success.referrer,
            contact: success.contact,
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
