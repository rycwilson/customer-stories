
function promotedStoriesListeners () {

  $(document)

    // story image select
    .on('click', 'td.promoted-story-image .thumbnail', function () {
      var $modal = $('#ads-images-modal'),
          formTemplate = _.template($('#ads-images-form-template').html()),
          dt = $('#promoted-stories-table').DataTable();
          $tr = $(this).closest('tr'),
          storyId = dt.row($tr).data().id,
          topicAdId = dt.row($tr).data().topic_ad.id,
          retargetAdId = dt.row($tr).data().retarget_ad.id,
          selectedImageIds = [],
          adsImages = $('#promoted-stories-table').DataTable().row($tr).data().ads_images,
          currentImageUrl = $(this).children('img').attr('src');

      // remove any query param that was used to refresh an image
      if (currentImageUrl.match(/\?\d+/)) {
        currentImageUrl = currentImageUrl.slice(0, currentImageUrl.lastIndexOf('?'));
      }
      $modal.find('.modal-header .story-title')
              .text($tr.find('td.promoted-story-title').text()).end()
            .find('li')
              .each(function (adImage) {
                var $list = $(this).closest('ul'),
                    imageId = $(this).data('image-id');
                if (adsImages.find(function (ad_image) { return ad_image.id === imageId; })) {
                  selectedImageIds.push(imageId);
                  $(this).addClass('selected')
                         .insertBefore($list.children('li').first())
                }
              }).end()
            .find('.modal-footer').append(
                formTemplate({
                  storyId: storyId,
                  topicAdId: topicAdId,
                  retargetAdId: retargetAdId,
                  selectedImageIds: selectedImageIds
                })
              ).end()
            .modal('show');
    })

    .on('click', '#ads-images-modal li', function () {
      var $modal = $('#ads-images-modal'),
          $li = $(this),
          $list = $(this).closest('ul'),
          imageId = $(this).data('image-id'),
          maxImagesExceeded = $li.is(':not(.selected)') && $list.is('.max-selected'),
          missingRequiredImages = (
            $li.is('.selected') && $list.is('.marketing') &&
            (($li.is('.gads-image--square') && $list.find('.gads-image--square.selected').length === 1) ||
             ($li.is('.gads-image--landscape') && $list.find('.gads-image--landscape.selected').length === 1))
          ),
          destroyPopover = function (e) {
            if ($(e.target).closest('.popover.ads-images').length) {
              return false;
            } else {
              $('.popover.ads-images').popover('destroy');
              $('#ads-images-modal').off('click', destroyPopover)
            }
          }
          showPopover = function (type) {
            var content = type === 'required' ?
                  '<p style="margin: 0">Promoted Story requires at least one square marketing image and at least one landscape marketing image.</p>' :
                  '<p style="margin: 0">Promoted Story is limited to a maximum of ' + ($list.is('.marketing') ? '15 marketing images' : '5 logos') + '.</p>'
            $li.popover({
              container: '#ads-images-modal',
              html: true,
              content: content,
              placement: 'right',
              template: '<div class="popover ads-images" style="padding: 0" role="tooltip"><div class="arrow"></div><div class="popover-title" style="display: flex; align-items: center; border-top-left-radius: 5px; border-top-right-radius: 5px; background-color: #f2dede; color: #a94442"></div><div class="popover-content" style="padding: 10px 14px"></div></div>',
              // removed this from title: <button type="button" class="close"><i class="fa fa-remove"></i></button>
              title: '<i class="fa fa-warning"></i>&nbsp;&nbsp;' +
                      (type === 'required' ? 'Required image' : 'Limit reached')
            }).popover('show')
            $('body').on('click', destroyPopover)
          }
          listIsFull = function () {
            return $list.is('.marketing') && $list.find('li.selected').length === 15 ||
                   $list.is('.logos') && $list.find('li.selected').length === 5;
          };
      if (maxImagesExceeded) {
        showPopover('max');
        return false;
      } else if (missingRequiredImages) {
        showPopover('required');
        return false;
      }
      $(this).toggleClass('selected');
      if ($(this).hasClass('selected')) {
        $('#ads-images-form input[name*="image_ids"]').last().after(
          '<input type="hidden" name="story[topic_ad_attributes][adwords_image_ids][]" value="' + imageId + '">' +
          '<input type="hidden" name="story[retarget_ad_attributes][adwords_image_ids][]" value="' + imageId + '">'
        )
      } else {
        $('#ads-images-form input[name*="image_ids"][value="' + imageId + '"]').remove();
      }
      $modal.find('button[type="submit"]').prop('disabled', false);
      listIsFull() ? $list.addClass('max-selected') : $list.removeClass('max-selected');
    })

    // reset the modal
    .on('hidden.bs.modal', '#ads-images-modal', function () {
      $(this)
        .find('.modal-footer').empty().end()  // clear the form
        .find('li').removeClass('selected').end()
        .find('button[type="submit"]').prop('disabled', true);
    })

    // change long headline
    .on('click', 'td.promoted-story-title', function () {
      var $row = $(this).parent();
      openPromotedStoriesEditor(promotedStoriesEditor, $row);
    })


    // change status
    // 1 - toggle the hidden checkbox (retarget ad)
    // 2 - submit the form
    // TODO: error handling
    .on('switchChange.bootstrapSwitch', 'input.promote-control', function () {
      var $switch = $(this),
          $switchContainer = $switch.closest('.bootstrap-switch-container'),
          isEnabled = $switch.bootstrapSwitch('state');  // true or false
      $switchContainer
        .find(isEnabled ? '.bootstrap-switch-handle-on' : '.bootstrap-switch-handle-off')
        .find('.fa-spin, ' + (isEnabled ? '.fa-play' : '.fa-pause')).toggle()
      $switch.closest('.bootstrap-switch')
             .nextAll('input[type="checkbox"]')
             .prop('checked', isEnabled)
             .closest('form')
               // .data('submitted', true)
               .find('.help-block').hide().end()
               .submit();
    })
    .on('click', '.bootstrap-switch-wrapper', function (e) {
      var $form = $(this).find('form');
      if ($form.data('submitted')) e.preventDefault();
      $form.attr('data-submitted', 'true');

      // it will show when the response reinitializes bs-switch
      $(this).next().children('.help-block').hide();
    })
    .on('input', 'td.promoted-story-title textarea', function (e) {
      $(this).closest('td')
             .removeClass('save-disabled')
             .find('.btn-success')
             .removeClass('disabled');
    })

    // ad previews - separate window
    .on('click', '.promoted-story-actions .preview', function () {
      var dt = $('#promoted-stories-table').DataTable(),
          story = dt.row($(this).closest('tr')).data();
      window.open(
        '/promote/preview/' + story.slug, '_blank'
      );
    });

}