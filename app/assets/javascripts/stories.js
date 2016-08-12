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

// HTML editor for contribution requests
//= require summernote

//= require jquery.inputmask/dist/inputmask/inputmask
//= require jquery.inputmask/dist/inputmask/inputmask.phone.extensions
//= require jquery.inputmask/dist/inputmask/jquery.inputmask

//= require masonry/dist/masonry.pkgd

//= require stories/video
//= require stories/bip

/*
  With turbolinks in place, js only runs on initial controller/page load,
  e.g. js does not run when going from stories#show to stories#edit
  This results in plug-ins not being initialized
  Below ensures that js runs each time a stories# page loads
  Both are needed
*/
$(document).ready(function () {
  // console.log('calling ready from stories.js - doc.ready');
  ready();
});

// $(document).on('turbolinks:load', function () {
//   console.log('calling ready from stories.js - turbolinks:load');
//   ready();  // TODO: probably don't have to run everything here
// });

/*
  wait for images to load before initializing the masonry grid
*/
$(window).on('load', function () {
  initMasonry();
});


function ready () {

  initPlugins();
  initSocialShare();
  configUnderscore();

  VIDEO_LIB.loadThumbnail();
  BIP.listeners();

  select2Listeners();
  initLinkedIn();
  editTagsListeners();
  miscListeners();
  storiesFilterListeners();
  configS3Upload();
  bootstrapSwitchListeners();
  contributionsListeners();
  storyContentEditor();
  updateSelectBoxesIfQueryString();

  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  if (isChrome)
    replaceStateOnGalleryLoad();

}

