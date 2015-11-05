//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch
// Select2
//= require select2/dist/js/select2

$(function () {

  $('#publish-logo').bootstrapSwitch();
  $('#publish-story').bootstrapSwitch();

  $(".story-tags").select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

});


