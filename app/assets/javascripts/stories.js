//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch
//= require select2/dist/js/select2
//= require best_in_place
//= require bootstrap-jasny/js/fileinput
//= require dirtyFields/jquery.dirtyFields

// for best-in-place validation errors...
//= require best_in_place.purr
//= require jquery.purr

// AWS S3 upload
//= require jquery-ui/ui/widget
//= require jquery-file-upload/js/jquery.fileupload

//= require jquery.inputmask/dist/inputmask/inputmask
//= require jquery.inputmask/dist/inputmask/inputmask.phone.extensions
//= require jquery.inputmask/dist/inputmask/jquery.inputmask

//= require masonry/dist/masonry.pkgd

var ready = function () {

  $('#contributions-pre-request').on('click', '.send-request', function () {
    $('#progress-modal').modal('show');
  });

  // linkedin widgets
  $.getScript('http://platform.linkedin.com/in.js');

  initBIPListeners();
  initTagsListeners();
  initListeners();
  configPlugins();
  configUnderscore();
  configS3Upload();
  initBootstrapSwitch();

  /*
    give the linkedin widgets a second to load,
    then disable their tabbing behavior
  */
  window.setTimeout(function () {
    $("#contribution-connections iframe").each(function () {
      $(this).prop('tabIndex', '-1');
    });
  }, 1000);

};

/*
  with turbolinks in place, js only runs on initial controller/page load
  e.g. js does not run when going from stories#show to stories#edit,
    and this results in plug-ins not being initialized
  below ensures that js runs each time a stories/ page loads
  both are needed
*/
$(document).ready(function () {
  // console.log('doc.ready');
  ready();
});

$(document).on('page:load', function () {
  // console.log('page:load');
  ready();
});

