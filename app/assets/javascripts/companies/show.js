
function companiesShow () {

  // panel-specific stuff
  crowdsource();
  curate();
  promote();

}

function companiesShowListeners () {

  crowdsourceListeners();
  curateListeners();
  promoteListeners();
  measureListeners();

  $(document)
    .on('shown.bs.dropdown', '.status-dropdown, .actions-dropdown', function () {
        $(this).closest('tr').addClass('active');
      })

    .on('hidden.bs.dropdown', '.status-dropdown, .actions-dropdown', function () {
        $(this).closest('tr').removeClass('active');
      });

}






