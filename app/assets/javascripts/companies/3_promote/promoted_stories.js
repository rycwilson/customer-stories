
function promotedStoriesListeners () {

  $(document)
    .on('show.bs.modal', '#ads-images-modal', (e) => {
      const $modal = $(e.target);
      const rowData = $('#promoted-stories-table').DataTable().row($(e.relatedTarget).closest('tr')).data();
      const selectedImageIds = [];
      const { id: storyId, title: storyTitle, topic_ad: topicAd, retarget_ad: retargetAd, ads_images: adsImages } = rowData;
      $modal
        .find('.modal-header .story-title').text(storyTitle).end()
        .find('li.ad-image-card')
          .each((i, li) => {
            const imageId = $(li).data('image-id');
            if (adsImages.find(adImage => adImage.id === imageId)) {
              selectedImageIds.push(imageId);
              $(li).addClass('selected').insertBefore($(li).prevAll('li:first-of-type'));
            }
          })
          .end()
        .find('.modal-footer')
          .append(
            _.template($('#ads-images-form-template').html())({ 
              storyId, selectedImageIds, topicAdId: topicAd.id, retargetAdId: retargetAd.id 
            })
          )
          .end()
        .find('.modal-body .tab-content').removeClass('hidden');
    })

    .on('click', '#ads-images-modal li.ad-image-card', (e) => {
      const $modal = $('#ads-images-modal');
      const $imageCard = $(e.currentTarget);
      const $list = $imageCard.parent();
      const imageId = $imageCard.data('image-id');
      const missingRequiredImages = (
        $imageCard.is('.selected') && 
        $list.is('.ad-image-selections') &&
        (
          ($imageCard.is('.gads-image--square') && $imageCard.parent().children('.gads-image--square.selected').length === 1) ||
          ($imageCard.is('.gads-image--landscape') && $imageCard.parent().children('.gads-image--landscape.selected').length === 1)
        )
      );
      const destroyPopover = (e) => {
        if ($(e.target).closest('.popover.ads-images').length) {
          return false;
        } else {
          $('.popover.ads-images').popover('destroy');
          $('#ads-images-modal').off('click', destroyPopover)
        }
      };
      const showPopover = (type) => {
        const content = type === 'required' ?
          '<p style="margin: 0">Promoted Story requires at least one square marketing image and at least one landscape marketing image.</p>' :
          `<p style="margin: 0">
            Promoted Story is limited to a maximum of ${$list.is('.ad-image-selections') ? '15 marketing images' : '5 logos'}.
          </p>`.trim();
        $imageCard
          .popover({
            container: '#ads-images-modal',
            html: true,
            content: content,
            placement: 'right',
            template: '<div class="popover ads-images" style="padding: 0" role="tooltip"><div class="arrow"></div><div class="popover-title" style="display: flex; align-items: center; border-top-left-radius: 5px; border-top-right-radius: 5px; background-color: #f2dede; color: #a94442"></div><div class="popover-content" style="padding: 10px 14px"></div></div>',
            // removed this from title: <button type="button" class="close"><i class="fa fa-remove"></i></button>
            title: `<i class="fa fa-warning"></i>&nbsp;&nbsp;${type === 'required' ? 'Required image' : 'Limit reached'}`
          })
          .popover('show');
        $(document.body).on('click', destroyPopover);
      };
      const maxImagesSelected = () => {
        return $list.children('.selected').length === parseInt($list.data('max'), 10);
      };
      if ($imageCard.is(':not(.selected)') && maxImagesSelected()) {
        showPopover('max');
        return false;
      } else if (missingRequiredImages) {
        showPopover('required');
        return false;
      }
      $imageCard.toggleClass('selected');
      if ($imageCard.is('.selected')) {
        $modal.find('input[name*="image_ids"]').last().after(`
          <input type="hidden" name="story[topic_ad_attributes][adwords_image_ids][]" value="${imageId}">
          <input type="hidden" name="story[retarget_ad_attributes][adwords_image_ids][]" value="${imageId}">
        `);
      } else {
        $modal.find(`input[name*="image_ids"][value="${imageId}"]`).remove();
      }
      $modal.find('button:submit').prop('disabled', false);
      maxImagesSelected() ? $list.addClass('max-selected') : $list.removeClass('max-selected');
    })

    .on('submit', '#ads-images-form', function () {
      var storyId = $(this).attr('action').split('/')[2];
      $('tr[data-story-id="' + storyId + '"]').attr('data-submitted', true);
    })

    // reset the modal
    .on('hidden.bs.modal', '#ads-images-modal', (e) => {
      $(e.target)
        .find('.modal-footer').empty().end()  // clear the form
        .find('li.ad-image-card').removeClass('selected').end()
        .find('.tab-content').addClass('hidden').end()
        .find('button:submit').prop('disabled', true);
    })

    .on('click', 'td.promoted-story-title', (e) => {
      const $row = $(e.currentTarget).parent();
      // if ($row.find('.click-blocker:visible').length) return false;
      openPromotedStoriesEditor(promotedStoriesEditor, $row);
    })

    .on('input', 'td.promoted-story-title textarea', (e) => {
      $(e.target).closest('td')
        .removeClass('form-is-clean')
        .find('.btn-success').removeClass('disabled');
    })

    .on('click', '#promoted-stories-table .flash button.close', (e) => {
      const $row = $(e.target).closest('tr');
      $('#promoted-stories-table').DataTable().row($row).invalidate().draw();
      $row
        .attr('data-submitted', '')
        .find('td.flash > div').removeClass('alert alert-danger').end()
        .children().toggle();
    })

    // .on('switchChange.bootstrapSwitch', 'input.promote-control', function (e) {
    //   // console.log('switchChange')
    //   var $input = $(this),
    //       isEnabled = $input.bootstrapSwitch('state'),  // true or false
    //       $switch = $input.closest('.bootstrap-switch'),
    //       $form = $switch.closest('form');
    //   $switch
    //     .find(isEnabled ? '.bootstrap-switch-handle-on' : '.bootstrap-switch-handle-off')
    //       .find('.fa-spin, ' + (isEnabled ? '.fa-play' : '.fa-pause'))
    //         .toggle()
    //         .end()
    //       .end()
    //     .next()
    //       .children('.help-block')
    //         .hide()  // will show when the row gets drawn
    //         .end()
    //       .end()
    //     .nextAll('input[type="checkbox"]')
    //       .prop('checked', isEnabled)
    //       .end()
    //     .closest('tr')
    //       .attr('data-submitted', true);
    //   $form.submit();
    // })

    // .on('click', '.bootstrap-switch-wrapper', function () {
    //   => click only registers when it's on .bootstrap-switch-label (not .bootstrap-switch-handle)
    // })
}