function initPlugins () {
  $('.best_in_place').best_in_place();
  $('.bs-switch').bootstrapSwitch({ size: 'small' });
  $("input[type='tel']").inputmask("999-999-9999");
  /*
    dirtyFields() plugin will apply .dirtyField class to label on input change
    (allows for color change)
    Ensure "for" attribute is present on label tag
    and matches the id attribute of the corresponding input field.
  */
  $('#story-tags-form').dirtyFields();

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

  $('#email-confirmation-editor').summernote({
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

  $('[data-toggle="popover"]').popover();

  $('#story-content').summernote({
    toolbar: [
      ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      ['fontname', ['fontname']],
      ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['height', ['height']],
      ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['codeview']],
      ['help', ['help']]
    ],
  });
}

// ref: https://codepen.io/patrickkahl/pen/DxmfG
// ref: http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
function initSocialShare() {

  $('#social-buttons .linkedin').on('click', function (e) {
    $(this).socialSharePopup(e, 550, 561);
  });
  $('#social-buttons .twitter').on('click', function (e) {
    $(this).socialSharePopup(e, 550, 253);
  });
  $('#social-buttons .facebook').on('click', function (e) {
    $(this).socialSharePopup(e, 560, 656);
  });

  $.fn.socialSharePopup = function (e, width, height) {
    // Prevent default anchor event
    e.preventDefault();
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    // Set values for window
    width = width || '550';
    height = height || '442';

    var left = ((windowWidth / 2) - (width / 2)) + dualScreenLeft;
    var top = ((windowHeight / 2) - (height / 2)) + dualScreenTop;

    // Set title and open popup with focus on it
    var strTitle = ((typeof this.attr('title') !== 'undefined') ? this.attr('title') : 'Social Share'),
        strParam = 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',resizable=no',
        objWindow = window.open(this.attr('href'), 'shareWindow', strParam).focus();
  };
}

function initLinkedIn () {

  // linkedin widgets (load IN.js library conditionally)
  if (typeof(IN) !== "object") {
    console.log("loading in.js ...");
    $.getScript('//platform.linkedin.com/in.js');
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


function editTagsListeners () {
  /*
    Remember the initial <option>s of the tag select inputs
    If user cancels changes, revert to these (skipping for now)

    var categoryTagsOptions = $('.select2-selection__rendered').eq(0).html();
    var categoryTagsVal = $('#story_category_tags_').val();
    var productCatTags = $('.select2-selection__rendered').eq(1).html();
    var productTags = $('.select2-selection__rendered').eq(2).html();
  */

  $('#story-tags-form select').on('change', function (e) {

    if ($('.edit-tags').hasClass('hidden')) {
      // un-hide the save/cancel buttons
      $('.edit-tags').toggleClass('hidden');
    }
    // console.log('category tags on change: ', $('#story_category_tags_').val());
  });

  // TODO: figure out how to reset select2 inputs
  // commented code results in error when attempting
  // to make changes after reset
  $('#edit-tags-cancel').on('click', function (e) {
    e.preventDefault();
    // reset the select input values
    // $('.select2-selection__rendered').eq(0).html(categoryTagsOptions);
    // $('#story_category_tags_').val(categoryTagsVal);
    // $('.select2-selection__rendered').eq(1).html(productCatTags);
    // $('.select2-selection__rendered').eq(2).html(productTags);
    // console.log('category tags after cancel: ', $('#story_category_tags_').val());
    // hide the save/cancel buttons
    // $('.edit-tags').toggleClass('hidden');
    // tagsFormDirty = false;
  });

}

/**
  This should only run on stories#index
 */
function updateSelectBoxesIfQueryString () {
  var $categorySelect = $("[name='category_select']"),
      $productSelect = $("[name='product_select']"),
      categorySlug = getQueryString('category'),  // slug || null
      productSlug = getQueryString('product'),
      filterId = null;

  if (categorySlug) {
    filterId = $categorySelect.find("option[data-slug='" + categorySlug + "']").val();
    $categorySelect.val(filterId).trigger('change.select2');
  }
  if (productSlug) {
    filterId = $productSelect.find("option[data-slug='" + productSlug + "']").val();
    $productSelect.val(filterId).trigger('change.select2');
  }
}

function updateGallery ($tiles) {
  setTimeout(function () {
    $('#stories-gallery').masonry()
                         .append($tiles)
                         .masonry('appended', $tiles);
    centerLogos();
  }, 400);
}

function storiesFilterListeners () {

  /**
    listen for filter selections, get filtered stories
  */
  $('.stories-filter').on('change', function () {

    var filterTag = $(this).attr('name').replace('_select', ''),
        filterId = $(this).val(),  // the database id of the selected tag
        $categorySelect = $("[name='category_select']"),
        $productSelect = $("[name='product_select']");

    $.ajax({
      url: '/stories',
      method: 'get',
      data: { filter: { tag: filterTag, id: filterId } },
      success: function (data, status, xhr) {
        getFilteredStoriesSuccess(data, true, filterTag, filterId, false);
      }
    });
  });

  window.onpopstate = function (event) {

    // console.log('pop state: ', event.state);
    var $categorySelect = $("[name='category_select']"),
        categorySelectIsPresent = $categorySelect.length,
        categoryId = categorySelectIsPresent ?
                         $categorySelect.find(':selected').val() : null,
        $productSelect = $("[name='product_select']"),
        productSelectIsPresent = $productSelect.length,
        productId = productSelectIsPresent ?
                        $productSelect.find(':selected').val() : null,
        filterTag = null,
        filterId = null;

    if (event.state) {

      filterTag = event.state.filter.tag;
      filterId = event.state.filter.id; // this may be a slug

      $.ajax({
        url: '/stories',
        method: 'get',
        data: { filter: { tag: filterTag, id: filterId } },
        success: function (data, status, xhr) {
          getFilteredStoriesSuccess(data, false, filterTag, filterId, true);
        }
      });

    /**
     * below is for Safari only - if event.state is null, this is initial page load
     * Chrome - see function ready()
     */
    } else if (categorySelectIsPresent && categoryId !== '0') {
      replaceStateOnGalleryLoad('category', categoryId);
    } else if (productSelectIsPresent && productId !== '0') {
      replaceStateOnGalleryLoad('product', productId);
    } else {
      replaceStateOnGalleryLoad('all', '0');
    }

  };  // popstate
}  // stories filters listeners

function pushStateStoriesGallery (filterTag, filterId, filterSlug) {
  // push state
  if (filterId === '0') {  // all
    history.pushState({ filter: { tag: 'all', id: '0' } }, null, '/');
  } else if (filterTag === 'category') {
    history.pushState({ filter: { tag: 'category', id: filterId } },
                      null, '/?category=' + filterSlug);
  } else if (filterTag === 'product') {
    history.pushState({ filter: { tag: 'product', id: filterId } },
                      null, '/?product=' + filterSlug);
  } else {
    // error
  }
}

function getFilteredStoriesSuccess (data, pushStateIsRequired, filterTag, filterId, isPopstate) {

  var storyTiles = JSON.parse(data.story_tiles),
      filterSlug = data.filter_slug,
      isCurator = data.is_curator,
      template = _.template($('#stories-template').html()),
      storyPath = null,
      $categorySelect = $("[name='category_select']"),
      $productSelect = $("[name='product_select']");

  // console.log('story data: ', storyTiles);

  $('#stories-gallery').empty();

  if (isPopstate) {
    $("[name='category_select'] + span").find('.select2-selection')
                                        .each(function () { $(this).blur(); });
    $("[name='product_select'] + span").find('.select2-selection')
                                       .each(function () { $(this).blur(); });
  }

  if (storyTiles.length) {
    storyTiles.forEach(function (success) {
      if (success.products.length && success.story.published) {
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

    updateGallery( $(template({ isCurator: isCurator,
                                storyTiles: storyTiles })) );

    if (pushStateIsRequired) {
      pushStateStoriesGallery(filterTag, filterId, filterSlug);
    }

    /**
      Filter select boxes are mutually exclusive
      If a category was selected, the product is 'all'
      (and vice versa)
    */
    if (filterTag === 'category' && $productSelect.length) {
      $categorySelect.val(filterId.toString()).trigger('change.select2');
      $productSelect.val('0').trigger('change.select2');
    } else if (filterTag === 'product' && $categorySelect.length) {
      $productSelect.val(filterId.toString()).trigger('change.select2');
      $categorySelect.val('0').trigger('change.select2');
    } else if (filterTag === 'all') {
      $productSelect.val('0').trigger('change.select2');
      $categorySelect.val('0').trigger('change.select2');
    }
  }
}

function replaceStateOnGalleryLoad (filterTag, filterId) {
  // calls from safari (see window.onpopstate) ...
  if (filterTag && filterId) {
    history.replaceState({ filter: { tag: filterTag, id: filterId } },
                         null, window.location.href);
  } else if ($('#stories-gallery').length) {  // if gallery page
    // calls from chrome (see function ready() ) ...
    var $categorySelect = $("[name='category_select']"),
        $productSelect = $("[name='product_select']"),
        categorySlug = getQueryString('category'),
        productSlug = getQueryString('product'),
        _filterTag = categorySlug ? 'category' : (productSlug ? 'product' : 'all'),
        _filterId = categorySlug ?
            $categorySelect.find("option[data-slug='" + categorySlug + "']")
                           .val() :
            (productSlug ? $productSelect.find("option[data-slug='" + productSlug + "']")
                                         .val() : '0');
    history.replaceState({ filter: { tag: _filterTag, id: _filterId } },
                           null, window.location.href);
  }
}

function miscListeners () {

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

  $('#approval-pdf-btn').on('click', function (e) {
    var missingInfo = $(this).data('missing-curator-info');
    if (missingInfo.length) {
      e.preventDefault();
      var flashMesg = "Can't generate document because the following Curator fields are missing: " + missingInfo.join(', ');
      flashDisplay(flashMesg, 'danger');
    }
  });
}

function bootstrapSwitchListeners() {

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

function select2Listeners () {
  // prevents the options list from showing when a tag is removed
  $('.select2').prev()
               .on('select2:unselecting', function (e) {
                 $(this).data('unselecting', true);
               })
               .on('select2:open', function (e) { // note the open event is important
                 if ($(this).data('unselecting')) {
                   $(this).removeData('unselecting'); // you need to unset this before close
                   $(this).select2('close');
                 }
               });
}

function contributionsListeners () {
  /*
   *  hide the email confirmation modal after sending
   */
  $('#confirm-email-form').on('submit', function () {
    $(this).closest('.modal-content').find('.modal-title')
                                     .addClass('hidden');
    $(this).closest('.modal-content').find('.progress')
                                     .removeClass('hidden');
  });

  /*
   *  on successful addition of linkedin profile to contributor card
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
              "//google.com/search?q=" +
              contribution.contributor.first_name + "+" +
              contribution.contributor.last_name + "+" +
              contribution.success.customer.name);
          } else {
            $research.attr('href',
              "//google.com/search?q=" +
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
   *  only one accordion panel open at a time
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
          // console.log('phone fields: ', $(this));
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

function storyContentEditor () {

  var $storyContent = $('#story-content'),
      $summernote = $storyContent.next(),
      $saveButton = $("[type='submit'][form='story-content-form']"),
      $cancelButton = $("[type='reset'][form='story-content-form']"),
      $formButtons = $("[form='story-content-form']"),
      $editor = $summernote.find('.note-editable'),
      $toolbarButtons = $summernote.find('.note-toolbar > .note-btn-group > button, .note-toolbar > .note-btn-group > .note-btn-group > button');

  // disable the editor until edit button is clicked
  $editor.attr('contenteditable', 'false')
         .css({
          'background-color': '#f5f5f5',
          'pointer-events': 'none'
         });

  $toolbarButtons.css({
                  'background-color': '#f5f5f5',
                  'pointer-events': 'none'
                 });

  $('#edit-story-content').on('click', function () {
    $(this).css({
      'pointer-events': 'none',
      color: '#e3e3e3'
    });
    $editor.attr('contenteditable', 'true')
           .css({
            'background-color': 'white',
            'pointer-events': 'auto'
           });
    $toolbarButtons.css({
                      'background-color': 'white',
                      'pointer-events': 'auto'
                    });
    $formButtons.removeClass('hidden');
  });

  $summernote.on('click', '.note-view', function () {
    if ($formButtons.prop('disabled')) {
      $formButtons.prop('disabled', false);
    } else {
      $formButtons.prop('disabled', true);
    }
  });

  // this function can be generalized and used elsewhere ...
  // $('form').has('[data-provider="summernote"]').on('reset', function () {
  $('#story-content-form').on('reset', function () {
    // revert to last saved content ...
    $storyContent.summernote('code', $storyContent.text());
    $saveButton.click();
  });
}

function initMasonry () {
  $('.grid').masonry({
    // options...
    itemSelector: '.grid-item',
    columnWidth: 220,
    isFitWidth: true
  });
  centerLogos();
  $('#stories-gallery').css('visibility', 'visible');
}

/*
  Since gettinng the image centered vertically with css is a pain,
  do it with jquery instead
*/
function centerLogos () {
  $('#stories-gallery img, .drawer-items img').each(function (image) {
    var height = $(this).outerHeight(),
        maxHeight = parseInt($(this).css('max-height')),
        diff = maxHeight - height;
    if (diff) {
      // if there is no caption for the thumbnail, there is already a
      // margin-top to compensate for this ...
      // factor this in ...
      var newMarginTop = (diff / 2) + parseInt($(this).css('margin-top'), 10);
      $(this).css('margin-top', newMarginTop);
      $(this).css('margin-bottom', diff / 2);
    }
  });
}







