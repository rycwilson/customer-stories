
function promotedStoriesListeners () {

  $(document)

    // story image select
    .on('click', 'td.promoted-story-images .thumbnail', function () {
      var $modal = $('#ads-images-modal'),
          formTemplate = _.template($('#ads-images-form-template').html()),
          dt = $('#promoted-stories-table').DataTable();
          $tr = $(this).closest('tr'),
          storyId = dt.row($tr).data().id,
          topicAdId = dt.row($tr).data().topic_ad.id,
          retargetAdId = dt.row($tr).data().retarget_ad.id,
          selectedImageIds = [],
          adsImages = $('#promoted-stories-table').DataTable().row($tr).data().ads_images;
          // currentImageUrl = $(this).children('img').attr('src');

      // remove any query param that was used to refresh an image
      // if (currentImageUrl.match(/\?\d+/)) {
      //   currentImageUrl = currentImageUrl.slice(0, currentImageUrl.lastIndexOf('?'));
      // }
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

    .on('submit', '#ads-images-form', function () {
      var storyId = $(this).attr('action').split('/')[2];
      $('tr[data-story-id="' + storyId + '"]').attr('data-submitted', true);
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
      if ($(this).find('.click-blocker:visible').length) return false;
      openPromotedStoriesEditor(promotedStoriesEditor, $row);
    })

    .on('switchChange.bootstrapSwitch', 'input.promote-control', function (e) {
      // console.log('switchChange')
      var $input = $(this),
          isEnabled = $input.bootstrapSwitch('state'),  // true or false
          $switch = $input.closest('.bootstrap-switch'),
          $form = $switch.closest('form');
      $switch
        .find(isEnabled ? '.bootstrap-switch-handle-on' : '.bootstrap-switch-handle-off')
          .find('.fa-spin, ' + (isEnabled ? '.fa-play' : '.fa-pause'))
            .toggle()
            .end()
          .end()
        .next()
          .children('.help-block')
            .hide()  // will show when the row gets drawn
            .end()
          .end()
        .nextAll('input[type="checkbox"]')
          .prop('checked', isEnabled)
          .end()
        .closest('tr')
          .attr('data-submitted', true);
      $form.submit();
    })

    // .on('click', '.bootstrap-switch-wrapper', function () {
    //   => click only registers when it's on .bootstrap-switch-label (not .bootstrap-switch-handle)
    // })

    .on('input', 'td.promoted-story-title textarea', function (e) {
      $(this).closest('td')
             .removeClass('form-is-clean')
             .find('.btn-success')
             .removeClass('disabled');
    })

    .on('change', '#ads-preview-select', function () {
      var $select = $(this);
      if ($select.val()) {
        window.open('/promote/preview/' + $select.val(), '_blank');
        $select.val(null).trigger('change');
        // should be able to blur $select by removing class select2-container--focus from $select.next(),
        // but for some reason there are inconsistent results when attempting to do this
      }
    })

    .on('click', '#promoted-stories-table .flash button.close', function () {
      var $row = $(this).closest('tr');
      $('#promoted-stories-table').DataTable().row($row).invalidate().draw();
      $row.attr('data-submitted', '')
          .find('td.flash > div')
            .removeClass('alert alert-danger')
            .end()
          .children()
            .toggle();
    })

}