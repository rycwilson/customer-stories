// MVP plug-ins
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap
//= require mvpready-admin

// Industry and Product tagging inputs, new Story customer select
//= require select2/dist/js/select2

$(function () {

  $(".new-story-customer").select2({
    theme: "bootstrap",
    placeholder: "Select a customer",
    allowClear: true
  });

  $(".tags").select2({
    theme: "bootstrap",
    tags: true
  });

});


