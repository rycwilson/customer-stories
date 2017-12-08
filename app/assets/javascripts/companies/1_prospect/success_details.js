
function successDetailsListeners () {

  $(document)
    .on('click', 'td.success-details', function () {

      var $table = $(this).closest('table'),
          $tr = $(this).closest('tr'),
          dt = $table.DataTable(),
          dtRow = dt.row($tr),
          successId = $tr.data('success-id'),
          successPath = '/successes/' + successId,
          success = dt.row($tr).data();

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.children().last().css('color', '#666');
        $tr.removeClass('shown active');
      }
      else {
        dtRow.child(
          _.template( $('#success-details-template').html() )({
            success: success,
            referrer: success.referrer,
            successPath: successPath
          })
        ).show();
        $tr.next().one('input', function (e) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        });
        $tr.addClass('shown active');
      }
      $(this).children().toggle();  // toggle caret icons
    });
}
