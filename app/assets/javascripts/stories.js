//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch
//= require select2/dist/js/select2
//= require best_in_place
//= require bootstrap-jasny/js/fileinput.js
//= require dirtyFields/jquery.dirtyFields.js

// for best-in-place validation errors...
//= require best_in_place.purr
//= require jquery.purr

// AWS S3 upload
//= require jquery-ui/ui/widget.js
//= require jquery-file-upload/js/jquery.fileupload

var ready = function () {

  // linkedin widgets
  $.getScript('http://platform.linkedin.com/in.js');

  initBIPListeners();
  initTagsListeners();
  initListeners();
  configPlugins();
  configUnderscore();
  configS3Upload();

};

/*
  with turbolinks in place, js only runs on initial page load
  for example, js does not run when going from stories#show to stories#edit,
    and this results in plug-ins not being initialized
  below ensures that js runs each time a stories/ page loads
  both are needed
*/
$(document).ready(ready);
$(document).on('page:load', ready);

function configUnderscore() {
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

function initBIPListeners () {
  /*
    update story attribute: embed_url
    The url is modified on server side to ensure that the
    youtube embed link is used
  */
  $(".best_in_place[data-bip-attribute='embed_url']").bind("ajax:success",
    function (event, data) {
      newUrl = JSON.parse(data).embed_url;
      $('#embed-iframe').attr('src', newUrl);
      $(".best_in_place[data-bip-attribute='embed_url']")
        .text(newUrl);
  });

  // best-in-place errors
  $(document).on('best_in_place:error', function (event, data, status, xhr) {
    var error = JSON.parse(data.responseText)[0];
    if ( error.match(/maximum\sis\s50\scharacters/) )
      flashDisplay("Result can't exceed 50 characters", "danger");
  });
}

function initTagsListeners () {
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

function initListeners () {

  /*
    Customer logo
  */
  $('#customer-logo-form').on('change.bs.fileinput', function () {
    var $form = $(this);
    // need to introduce a slight delay while fileinput.js updates the form
    // (adds hidden input with value = S3 link)
    window.setTimeout(function () {
      $.ajax({
        url: $form.attr('action'),
        method: 'put',
        data: $form.serialize(),
        success: function (data, status) {
          console.log(data, status);
        }
      });
    }, 500);
  });

  /*
    Stories filter
  */
  $('.stories-filter').on('change', function () {

    var filterType = $(this).attr('id'); // 'industries'
    var filterId = $(this).val(); // the database id of the chosen industry
    var companyId = $('#stories-gallery').data('company-id');
    $.ajax({
      url: '/stories',
      method: 'get',
      data: { filter: { type: filterType, id: filterId } },
      // dataType: 'json',
      success: function (data, status) {
        console.log('filtered stories: ', data);
        var template = _.template($('#stories-template').html());
        $('#stories-gallery').empty().append(template({ stories: data }));
      }
    });
  });

  // reset new contributor modal form when the modal closes
  $('.modal').on('hidden.bs.modal', function () {
    // input elements to default values (first, last, email)
    $(this).find('form')[0].reset();
    // select2 inputs to default values (role, referred-by)
    $('.new-contributor-role').select2('val', 'customer');  // single select
    $('.new-contributor-referrer').select2('val', '');
  });

  // separate 'shown' handler necessary for setting input focus
  $('.modal').on('shown.bs.modal', function () {
    // the selector $('input:first') doesn't work for some reason
    $(this).find('#contributor_first_name').focus();
  });

  $('.bs-switch').on('switchChange.bootstrapSwitch', function (event, state) {
    $(this).parent().submit();
    // don't need this yet...
    console.log(state);
  });

  // blur buttons after they're clicked
  $('.btn').on('focus', function () {
    var _this = $(this);
    window.setTimeout(function () {
      _this.blur();
    }, 300);
  });

  /*
    new result form - submit is disabled until value entered.
    listens for input event instead of change event, as latter only fires after
    focus moves away from input field, while former fires after all edits
  */
  $('#new-result').on('input', function () {
    if ($(this).val().length > 0)
      $(this).closest('form').find('button').prop('disabled', false);
    else
      $(this).closest('form').find('button').prop('disabled', true);
  });

  $('#new-prompt').on('input', function () {
    if ($(this).val().length > 0)
      $(this).closest('form').find('button').prop('disabled', false);
    else
      $(this).closest('form').find('button').prop('disabled', true);
  });

  // delete a result
  $('#results-list').on('click', '.delete-result', function () {
    var $deleteButton = $(this);
    $.ajax({
      url: $deleteButton.data('action'),
      method: 'delete',
      success: function (data, status, xhr) {
        $deleteButton.closest('.row').next('br').remove();
        $deleteButton.closest('.row').remove();
      }
    });
  });

  // delete a prompt
  $('#prompts-list').on('click', '.delete-prompt', function () {
    var $deleteButton = $(this);
    $.ajax({
      url: $deleteButton.data('action'),
      method: 'delete',
      success: function (data, status, xhr) {
        $deleteButton.closest('.row').next('br').remove();
        $deleteButton.closest('.row').remove();
      }
    });
  });
}

function configPlugins () {

  $('.best_in_place').best_in_place();

  $('.bs-switch').bootstrapSwitch({
    size: 'small'
  });

  $('.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

  $('.stories-filter').select2({
    theme: 'bootstrap'
  });

  $('.new-contributor-role').select2({
    theme: 'bootstrap'
  });

  $('.new-contributor-referrer').select2({
    theme: 'bootstrap',
    placeholder: 'Who referred you to this contributor?'
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





