
//= require ./promoted_stories
//= require ./promote_settings
//= require ./image_select_modal

function promote () {
}

function promoteListeners () {

  promotedStoriesListeners();
  promoteSettingsListeners();
  imageSelectModalListeners();

  $(document)

    // changing the scroll-on-focus offset for bootstrap validator isn't working,
    // so do this instead...
    .on('click', 'a[href="#promote-settings-tab-pane"]', function () {
      if ($('#company_adwords_short_headline').val() === '') {
        var position = $(window).scrollTop();
        $('#company_adwords_short_headline').focus();
        $(window).scrollTop(position);
      }
    })

    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings-tab-pane', function () {
      $('[data-toggle="tooltip"]').tooltip('hide');
    });

}

function initPromoteSettingsValidator () {
  // this is having no effect, wtf.
  // => focus: false
  // $.fn.validator.Constructor.FOCUS_OFFSET = 200;
  $('#promote-settings-form').validator({
    focus: false,
    custom: {
      'image-requirements': function ($fileInput) {
        var $img = $fileInput.closest('.fileinput').find('.fileinput-exists img'),
            minWidth = $fileInput.data('image-requirements').split('x')[0],
            minHeight = $fileInput.data('image-requirements').split('x')[1],
            width = $img[0].naturalWidth,
            height = $img[0].naturalHeight,
            type = minWidth / minHeight === 1 ? 'logo' : 'landscape',
            ratio = width / height;

        // TODO: check file size
        // http://stackoverflow.com/questions/39488774

        if (width < minWidth || height < minHeight) {
          return "Image too small";
        // ratio must be 1.91 +/- 1%
        } else if ( type === 'landscape' && (ratio < 1.8909 || ratio > 1.929) ||
                    type === 'logo' && (ratio < 0.99 || ratio > 1.01) ) {
          return "Bad aspect ratio";
        }
      }
    }
  });
}

function promoteTooltips () {
  // add a tooltip message to stories that don't have an image
  $('#promoted-stories-table').find('img[src=""]').each(
    function () {
      if ( $('#ad-image-select-modal li').length === 0 ) {
        $(this).closest('.fileinput')
          .tooltip({
            container: 'body',
            placement: 'top',
            title: 'To assign an image to this Sponsored Story, upload images under Settings'
          });
      }
    });

  $('td.status-dropdown a.disabled').tooltip({
    container: 'body'
  });

  $('td.contribution, td.feedback')
    .popover({
      container: 'body',
      template: '<div class="popover" style="max-width:360px" role="tooltip"><div class="arrow"></div><h3 class="popover-title label-secondary"></h3><div class="popover-content"></div></div>'
    });
}

function promotePopovers () {
  $('.adwords-logo.image-requirements, .adwords-image.image-requirements')
    .popover({
      html: true,
      container: 'body',
      template: '<div class="popover" style="max-width:500px" role="tooltip"><div class="arrow"></div><h3 class="popover-title label-secondary"></h3><div class="popover-content"></div></div>',
      content: function () {
        return '<ul>' +
                 '<li><strong>Minimum dimensions</strong>: ' + $(this).data('min') + ' pixels</li>' +
                 '<li><strong>Greater than minimum dimensions</strong>: Within 1% of the ' + $(this).data('ratio') + ' ratio</li>' +
                 '<li><strong>Suggested dimensions</strong>: ' + $(this).data('suggest') + ' pixels</li>' +
                 '<li><strong>Maximum size</strong>: 1MB (1,048,576 bytes)</li>' +
               '</ul>';
      }
    });
}










