
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
        $(this).closest('tr').removeClass('active');
      });

}






