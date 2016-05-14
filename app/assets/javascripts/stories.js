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

// HTML editor for contribution requests
//= require summernote

//= require jquery.inputmask/dist/inputmask/inputmask
//= require jquery.inputmask/dist/inputmask/inputmask.phone.extensions
//= require jquery.inputmask/dist/inputmask/jquery.inputmask

//= require masonry/dist/masonry.pkgd

/*
  With turbolinks in place, js only runs on initial controller/page load,
  e.g. js does not run when going from stories#show to stories#edit
  This results in plug-ins not being initialized
  Below ensures that js runs each time a stories# page loads
  Both are needed
*/
$(document).ready(function () {
  // console.log('doc.ready');
  ready();
});

/*
  is this even doing anything?  not so sure
*/
$(document).on('page:load', function () {
  // console.log('page:load');
  ready();  // TODO: probably don't have to run everything here
});

/*
  wait for images to load before initializing the masonry grid
*/
$(window).on('load', function () {
  initMasonry();
});

$(document).on('page:change', function () {
  // console.log('page:change');
});

function ready () {
  initSelect2();
  initLinkedIn();
  initBIPListeners();
  initTagsListeners();
  initListeners();
  configPlugins();
  configUnderscore();
  configS3Upload();
  initBootstrapSwitch();
  initContributions();
}

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
    var $_this = $(this);
    window.setTimeout(function () { $_this.blur(); }, 200);
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
        $industrySelect = $(this).closest("[id*='stories-filters']").find("[name='industries']"),
        $productSelect = $(this).closest("[id*='stories-filters']").find("[name='products']"),
        storyPath = null;

    $.ajax({
      url: '/stories',
      method: 'get',
      data: { filter: { tag: filterTag, id: filterId } },
      success: function (data, status) {
        console.log('response data: ', data);
        var successData = JSON.parse(data.success_tiles);
        console.log('success data: ', successData);
        $('#stories-gallery').empty();
        if (successData.length) {
          successData.forEach(function (success) {
            if (success.products && success.story.published) {
              storyPath = '/' + success.customer.slug +
                          '/' + success.products[0].slug +
                          '/' + success.story.slug;
            } else if (success.story.published) {
              storyPath = '/' + success.customer.slug +
                          '/' + success.story.slug;
            } else if (data.curator) {
              storyPath = '/stories/' + success.story.id + '/edit';
            }
            $.extend(success, { path: storyPath });
          });
          // console.log('with path: ', data);
          // console.log('filtered successes: ', data);
          var $tiles = $(template({ curator: data.curator,
                                 successTiles: successData }));
          $('#stories-gallery').masonry()
                               .append($tiles)
                               .masonry('appended', $tiles);
        }
      }
    });

    if (filterTag === 'industries' &&
                      $productSelect.length &&  // was filter removed?
                      $productSelect.val() !== '0') {
      sessionStorage.setItem('autoTrigger', 'true');
      $productSelect.val('0').trigger('change');
    } else if (filterTag === 'products' &&
                             $industrySelect.length &&  // was filter removed?
                             $industrySelect.val() !== '0') {
      sessionStorage.setItem('autoTrigger', 'true');
      $industrySelect.val('0').trigger('change');
    }

  });

  // reset new contributor modal form when the modal closes
  $('#new-contributor-modal').on('hidden.bs.modal', function () {
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
      server may have changed values to prevent invalid state ...
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

function initSelect2 () {

  $('.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

  $('.stories-filter').select2({
    theme: 'bootstrap',
    width: 'style'   // get the width from stories.scss
  });

  $('.new-contributor-role').select2({
    theme: 'bootstrap'
  });

  $('.new-contributor-referrer').select2({
    theme: 'bootstrap',
    placeholder: 'Who referred you to this contributor?'
  });

  // this code prevents the options list from showing
  // when a tag is removed
  $('.select2').prev().on('select2:unselecting', function(e) {
    $(this).data('unselecting', true);
  }).on('select2:open', function(e) { // note the open event is important
    if ($(this).data('unselecting')) {
        $(this).removeData('unselecting'); // you need to unset this before close
        $(this).select2('close');
    }
  });

}

function initContributions () {

  // show an in-progress modal when request email is sent
  $('#email-confirmation-modal i').on('click', function () {

  });

  $('#confirm-email-form').on('submit', function () {
    $(this).closest('.modal-content').find('.modal-title')
                                     .addClass('hidden');
    $(this).closest('.modal-content').find('.progress')
                                     .removeClass('hidden');
  });

  /*
    init summernote
    this could potentially be run in application.js and apply to both
    stories and companies controllers, but for the time being the editor
    in stories needs to have some stuff disabled
  */
  $('[data-provider="summernote"]').each(function () {
    $(this).summernote({
      focus: false,  // this does not appear to work
      toolbar: [
        // ['style', ['style']],
        ['font', ['bold', 'italic', 'underline']], //, 'clear']],
        // ['fontname', ['fontname']],
        // ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        // ['height', ['height']],
        // ['table', ['table']],
        // ['insert', ['link', 'picture', 'hr']],
        // ['view', ['codeview']],
        // ['help', ['help']]
      ],
    });
  });

  /*
    on successful addition of linkedin profile to contributor card
  */
  $(".contribution-cards").on("ajax:success", ".best_in_place[data-bip-attribute='linkedin_url']",
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
        initLinkedIn();
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
        initLinkedIn();
      }
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

  /*
    Propagate any changes to contribution notes dynamically.
    There are issues with updating an existing best_in_place input with jquery,
    so instead this function finds the notes field that needs updating,
    removes and replaces it with a clone of itself, with attributes updated
    as necessary
  */
  $(".contribution-cards").on("ajax:success", ".best_in_place[data-bip-attribute='notes']",
    function (event, data) {

      var $_this = $(this), // the notes field that was modified
          contributionId = $(this).attr('id').match(/_(\d+)_notes$/)[1];

      $(".best_in_place[id*='" + contributionId + "_notes']")
        .each(function (index) {
          // update any instance of this contribution notes field
          // besides the one that was just modified ...
          if ( !$(this).is($_this) ) {
            var $newNotesField = $(this).clone();
            $newNotesField.html($_this.html());
            $newNotesField.attr('data-bip-value', $_this.html());
            $newNotesField.attr('data-bip-original-content', $_this.html());
            $(this).parent().empty()
                            .append($newNotesField);
            $newNotesField.best_in_place();
          }
      });

  });

  // mirrors above function for phone field
  $(".contribution-cards").on("ajax:success", ".best_in_place[data-bip-attribute='phone']",
    function (event, data) {

      var $_this = $(this), // the phone field that was modified
          userId = $(this).attr('id').match(/_(\d+)_phone$/)[1];

      $(".best_in_place[id*='" + userId + "_phone']")
        .each(function (index) {
          console.log('phone fields: ', $(this));
          // update any instance of this phone field
          // besides the one that was just modified ...
          if ( !$(this).is($_this) ) {
            var $newPhoneField = $(this).clone();
            $newPhoneField.html($_this.html());
            $newPhoneField.attr('data-bip-value', $_this.html());
            $newPhoneField.attr('data-bip-original-content', $_this.html());
            $(this).parent().empty()
                            .append("<span>Phone:&nbsp;&nbsp;</span>", $newPhoneField);
            $newPhoneField.best_in_place();
          }
      });

  });

}

function initLinkedIn () {

  // linkedin widgets (load IN.js library conditionally)
  if (typeof(IN) !== "object") {
    console.log("loading in.js ...");
    $.getScript('http://platform.linkedin.com/in.js');
  } else {
    console.log("in.js already loaded");
  }

  /*
    give the  widgets a second to load, then disable their tabbing behavior
  */
  window.setTimeout(function () {
    $("#contribution-connections iframe").each(function () {
      $(this).prop('tabIndex', '-1');
    });
  }, 1000);

}

function initMasonry () {

  $('.grid').masonry({
    // options...
    itemSelector: '.grid-item',
    columnWidth: 220,
    isFitWidth: true
  });

  /*
    Since gettinng the image centered vertically with css is a pain,
    do it with jquery instead
  */
  $('#stories-gallery img').each(function (image) {

    var height = $(this).outerHeight(),
        maxHeight = parseInt($(this).css('max-height')),
        diff = maxHeight - height;

    if (diff) {
      $(this).css('margin-top', diff / 2);
    }

  });
}





