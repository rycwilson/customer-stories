
//= require ./new
//= require ./show
//= require ./edit

function attachCompaniesListeners () {
  companiesNewListeners();
  companiesShowListeners();
  companiesEditListeners();

  // remember the last active tab for server submit / page refresh
  $(document).on('shown.bs.tab', '.mainnav-menu a[data-toggle="tab"]', function () {
    localStorage.setItem('lastCurateTab', $(this).attr('href'));
  });
  $(document).on('shown.bs.tab', '.nav-stacked a[data-toggle="tab"]', function () {
    localStorage.setItem('lastSettingsTab', $(this).attr('href'));
  });
}

function companiesNew () {

}

function companiesShow () {
  adjustPromoCSSChecker();
}

function companiesEdit () {
  initFormLogoBackground();
}


// not the best solution for remembering active tab, but it works
  // var lastCurateTab = localStorage.getItem('lastCurateTab');
  // var lastSettingsTab = localStorage.getItem('lastSettingsTab');
  // if (lastCurateTab) {
  //   $('[href="' + lastCurateTab + '"]').tab('show');
  // }
  // if (lastSettingsTab) {
  //   $('[href="' + lastSettingsTab + '"]').tab('show');
  // }