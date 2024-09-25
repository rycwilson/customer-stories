


function companiesShow () {
  
  prospect();
  curate();
  
  // to control delay via css (opacity transition), need to synchronously add the working--still class
  // => won't work without the timeout
  setTimeout(function () { $('.working').addClass('working--still'); }, 1);
}

function companiesShowListeners () {

  prospectListeners();
  curateListeners();
  promoteListeners();
  measureListeners();

  $(document)

    // actions dropdowns
    .on('shown.bs.dropdown', '.actions.dropdown', function (e) {
      var $dropdownMenu = $(this).find('.dropdown-menu'),
          windowBottom = window.scrollY + window.innerHeight,
          dropdownBottom = $dropdownMenu.offset().top + $dropdownMenu.outerHeight();
      $(this).closest('tr').addClass('active');
      if (dropdownBottom > windowBottom) {
        $dropdownMenu.addClass('flip shown');
      } else {
        $dropdownMenu.addClass('shown')
      }
    })
    .on('hidden.bs.dropdown', '.actions.dropdown', function () {
      $(this).find('.dropdown-menu').removeClass('flip shown');
      
      // don't remove .active if the child row is open
      if (!$(this).closest('tr').hasClass('shown')) {
        $(this).closest('tr').removeClass('active');
      } 
    })


}






