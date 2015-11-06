//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch

// Select2
//= require select2/dist/js/select2

// Best in Place
//= require best_in_place

$(function () {

  initListeners();
  configPlugins();

});

function initListeners () {
  // $('#edit-story-quote').on('click', function () {
  // });
}

function configPlugins () {

  $('.best_in_place').best_in_place();

  // $('#publish-logo').bootstrapSwitch();
  $('#publish-story').bootstrapSwitch();

  $('.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

}




