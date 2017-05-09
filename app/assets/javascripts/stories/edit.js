
function storiesEdit () {
  loadVideoThumbnail();
  loadCspOrPlaceholderWidgets();
}

function storiesEditListeners () {

  $(document)
    .on('shown.bs.collapse', '.contribution-card',
      function () {
        if ($(this).find('.linkedin-container').length === 0 ||
            $(this).find('.linkedin-checkbox-and-widget').hasClass('hidden')) {
          return false;
        } else {
          loadLIWidget($(this));
        }
      });

  storiesEditBIPListeners();
  storiesEditSettingsListeners();
  storiesEditVideoInputHandler();
  storiesEditCTAsListeners();
  storiesEditTagsListeners();
  storiesEditNewContributorListeners();
  storiesEditResultsListeners();
  storiesEditPromptsListeners();
  storiesEditContributionsListeners();
  storiesEditContentEditorListeners();
}

function loadCspOrPlaceholderWidgets() {

  var widgetWidth = 322,
      template = _.template($('#csp-linkedin-widget-template').html());

  // populate csp widgets and placeholder widgets;
  // the placeholders will be swapped out for linkedin widgets as they arrive
  $('.csp-widget-container').each(function () {
    var $container = $(this), contributor = {};
    contributor.first_name = $container.data('first-name');
    contributor.last_name = $container.data('last-name');
    contributor.linkedin_url = $container.data('linkedin-url');
    contributor.linkedin_title = $container.data('linkedin-title');
    contributor.linkedin_company = $container.data('linkedin-company');
    contributor.linkedin_photo_url = $container.data('linkedin-photo-url');
    contributor.linkedin_location = $container.data('linkedin-location');
    $container
      .append(template({ contributor: contributor,
                         widgetWidth: widgetWidth }))
      .imagesLoaded(function () {
         $container.find('.csp-linkedin-widget').removeClass('hidden');
       });
  });

  $('.placeholder-widget-container').each(function () {
    var $container = $(this), contributor = {};
    contributor.first_name = $container.data('first-name');
    contributor.last_name = $container.data('last-name');
    contributor.linkedin_url = $container.data('linkedin-url');
    $container
      .append(template({ loading: true,
                         contributor: contributor,
                         widgetWidth: widgetWidth }))
      .imagesLoaded(function () {
        // .csp-linkedin-widget may be a csp widget populated with data,
        // or (in this case) the placeholder widget
         $container.find('.csp-linkedin-widget').removeClass('hidden');
       });
  });
}

function loadLIWidget ($card) {
  var alreadyLoaded = $card.find('.widget-container').data('linkedin-widget-loaded') ||
                      $card.find('.csp-linkedin-widget');
  if (alreadyLoaded) {
    return false;
  } else {
    var $linkedinWidgetContainer = $card.find('.linkedin-widget-container'),
        $placeholderWidgetContainer = $card.find('.placeholder-widget-container');
    var    url = $linkedinWidgetContainer.data('url'),
        widgetWidth = 322,
        widgetMarginTop = '-' + $card.find('.placeholder-widget-container')
                                     .outerHeight()
                                     .toString() + 'px',
        $widget = $("<script type='IN/MemberProfile' " +
                            "data-id='" + url + "' " +
                            "data-format='inline' data-related='false' " +
                            "data-width='" + widgetWidth.toString() + "'></script>"),
        newWidgetPostMesgHandler = function () {
          if ($('body').hasClass('stories edit')) {
            // For Chrome, the origin property is in the event.originalEvent object.
            var  origin = event.origin || event.originalEvent.origin,
                 newWidgetId = $linkedinWidgetContainer
                                 .find('iframe').attr('id')
                                 .match(/^\w+(li_gen\w+)_provider/)[1];
            if (origin === "https://platform.linkedin.com" &&
                event.data.includes('widgetReady')) {
              var widgetReadyId = event.data.match(/^(\w+)\s/)[1];
              if (widgetReadyId === newWidgetId) {
                $linkedinWidgetContainer
                  .css('margin-top', widgetMarginTop)  // height of the placeholder container (for overlay)
                  .removeClass('hidden')
                  .closest('.widget-container')
                  .data('linkedin-widget-loaded', true);
              }
            }  // widgetReady event
          }
        };  // var declarations
    $linkedinWidgetContainer.append($widget);
    window.addEventListener('message', newWidgetPostMesgHandler, false);
    IN.parse();
    setTimeout(function () {
      if ($card.find('.widget-container').data('linkedin-widget-loaded')) {
        // success (just leave the placeholder; removing or emptying will affect layout)
      } else {
        // failure
        $placeholderWidgetContainer
          .find('.member-info > p')
          .css('color', 'red')
          .text('Profile data not available');
      }
    }, 7000);
    // remove the listener when navigating away from this page
    $(document).one('turbolinks:before-visit', function () {
      window.removeEventListener('message', newWidgetPostMesgHandler, false);
    });
  }
}

