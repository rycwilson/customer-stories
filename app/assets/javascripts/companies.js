// MVP plug-ins
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap
//= require mvpready-admin

// Select2
//= require select2/dist/js/select2

$(function () {

  configSelect2();

  // reset new story modal form
  $('.modal').on('hidden.bs.modal', function () {
    // form inputs to default values... (in this case just title)
    $(this).find('form')[0].reset();
    // select2 inputs to default values...
    $('.new-story-customer').select2('val', '');  // single select
    $('.new-story-tags').val('').trigger('change');  // multiple select
  });

});

// It would be nice to have a .tags class to which the common
// settings (theme, tags) can be applied, but that doesn't work.
// That is, only one .select2() call per element will work,
// any others will be ignored
function configSelect2 () {

  // has the curate tab content been rendered?
  if ($('#curate').length) {
    // is there a list of existing customers to choose from?
    if ($('.new-story-customer').length) {

      $(".new-story-customer").select2({  // single select
        theme: "bootstrap",
        tags: true,  // to allow new company creation
        placeholder: 'select or add a new customer',
        // allowClear: true
      });
    }

    // when tagging stories, user can't create new tags,
    // has to do so under company settings
    // TODO: enable new tags from here?
    $(".new-story-tags").select2({
      theme: 'bootstrap',
      placeholder: 'select tags'
    });

  }

  $(".industry-tags").select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'select or add new industries'
  });

  // company registration
  // TODO: disable autocomplete
  $(".prod-cat-tags-reg").select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'add product categories'
  });

  // company registration
  // TODO: disable autocomplete
  $(".products-reg").select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'add products'
  });

}


