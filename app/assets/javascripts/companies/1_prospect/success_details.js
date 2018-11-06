
function successDetailsListeners () {

  $(document)
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
