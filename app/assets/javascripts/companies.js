// MVP plug-ins
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap
//= require mvpready-admin

// Industry and Product tagging inputs, new Story customer select
//= require select2/dist/js/select2

$(function () {

  $(".new-story").select2({
    theme: "bootstrap",
    allowClear: true
  }).select2('val', '0');  // default selection is an empty entry

  $(".tags").select2({
    theme: "bootstrap",
    tags: true
  });

  // reset new story modal form
  $('.modal').on('hidden.bs.modal', function () {
    $(this).find('form')[0].reset();  // clears the title field
    $('.new-story').select2('val', '0');  // clears the select2 inputs
  });

});


