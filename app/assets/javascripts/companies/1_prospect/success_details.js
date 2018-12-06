
function successDetailsListeners () {

  // win story expand / collapse
  var defaultHeight = "150px",
      expandedHeight = function ($tr, isEditMode) {
        // factor in height of the summernote toolbar
        return window.innerHeight - ((isEditMode ? 41.3 : 0) + $tr.height() + $tr.next().height() - $('#win-story-editor').height());
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
          console.log('customer', customer)
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
            ],
          });
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
          success = dt.row($tr).data();

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
