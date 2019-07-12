
function companiesShow () {

  // panel-specific stuff
  prospect();
  curate();
  promote();

}

function companiesShowListeners () {

  prospectListeners();
  curateListeners();
  promoteListeners();
  measureListeners();

  $(document)
    .on('shown.bs.dropdown', '.status.dropdown, .actions.dropdown', function () {
        $(this).closest('tr').addClass('active');
      })

    .on('hidden.bs.dropdown', '.status.dropdown, .actions.dropdown', function () {
      // don't remove .active if the child row is open
      if (!$(this).closest('tr').hasClass('shown')) {
        $(this).closest('tr').removeClass('active');
      }
    })

    // .on(
    //   'hidden.bs.tab', 
    //   'a[href="#successes"], a[href*="contributors"], a[href="#promoted-stories"]',
    //   function () {

    //     console.log(this)
    //     var $table;
    //     if ($(this).is('a[href="#successes"]')) {
    //       $table = $('#successes-table');
    //     } else if ($(this).is('a[href*="contributors"]')) {
    //       $table = $(this).is('a[href="prospect-contributors"]') ?
    //                  $('#prospect-contributors') :
    //                  $('#curate-contributors');
    //     } else if ($(this).is('a[href="#promoted-stories"]')) {
    //       $table = $('#promoted-stories-table');
    //     }

    //     // close open child rows
    //     $table.find('tbody > tr:not(.group)').each(function (index, row) {
    //       console.log(row)
    //       if ($table.DataTable().row(row).child.isShown()) {
    //         $table.DataTable().row(row).child.hide();
    //         $(row).removeClass('shown active');
    //         $(row).children('td[class*="child"]').children().toggle();
    //       }
    //     });
    //   });

}