function storiesEditBIPListeners () {
  // best-in-place errors
  $(document).on('best_in_place:error', function (event, data, status, xhr) {
    var errors = JSON.parse(data.responseText);
    flashDisplay(errors.join(', '), "danger");
  });

  /*
    tabindex=-1 on these elements prevents them from gaining focus
    after a bip field is submitted (with tab)()
    also has the side-effect of keeping focus on the element,
    which we'll prevent with ...
  */
  $(document).on('focus', 'a.accordion-toggle', function () {
    var $_this = $(this);
    window.setTimeout(function () { $_this.blur(); }, 200);
  });
}

function storiesEditSettingsListeners () {

  $(document).on('switchChange.bootstrapSwitch', '.bs-switch', function (event, state) {
    $(this).parent().submit();
  });

  $(document).on('ajax:success', '#story-publish-form',
    function (event, story) {
      var $publish = $("#story_published"),
          $logoPublish = $("#story_logo_published"),
          createAd = function (story) {
            if (story.ads.length === 0 && story.published &&
                story.previous_changes.published) {
              return true;
            } else { return false; }
          },
          updateAd = function (story) {
            return false;
          };
      /*
        server may have changed values to prevent invalid state ...
        it either ...
          - turned logo_publish on to track story_publish=on
          - turned story_publish off to track logo_publish=off
      */
      if (!story.published && $publish.bootstrapSwitch('state') === true) {
        $publish.bootstrapSwitch('state', false);
      } else if (story.logo_published && $logoPublish.bootstrapSwitch('state') === false) {
        $logoPublish.bootstrapSwitch('state', true);
      }

      if (createAd(story)) {
        $.post({
          url: '/stories/' + story.id + '/adwords',
          dataType: 'script'
        });

      } else if (updateAd(story)) {
        $.ajax({
          url: '/stories/' + story.id + '/adwords',
          method: 'put',
          success: function () {

          }
        });
      }
    });

  $(document).on('click', '#approval-pdf-btn', function (e) {
    var missingInfo = $(this).data('missing-curator-info');
    if (missingInfo.length) {
      e.preventDefault();
      var flashMesg = "Can't generate document because the following Curator fields are missing: " + missingInfo.join(', ');
      flashDisplay(flashMesg, 'danger');
    }
  });

}

function storiesEditVideoInputHandler () {

  $(document).on('ajax:success',
                 ".best_in_place[data-bip-attribute='embed_url']",
                  function (event, data) {

    var res = JSON.parse(data),
        provider = res.video_info.provider,
        videoUrl = res.embed_url,
        videoId = res.video_info.id,
        $placeholder = $("<img src='" + $('.video-container').data('placeholder') + "'>"),
        inputPlaceholder = "Video URL (YouTube, Vimeo, or Wistia)",
        template = _.template($('#video-template').html());

    if (!videoUrl) {
      $('.video-container').empty().append($placeholder);

    } else if (provider === 'wistia') {  // wistia
      if (typeof Wistia === 'undefined') {
        // $.getScript(videoUrl); # apparently not required, but came from docs
        $.getScript('//fast.wistia.com/assets/external/E-v1.js');
      }
      $('.video-container')
        .empty()
        .append(template({ provider: provider,
                            videoId: videoId }));
    } else {  // youtube or vimeo
      $('.video-container')
        .empty()
        .append(template({ provider: provider,
                            videoId: videoId,
                            videoUrl: videoUrl }));
      loadVideoThumbnail();
    }

    $(".best_in_place[data-bip-attribute='embed_url']").text(videoUrl || inputPlaceholder);

  });
}

