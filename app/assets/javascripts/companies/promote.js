
function promote () {

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

  $('td.status-dropdown a.disabled').tooltip({
    container: 'body'
  });

}

function promoteListeners () {

  $(document)
    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings-tab-pane',
      function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
      })

    .on('click', 'td.status-dropdown .dropdown-menu a.pause, td.status-dropdown .dropdown-menu a.enable',
      function () {

        $(this).closest('.dropdown')
               .find('a.dropdown-toggle')
               .toggleClass('enabled paused')
               .children(':first')
               .toggleClass('fa-play fa-pause');
        $(this).closest('.dropdown-menu').children('li').toggle();

        $.ajax({
          url: '/stories/' + $(this).closest('tr').data('story-id') + '/adwords_config',
          method: 'put',
          data: {
            adwords_config: {
              enabled: $(this).attr('class') === 'enable' ? true : false,
            }
          },
          dataType: 'script'
        });

      })

    // on clicking a sponsored story thumbnail,
    // open the image select modal and create the story form
    .on('click', 'td.sponsored-story-image .thumbnail',
      function () {
        var $modal = $('#image-select-modal'),
            storyId = $(this).closest('tr').data('story-id'),
            template = _.template( $('#image-select-form-template').html() );
        $modal.find('.modal-footer').empty()
              .append(template({ storyId: storyId }));
        $modal.modal('show');
      })

    .on('click', '#image-select-modal .thumbnail',
      function () {
        if ($(this).hasClass('selected')) {
          return false;
        } else {
          var selectedImageId = $(this).data('image-id');
          $(this).addClass('selected');
          // update the form's hidden field for image id
          $(this).closest('.modal-content').find('input[type="hidden"]')
                 .val(selectedImageId);
          $('#image-select-modal .thumbnail')
            // thumbnail is the raw html, $(this) is jquery
            .each(function (index, thumbnail) {
              if ($(this).data('image-id') !== selectedImageId) {
                $(this).removeClass('selected');
              }
            });
        }
      })

    .on('hidden.bs.modal', '#image-select-modal',
      function () {
        $(this).find('.modal-footer').empty();
        $(this).find('.thumbnail').removeClass('selected');
      })

    // ad previews - separate window
    .on('click', '.preview-window a',
      function () {
        var storyId = $(this).closest('tr').data('story-id');
        window.open('/stories/' + storyId +
                    '/sponsored_story_preview', '_blank');
      })

    .on('click', 'button.new-adwords-image',
      function () {

        var $imagesList = $('ul.adwords-images'),
            template = _.template( $('#adwords-image-template').html() );

        $imagesList.append( template({ image_index: $imagesList.find('li').length }) );

        initS3Upload(); // init S3 for dynamically added file input

        $('li.new-adwords-image input[type="file"]')[0].click();

      })

    .on('change.bs.fileinput', 'li.new-adwords-image',
      function () {
        $(this)
          .removeClass('hidden new-adwords-image')
          .find('input[type="file"]').addClass('hidden');  // doesn't work if the input has class: hidden from the get-go
      })

    .on('click', '.adwords-default .change-image',
      function () {
        var $previewImg = $(this).closest('.fileinput').children('.fileinput-preview img');
        if ($previewImg.attr('src')) {
          // click on the preview
          $(this).closest('.fileinput').children('.thumbnail')[1].click();
        } else {
          // click on the placeholder
          $(this).closest('.fileinput').children('.thumbnail')[0].click();
        }
      })

    .on('click', 'li.adwords-image .change-image',
      function () {
        $(this).closest('.fileinput').children('.thumbnail')[0].click();
      })

    .on('click', 'li.adwords-image .remove-image',
      function () {
        $(this).closest('.fileinput')
               .children('.thumbnail')
               .toggleClass('to-be-removed');
        var $destroy = $(this).closest('.fileinput').find(':checkbox');
        $destroy.prop('checked', !$destroy.prop('checked'));
      });

}











