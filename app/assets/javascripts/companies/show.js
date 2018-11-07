
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
    });

}