function storiesEditCTAsListeners () {
  $(document).on('change', '#story-ctas-select',
    function () {
      $('#story-ctas-submit, #story-ctas-reset').prop('disabled', false);
    });
}

function storiesEditTagsListeners () {
  $(document).on('change', '.story-tags',
    function () {
      $('#story-tags-submit, #story-tags-reset').prop('disabled', false);
    });
}

function storiesEditNewContributorListeners () {

  // separate 'shown' handler necessary for setting input focus
  $(document).on('shown.bs.modal', '.modal', function () {
    // the selector $('input:first') doesn't work for some reason
    $(this).find('#contributor_first_name').focus();
  });

  // reset new contributor modal form when the modal closes
  $(document).on('hidden.bs.modal', '#new-contributor-modal', function () {
    // input elements to default values (first, last, email)
    $(this).find('form')[0].reset();
    // select2 inputs to default values (role, referred-by)
    $('.new-contributor-role').val('customer');
    // trigger necessary; not sure why ... http://stackoverflow.com/questions/19639951
    $('.new-contributor-referrer').val('').trigger('change');
  });

  // blur buttons after they're clicked
  $(document).on('focus', '#new-contributor-button', function () {
    var _this = $(this);
    window.setTimeout(function () {
      _this.blur();
    }, 220);
  });

}

