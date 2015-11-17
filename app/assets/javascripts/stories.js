//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch
//= require select2/dist/js/select2
//= require best_in_place
//= require dirtyFields/jquery.dirtyFields.js

$(function () {

  initListeners();
  configPlugins();

});

function initListeners () {

  $(".best_in_place[data-bip-attribute='embed_url'").bind("ajax:success", function (data, status) {

    $('#embed-iframe').attr('src', $(this)[0].textContent );

  });

}

function configPlugins () {

  // in-place editing
  $('.best_in_place').best_in_place();

  $('#publish-story').bootstrapSwitch({
    size: 'small'
  });
  $('#publish-logo').bootstrapSwitch({
    size: 'small'
  });

  $('.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

  /*
    need to modify the "for" label attributes to match the id attribute
    of the corresponding input field.  this is required for dirtyFields()
    plugin to highlight label when the input field changes value
  */
  $("label[for='Industry']").attr('for', 'story_industry_tags_');
  $("label[for='Product_Category']").attr('for', 'story_product_cat_tags_');
  $("label[for='Product']").attr('for', 'story_product_tags_');
  $('#tags-form').dirtyFields();
  $('#tags-form select').on('change', function (e) {
    $('p.lead + button').toggleClass('hidden');
  });

}





