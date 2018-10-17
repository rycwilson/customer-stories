
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

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.children().last().css('color', '#666');
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
        $tr.next().one('input', function (e) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        });
        $tr.addClass('shown active');
        $table.find('tr').not($tr).each(function () {
          dt.row($(this)).child.hide();
          if ($(this).hasClass('shown active')) {
            $(this).removeClass('shown active');
            $(this).find('td.success-details').children().toggle();
          }
        });

        var top = $tr.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $tr.outerHeight()) / 2);
          window.scrollTo(0, top);
      }
      $(this).children().toggle();  // toggle caret icons
    });
}
