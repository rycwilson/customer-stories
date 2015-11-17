//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch
//= require select2/dist/js/select2
//= require best_in_place
//= require dirtyFields/jquery.dirtyFields.js

$(function () {

  configPlugins();
  initListeners();

});

function initListeners () {

  $(".best_in_place[data-bip-attribute='embed_url'").bind("ajax:success", function (data, status) {

    $('#embed-iframe').attr('src', $(this)[0].textContent );

  });

  /*
    Remember the initial <option>s of the tag select inputs
    If user cancels changes, revert to these
  */
  // var industryTagsOptions = $('.select2-selection__rendered').eq(0).html();
  // var industryTagsVal = $('#story_industry_tags_').val();
  // var productCatTags = $('.select2-selection__rendered').eq(1).html();
  // var productTags = $('.select2-selection__rendered').eq(2).html();
  // var tagsFormDirty = false;

  $('#tags-form select').on('change', function (e) {
    console.log($(this));
    if ($('.edit-tags').hasClass('hidden')) {
      // un-hide the save/cancel buttons
      $('.edit-tags').toggleClass('hidden');
    }
    // tagsFormDirty = true;

    console.log('industry tags on change: ', $('#story_industry_tags_').val());
  });

  // TODO: figure out how to reset select2 inputs
  // commented code results in error when attempting
  // to make changes after reset
  $('#edit-tags-cancel').on('click', function (e) {
    e.preventDefault();
    // reset the select input values
    // $('.select2-selection__rendered').eq(0).html(industryTagsOptions);
    // $('#story_industry_tags_').val(industryTagsVal);
    // $('.select2-selection__rendered').eq(1).html(productCatTags);
    // $('.select2-selection__rendered').eq(2).html(productTags);
    // console.log('industry tags after cancel: ', $('#story_industry_tags_').val());
    // hide the save/cancel buttons
    // $('.edit-tags').toggleClass('hidden');
    // tagsFormDirty = false;
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
    story tags
    need to modify the "for" label attributes to match the id attribute
    of the corresponding input field.  this is required for dirtyFields()
    plugin to highlight label when the input field changes value
  */
  $("label[for='Industry']").attr('for', 'story_industry_tags_');
  $("label[for='Product_Category']").attr('for', 'story_product_cat_tags_');
  $("label[for='Product']").attr('for', 'story_product_tags_');
  $('#tags-form').dirtyFields();

}





