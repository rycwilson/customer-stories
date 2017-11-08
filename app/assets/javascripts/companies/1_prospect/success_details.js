
function successDetailsListeners () {

  $(document)
    .on('click', 'td.success-details', function () {

      var $table = $(this).closest('table'), dt = $table.DataTable(),
          $tr = $(this).closest('tr'), dtRow = dt.row($tr),
          successId = $tr.data('success-id'),
          successPath = '/successes/' + successId,
          success = dt.row($tr).data();
// console.log('success: ', success);
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
        $tr.children().last().css('color', 'white');
        $tr.addClass('shown active');
      }
      $(this).children().toggle();  // toggle caret icons
    })

    .on('submit', '.success-form', function () {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    });
}