function storiesEditResultsListeners () {
  /*
    new result form - submit is disabled until value entered.
    listens for input event instead of change event, as latter only fires after
    focus moves away from input field, while former fires after all edits
  */
  $(document).on('input', '#new-result', function () {
    if ($(this).val().length > 0)
      $(this).closest('form').find('button').prop('disabled', false);
    else
      $(this).closest('form').find('button').prop('disabled', true);
  });

   // delete a result
  $(document).on('click', '.delete-result', function () {
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

function storiesEditPromptsListeners () {

  $(document).on('input', '#new-prompt', function () {
    if ($(this).val().length > 0)
      $(this).closest('form').find('button').prop('disabled', false);
    else
      $(this).closest('form').find('button').prop('disabled', true);
  });

  // delete a prompt
  $(document).on('click', '.delete-prompt', function () {
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

function storiesEditContributionsListeners () {

  // remote form doesn't submit after a turbolinks visit, so do it manually;
  // problem  appears limited to modal (other remote forms submit ok after Turbolinks visit)
  // note: but email confirmation works ok??
  $(document).on('click', '#new-contributor-modal input[type="submit"]',
    function (event) {
      event.preventDefault();
      $.rails.handleRemote($('#new-contributor-modal form'));
    });

  // hide the email confirmation modal after sending
  $(document).on('submit', '#confirm-email-form', function () {
    $(this).closest('.modal-content').find('.modal-title')
                                     .addClass('hidden');
    $(this).closest('.modal-content').find('.progress')
                                     .removeClass('hidden');
  });

  // adding linkedin widget to contribution card
  $(document).on("ajax:success", ".best_in_place[data-bip-attribute='linkedin_url']",
    function (event) {
      var urlInput = $(this), url = $(this).text(), widgetWidth = 322,
          validUrl = function ($url) {
            // detect valid url by comparing to the input placeholder
            return $url.html() !== urlInput.attr('data-bip-placeholder');
          },
          template = _.template($('#csp-linkedin-widget-template').html()),
          $card = $(this).closest('.contribution-card'),
          $checkboxAndWidget = $card.find('.linkedin-checkbox-and-widget'),
          $widgetContainer = $card.find('.widget-container'),
          $research = $card.find('.research'),
          $placeholderWidgetContainer =
            $("<div class='placeholder-widget-container text-center'" +
                   "style='min-height:128px'>" +
              "</div>"),
          $linkedinWidgetContainer =
            $("<div class='linkedin-widget-container hidden text-center' " +
                   "style='min-height:128px;position:relative'>" +
                "<script type='IN/MemberProfile' " +
                        "data-id='" + url + "' " +
                        "data-format='inline' data-related='false' " +
                        "data-width='" + widgetWidth.toString() + "'></script>" +
              "</div>"),
          contributor = {
            first_name: $card.find('.contributor-name').text().trim().split(' ')[0],
            last_name: $card.find('.contributor-name').text().trim().split(' ')[1],
            linkedin_url: url
          },
          newWidgetPostMesgHandler = function ($linkedinWidgetContainer) {
            return function (event) {
              if ($('body').hasClass('stories edit')) {
                // For Chrome, the origin property is in the event.originalEvent object.
                var  origin = event.origin || event.originalEvent.origin,
                     newWidgetId = $linkedinWidgetContainer
                                     .find('iframe').attr('id')
                                     .match(/^\w+(li_gen\w+)_provider/)[1];
                if (origin === "https://platform.linkedin.com" &&
                    event.data.includes('widgetReady')) {
                  var widgetReadyId = event.data.match(/^(\w+)\s/)[1];
                  if (widgetReadyId === newWidgetId) {
                    $linkedinWidgetContainer
                      .css('margin-top', '-128px')  // height of the placeholder container (for overlay)
                      .removeClass('hidden')
                      .closest('.widget-container')
                      .data('linkedin-widget-loaded', true);
                  }
                }  // widgetReady event
              }
            };
          };

      // remove whatever is there
      $widgetContainer.empty();
      $widgetContainer.data('linkedin-widget-loaded', false);

      if (!validUrl(urlInput)) {  // blank or invalid (not currently validating)
        $checkboxAndWidget.addClass('hidden');

        // update the research button
        // TODO: better way to have all this data available
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

      } else {
        $checkboxAndWidget.removeClass('hidden');
        $widgetContainer
          .append($placeholderWidgetContainer)
          .append($linkedinWidgetContainer)
          .find('.placeholder-widget-container')
          .append(template({
                    loading: true,
                    contributor: contributor,
                    widgetWidth: widgetWidth
                  }))
          .imagesLoaded(function () {
            // unhide placeholder
            $('.csp-linkedin-widget.hidden').removeClass('hidden');
          });
        window.addEventListener('message', newWidgetPostMesgHandler($linkedinWidgetContainer), false);
        IN.parse();
        setTimeout(function () {
          // $widgetContainer = $card.find('.widget-container');
          // time's up -> remove the post message listener
          window.removeEventListener('message', newWidgetPostMesgHandler, false);
          // did the linkedin widget arrive?
          if ($widgetContainer.data('linkedin-widget-loaded')) {
            // success
          } else {
            // failure
            $placeholderWidgetContainer
              .find('.member-info > p')
              .css('color', 'red')
              .text('Profile data not available');
          }
        }, 8000);
        $research.attr('href', url);
        $research.html("<i class='fa fa-linkedin-square bip-clickable-fa'>");
      }
  });

  $(document).on('change', '.curator-linkedin-checkbox', function () {
    $(this).submit();
  });

  $(document).on('ajax:success', '.curator-linkedin-checkbox', function (e) {
    var $checkboxForm = $(this);
    $checkboxForm.next().removeClass('hidden');
    setTimeout(function () {
      $checkboxForm.next().addClass('hidden');
    }, 2000);
  });

  /*
   *  only one accordion panel open at a time
  */
  $(document).on('click', '.contribution-card.accordion-toggle', function () {
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
  $(document).on("ajax:success", ".best_in_place[data-bip-attribute='notes']",
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
  $(document).on("ajax:success", ".best_in_place[data-bip-attribute='phone']",
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

function storiesEditContentEditorListeners () {

  $(document).on('click', '#edit-story-content', function () {
    var $storyContentEditor = $('#story-content-editor'),
        $summernote = $storyContentEditor.next(),
        $editor = $summernote.find('.note-editable'),
        $saveButton = $("[type='submit'][form='story-content-form']"),
        $formButtons = $("[form='story-content-form']"),
        $toolbarButtons = $summernote.find('.note-toolbar > .note-btn-group > button, .note-toolbar > .note-btn-group > .note-btn-group > button');
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

  // this function can be generalized and used elsewhere ...
  // $('form').has('[data-provider="summernote"]').on('reset', function () {
  $(document).on('reset', '#story-content-form', function () {
    // revert to last saved content ...
    var $storyContentEditor = $('#story-content-editor'),
        $saveButton = $("[type='submit'][form='story-content-form']");
    $storyContentEditor.summernote('code', $storyContentEditor.text());
    $saveButton.click();
  });

  $(document).on('click', '.note-view', function () {
    var $formButtons = $("[form='story-content-form']");
    if ($formButtons.prop('disabled')) {
      $formButtons.prop('disabled', false);
    } else {
      $formButtons.prop('disabled', true);
    }
  });
}


