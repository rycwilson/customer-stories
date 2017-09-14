
function successDetailsListeners () {

  $(document)
    .on('click', 'td.success-details', function () {

      var dt = $(this).closest('table').DataTable(),
          $tr = $(this).closest('tr'),
          dtRow = dt.row($tr),
          template = _.template($('#success-details-template').html());

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.children().last().css('color', '#666');
        $tr.removeClass('shown active');
      }
      else {
        dtRow.child( template({}) ).show();
        $tr.children().last().css('color', 'white');
        $tr.addClass('shown active');
      }
      $(this).children().toggle();  // toggle caret icons
    });

}