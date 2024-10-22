function promoteSettingsListeners () {

  const confirmImageRemoval = ($imageCard, affectedStories) => {
    displayAffectedStories = affectedStories.slice(0, 6);
    undisplayedCount = affectedStories.length - displayAffectedStories.length
    bootbox.confirm({
      className: 'confirm-ad-image-removal',
      closeButton: false,
      title: '<i class="fa fa-warning"></i>\xa0\xa0\xa0\xa0<span>Are you sure?</span>',
      message: `
        <p>The selected image is utilized in these Promoted Stories:<p>
        <ul>
          ${displayAffectedStories.map(storyTitle => `<li>${storyTitle}</li>`).join('')}
        </ul>
        ${affectedStories.length !== displayAffectedStories.length ? 
            `<em><p style="padding-left:40px">plus ${undisplayedCount} more</p></em>` :
            ''
        }
        <p>You can remove the image and it will be replaced by the current default image of the same type (square or landscape). \ 
        The Promoted Stories will be updated to include the replacement image and no further action will be required.</p>
      `,
      buttons: {
        confirm: {
          label: 'Remove & Replace',
          className: 'btn-danger',
          callback: function () {
            // => button callbacks can't be overridden (per bootbox docs)
          }
        },
        cancel: {
          label: 'Cancel',
          className: 'btn-default'
        }
      },
      callback: function (confirmRemoval) {
        if (confirmRemoval) {
          $(this)
            .find('[data-bb-handler="confirm"]')
            .css('width', $(this).find('[data-bb-handler="confirm"]').css('width'))
            .html('<i class="fa fa-spin fa-circle-o-notch"></i>');
          $imageCard
            .find('input:checkbox[name*="_destroy"]').prop('checked', true).end()
            .find('button:submit.btn-danger').trigger('click');
          return false;  // don't close the modal yet => wait for server response
        }
      }
    });
  };
            
  $(document)
    .on('click', '.ad-image-card .btn-remove', confirmImageDeletion)

  function confirmImageDeletion(e) {
    const $imageCard = $(e.currentTarget).closest('.ad-image-card');
    const isDefaultImage = $imageCard.is('.gads-default');
    const resetInvalidImage = () => {
      $imageCard
        .addClass(`${isDefaultImage ? '' : 'hidden gads-image'}`)    // TODO make this work for logos too
        .removeClass(`${isDefaultImage ? 'ad-image-card--new' : ''}`)
        .children('.fileinput')
          .removeClass('has-error has-danger')
          .fileinput('reset')
          .find('input:file').attr('data-validate', 'false');
    }
    if ($imageCard.is('.ad-image-card--new')) {
      if (isDefaultImage) {
        const imageUrl = (
          $imageCard.children('[name*="[image_url]"]').val() || $imageCard.data('placeholder-url')
        )
        $imageCard.find('img').one('load', resetInvalidImage).attr('src', imageUrl);
      } else {
        resetInvalidImage();
      }
      $('#gads-form').validator('update');
      return false;
    }
    const dt = $('#promoted-stories-table').DataTable();
    const imageToRemove = { 
      id: $imageCard.find('[name*="[id]"]').val(),
      type: $imageCard.find('[name*="[type]"]').val()
    };
    if (!imageToRemove.id) return $imageCard.remove();
    const affectedStories = (
      ['SquareImage', 'LandscapeImage'].includes(imageToRemove.type) &&
      dt
        .rows((index, data, node) => (
          data.ads_images.some((image) => image.id == imageToRemove.id) &&
          // only need to update ads if this is the only required image of its type
          data.ads_images.filter((image) => image.type === imageToRemove.type).length === 1
        ))
        .data().toArray().map((row) => row.ads_long_headline)
    );
    if (affectedStories && affectedStories.length) {
      confirmImageRemoval($imageCard, affectedStories);
    } else {
      $imageCard
        .find('input:checkbox[name*="_destroy"]').prop('checked', true).end()
        .find('.form-group').addClass('to-be-removed');
    }
  }
}

