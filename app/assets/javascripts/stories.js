//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch
//= require select2/dist/js/select2
//= require best_in_place
//= require dirtyFields/jquery.dirtyFields.js

var ready = function () {

  configPlugins();
  initListeners();
  initUnderscore();

};

/*
  with turbolinks in place, js only runs on initial page load
  for example, js does not run when going from stories#show to stories#edit,
    and this results in plug-ins not being initialized
  below ensures that js runs each time a stories/ page loads
*/
$(document).ready(ready);
$(document).on('page:load', ready);

function initUnderscore() {
  // this changes underscore to use {{ }} delimiters
  // (so doesn't clash with erb <% %>)
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g,
    escape:      /\{\{-(.+?)\}\}/g
  };
  // provide a .each_slice method for the template
  // this is for rendering the stories index
  Array.prototype.each_slice = function (size, callback) {
    for (var i = 0, l = this.length; i < l; i += size) {
      callback.call(this, this.slice(i, i + size));
    }
  };
}

function initListeners () {
  /*
    update story attribute: embed_url
    The url is modified on server side to ensure that the
    youtube embed link is used
  */
  $(".best_in_place[data-bip-attribute='embed_url'").bind("ajax:success",
    function (event, data) {
      newUrl = JSON.parse(data).embed_url;
      $('#embed-iframe').attr('src', newUrl);
      $(".best_in_place[data-bip-attribute='embed_url'")
        .text(newUrl);
  });

  /*
    Remember the initial <option>s of the tag select inputs
    If user cancels changes, revert to these

    var industryTagsOptions = $('.select2-selection__rendered').eq(0).html();
    var industryTagsVal = $('#story_industry_tags_').val();
    var productCatTags = $('.select2-selection__rendered').eq(1).html();
    var productTags = $('.select2-selection__rendered').eq(2).html();
  */

  $('#tags-form select').on('change', function (e) {

    if ($('.edit-tags').hasClass('hidden')) {
      // un-hide the save/cancel buttons
      $('.edit-tags').toggleClass('hidden');
    }
    // console.log('industry tags on change: ', $('#story_industry_tags_').val());
  });

  $('.stories-filter').on('change', function () {
    var filterType = $(this).attr('id');
    var filterData = $(this).val();
    var companyId = $('#stories-gallery').data('company-id');
    $.ajax({
      url: '/companies/' + companyId.toString() + '/stories',
      method: 'get',
      data: { filter: { type: filterType, data: filterData } },
      // dataType: 'json',
      success: function (data, status) {
        console.log(data);
        var template = _.template($('#stories-template').html());
        $('#stories-gallery').empty().append(template({ stories: data }));
      }
    });
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

  // reset new contributor modal form
  $('.modal').on('hidden.bs.modal', function () {
    // form inputs to default values...
    $(this).find('form')[0].reset();
    // select2 inputs to default values...
    $('.contributor-role').select2('val', 'Customer');  // single select
  });

  // blur buttons after they're clicked
  $('.contribution-request').on('focus','input.contribution-request', function () {
    console.log('focus: ', $(this));
  });

}

function configPlugins () {

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

  $('.stories-filter').select2({
    theme: 'bootstrap'
  });

  $('.contributor-role').select2({
    theme: 'bootstrap'
  });

  /*
    dirtyFields() plugin will apply .dirtyField class to label on input change
    (allows for color change)
    Need to modify the "for" label attributes to match the id attribute
    of the corresponding input field.
  */
  $("label[for='Industry']").attr('for', 'story_industry_tags_');
  $("label[for='Product_Category']").attr('for', 'story_product_cat_tags_');
  $("label[for='Product']").attr('for', 'story_product_tags_');
  $('#tags-form').dirtyFields();

}





