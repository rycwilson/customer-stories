
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
      })
    .on('scroll', function () {
      var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
console.log(scrollBottom)
      if (scrollBottom < $('#sign-in-footer').height()) {
        $('#more-stories-container').hide();
      }
      else {
        $('#more-stories-container').show();
      }
    });

}