$(document).on('page:change', function () {
  // console.log('page:change');
});

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

  $(".best_in_place[data-bip-attribute='linkedin_url']").bind("ajax:success",
    function (event, data) {
      var linkedinUrl = $(this).text(),
          $card = $(this).closest('.contribution-card'),
          $research = $card.find('.research');
      // add ...
      if ($card.find('iframe').length === 0 && linkedinUrl !== "add url ..." ) {
        $card.append(
          "<br style='line-height:10px'>" +
          "<div class='row text-center'>" +
            "<script type='IN/MemberProfile' " +
              "data-id='" + linkedinUrl + "' " +
              "data-format='inline' data-related='false' " +
              "data-width='340'></script>" +
          "</div>");
        IN.parse();
        $research.attr('href', linkedinUrl);
        $research.html("<i class='fa fa-linkedin-square bip-clickable-fa'>");
      // remove ...
      } else if ($card.find('iframe').length !== 0 && linkedinUrl === "add url ...") {
        $card.find('br:last').remove();
        $card.find('div:last').remove();
        // get contribution data so we can set research button
        // (needs contributor and customer data)
        $.get('/contributions/' + $card.data('contribution-id'), function (contribution, status) {
          if (contribution.role == 'customer') {
            $research.attr('href',
              "http://google.com/search?q=" +
              contribution.contributor.first_name + "+" +
              contribution.contributor.last_name + "+" +
              contribution.success.customer.name);
          } else {
            $research.attr('href',
              "http://google.com/search?q=" +
              contribution.contributor.first_name + "+" +
              contribution.contributor.last_name + "+");
          }
        }, 'json');
        $research.html("<i class='glyphicon glyphicon-user bip-clickable'></i>");
      // replace ...
      } else {
        $card.find('br:last').remove();
        $card.find('div:last').remove();
        $card.append(
          "<br style='line-height:10px'>" +
          "<div class='row text-center'>" +
            "<script type='IN/MemberProfile' " +
              "data-id='" + linkedinUrl + "' " +
              "data-format='inline' data-related='false' " +
              "data-width='340'></script>" +
          "</div>");
        IN.parse();
      }
  });

  // best-in-place errors
  $(document).on('best_in_place:error', function (event, data, status, xhr) {
    var error = JSON.parse(data.responseText)[0];
    if ( error.match(/maximum\sis\s70\scharacters/) )
      flashDisplay("Result can't exceed 70 characters", "danger");
  });

  /*
    tabindex=-1 on these elements prevents them from gaining focus
    after a bip field is submitted (with tab)
    also has the side-effect of keeping focus on the element,
    which we'll prevent with ...
  */
  $('a.accordion-toggle').on('focus', function () {
    $(this).blur();
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

  $('#story-tags-form select').on('change', function (e) {

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

  /*
    only one accordion panel open at a time
  */
  $('.accordion-toggle').on('click', function () {
    if ($(this).attr('href').match(/info/)) {
      var $readPanel = $(this).closest('.accordion')
                              .find("div.accordion-body[id*='submission']");
      if ($readPanel.hasClass('in'))
        $readPanel.removeClass('in');
    } else if ($(this).attr('href').match(/submission/)) {
      var $infoPanel = $(this).closest('.accordion')
                              .find("div.accordion-body[id*='info']");
      if ($infoPanel.hasClass('in'))
        $infoPanel.removeClass('in');
    }
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

    /*
      if change was triggered automatically,
      (i.e. to reset one select box in favor of select box most recently changed),
      exit from function
    */
    if (sessionStorage.getItem('autoTrigger') === 'true') {
      sessionStorage.setItem('autoTrigger', 'false');
      return false;
    }

    var filterTag = $(this).attr('name'),  // 'industries' or 'products' (comes from instance var name)
        filterId = $(this).val(),  // the database id of the chosen industry
        companyId = $('#stories-gallery').data('company-id'),
        template = _.template($('#stories-template').html()),
        $industrySelect = $(this).closest('.container').find("[name='industries']"),
        $productSelect = $(this).closest('.container').find("[name='products']"),
        storyPath = null;

    $.ajax({
      url: '/stories',
      method: 'get',
      data: { filter: { tag: filterTag, id: filterId } },
      success: function (data, status) {
        $('#stories-gallery').empty();
        if (data) {
          data.forEach(function (success) {
            if (success.products && success.published) {
              storyPath = '/' + success.customer.slug +
                          '/' + success.products[0].slug +
                          '/' + success.story.slug;
            } else {
              storyPath = '/' + success.customer.slug +
                          '/' + success.story.slug;
            }
            $.extend(success, { path: storyPath } );
          });
          console.log('filtered successes: ', data);
          var $tiles = $(template({ successTiles: data }));
          $('#stories-gallery').masonry()
                               .append($tiles)
                               .masonry('appended', $tiles);
        }
      }
    });

    if (filterTag === 'industries' && $productSelect.val() !== '0') {
      sessionStorage.setItem('autoTrigger', 'true');
      $productSelect.val('0').trigger('change');
    } else if (filterTag === 'products' && $industrySelect.val() !== '0') {
      sessionStorage.setItem('autoTrigger', 'true');
      $industrySelect.val('0').trigger('change');
    }

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

  // blur buttons after they're clicked
  $('#new-contributor-button').on('focus', function () {
    var _this = $(this);
    window.setTimeout(function () {
      _this.blur();
    }, 220);
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

  $("input[type='tel']").inputmask("999-999-9999");

  /*
    dirtyFields() plugin will apply .dirtyField class to label on input change
    (allows for color change)
    Need to modify the "for" label attributes to match the id attribute
    of the corresponding input field.
  */
  $("label[for='Industry']").attr('for', 'story_industry_tags_');
  $("label[for='Product_Category']").attr('for', 'story_product_cat_tags_');
  $("label[for='Product']").attr('for', 'story_product_tags_');
  $('#story-tags-form').dirtyFields();

  $('.grid').masonry({
    // options...
    itemSelector: '.grid-item',
    columnWidth: 220,
    isFitWidth: true
  });

}

function initBootstrapSwitch() {

  $('.bs-switch').bootstrapSwitch({
    size: 'small'
  });

  $('.bs-switch').on('switchChange.bootstrapSwitch', function (event, state) {
    $(this).parent().submit();
  });

  $('#story-publish-form').on('ajax:success', function (event, data) {
    var $publish = $("#story_published"),
        $logoPublish = $("#story_logo_published");
    /*
      server may have changed values to prevent invalid state!
      it either ...
        - turned logo_publish on to track story_publish=on
        - turned story_publish off to track logo_publish=off
    */
    if (!data.published && $publish.bootstrapSwitch('state') === true) {
      $publish.bootstrapSwitch('state', false);
    } else if (data.logo_published && $logoPublish.bootstrapSwitch('state') === false) {
      $logoPublish.bootstrapSwitch('state', true);
    }
  });
}






