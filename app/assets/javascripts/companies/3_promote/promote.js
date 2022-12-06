
//= require ./promoted_stories
//= require ./gads_form

function promote () {
  // console.log('promote')
  const imageHasPersisted = ($img) => $img.attr('src').includes('http');
  const setCardClassName = ($imageCard, type) => {
    // console.log(`setCardClassName(${type})`, $imageCard.prop('class'))
    const typeClassName = type ? `$&--${type.match(/Square|Landscape/)[0].toLowerCase()}` : '';
    $imageCard.attr(
      'class',
      $imageCard.attr('class')
        //.replace('hidden', '')
        .replace(/gads-(image|logo)/, typeClassName)
        .concat($imageCard.is('.gads-default') ? ' ad-image-card--new' : '') 
    );
  };

  // http://stackoverflow.com/questions/39488774
  const validateFileSize = ($fileInput) => {
    console.log('validating file size...')
    if ($fileInput[0].files[0].size > $fileInput.data('max-file-size')) {
      //$imageCard.removeClass('ad-image-card--uploading');
      return 'Image file is too big';
    }
  }

  // only want to validate new images => a url indicates an existing image
  const validateImageDimensions = ($fileInput, justChecking) => {
    // console.log('validating image dimensions...')

    const $img = $fileInput.closest('.form-group').find('img');
    if (imageHasPersisted($img)) return false;

    const $imageCard = $fileInput.closest('.ad-image-card');
    const collection = $fileInput.data('collection');
    const width = $img[0].naturalWidth;
    const height = $img[0].naturalHeight;
    const aspectRatio = width / height;
    const hasCorrectAspectRatio = (requiredAspectRatio) => {
      const aspectRatioTolerance = Number($fileInput.data('aspect-ratio-tolerance')); 
      const plusMinus = aspectRatioTolerance * requiredAspectRatio;
      return (
        aspectRatio >= (requiredAspectRatio - plusMinus) && 
        aspectRatio <= (requiredAspectRatio + plusMinus)
      );
    }
    const { 
      SquareImage: { width: squareImageMin }, 
      LandscapeImage: { 
        width: landscapeImageMinWidth, 
        height: landscapeImageMinHeight, 
        aspect_ratio: landscapeImageAspectRatio
      }, 
      SquareLogo: { width: squareLogoMin }, 
      LandscapeLogo: {
        width: landscapeLogoMinWidth,
        height: landscapeLogoMinHeight ,
        aspect_ratio: landscapeLogoAspectRatio
      }
    } = $fileInput.data('min-dimensions');
    const isSquareImage = (
      width >= squareImageMin && 
      height >= squareImageMin && 
      hasCorrectAspectRatio(1)
    );
    const isLandscapeImage = (
      width >= landscapeImageMinWidth &&
      height >= landscapeImageMinHeight &&
      hasCorrectAspectRatio(landscapeImageAspectRatio)
    );
    const isSquareLogo = (
      width >= squareLogoMin && 
      height >= squareLogoMin && 
      hasCorrectAspectRatio(1)
    );
    const isLandscapeLogo = (
      width >= landscapeLogoMinWidth &&
      height >= landscapeLogoMinHeight && 
      hasCorrectAspectRatio(landscapeLogoAspectRatio)
    );
    const isValid = (() => {
      const defaultType = $fileInput.data('default-type');
      return defaultType ? (
          (defaultType === 'SquareImage' && isSquareImage) ||
          (defaultType === 'LandscapeImage' && isLandscapeImage) ||
          (defaultType === 'SquareLogo' && isSquareLogo) ||
          (defaultType === 'LandscapeLogo' && isLandscapeLogo)
        ) : (
          (collection === 'images' && (isSquareImage || isLandscapeImage)) || 
          (collection === 'logos' && (isSquareLogo || isLandscapeLogo))
        );
    })();
    const type = isValid ? 
      (collection[0].toUpperCase() + collection.slice(1))
        .replace(/^/, isSquareImage || isSquareLogo ? 'Square' : 'Landscape')
        .replace(/s$/, '') : 
      '';
    if (!$fileInput.data('default-type')) setCardClassName($imageCard, type);
    if (isValid) {
      $imageCard.children('input[name*="[type]"]').val(type);
    } else {
      return 'Image is wrong size';
    }
  }

  const initFormValidator = () => {
    $('#gads-form').validator({
      focus: false,
      disable: false,
      custom: {
        'max-file-size': validateFileSize,
        'min-dimensions': validateImageDimensions,
        'required-image': function ($fileInput) {
          console.log('checking for required image (skipping)...', $fileInput)
        }
      }
    });
  }
      
  const initPopovers = function () {
    $('#gads-form .image-requirements')
      .popover({
        html: true,
        container: 'body',
        placement: 'auto',
        template: `
          <div class="popover image-requirements" role="tooltip">
            <div class="arrow"></div>
            <h3 class="popover-title label-secondary"></h3>
            <div class="popover-content"></div>
          </div>
        `,
        content: function () {
          return `
            <h4><strong>Square ${$(this).is('.marketing') ? 'Image' : 'Logo'}</strong></h4>
            <span>(${$(this).is('.marketing') ? 'required' : 'optional/recommended'})</span>
            <ul>
              <li>Minimum dimensions: ${$(this).data('square-min')}</li>
              <li>Aspect ratio within 1% of ${$(this).data('square-ratio')}</li>
              ${$(this).is('.logos') ? 
                `<li>Suggested dimensions: ${$(this).data('square-suggest')}</li>` : 
                ''
              }
              <li>Maximum size: 5MB (5,242,880 bytes)</li>
              <li>Image may be cropped horizontally up to 5% on each side</li>
              <li>Text may cover no more than 20% of the image</li>
              ${$(this).is('.logos') ?
                '<li>Transparent background is best, but only if the logo is centered</li>' : 
                ''
              }
            </ul>
            <h4><strong>Landscape ${$(this).is('.marketing') ? 'Image' : 'Logo'}</strong></h4>
            <span>(${$(this).is('.marketing') ? 'required' : 'optional/recommended'})</span>
            <ul>
              <li>Minimum dimensions: ${$(this).data('landscape-min')}</li>
              <li>Aspect ratio within 1% of ${$(this).data('landscape-ratio')}</li>
              ${$(this).is('.logos') ? 
                `<li>Suggested dimensions: ${$(this).data('landscape-suggest')}</li>` :
                ''
              }
              <li>Maximum size: 5MB (5,242,880 bytes)</li>
              <li>Image may be cropped horizontally up to 5% on each side</li>
              <li>Text may cover no more than 20% of the image</li>
              ${$(this).is('.logos') ? 
                '<li>Transparent background is best, but only if the logo is centered</li>' :
                ''
              }
            </ul>
          `;
        }
      });
  };
  initFormValidator();
  initPopovers();
}

function promoteListeners () {
  promotedStoriesListeners();
  promoteSettingsListeners();
  $(document)
    .on(
      'show.bs.tab', 
      '.image-library__collection a[data-toggle="tab"], .image-selections__collection a[data-toggle="tab"]', 
      (e) => {
        const btnGroup = e.target.parentElement;
        for (link of btnGroup.children) link.classList.toggle('active');
      }
    )
    .on('click', '#promote .layout-sidebar a', (e) => {
      Cookies.set('promote-tab', $(e.currentTarget).attr('href'));
    })
    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings', () => $('[data-toggle="tooltip"]').tooltip('hide'));

    // changing the scroll-on-focus offset for bootstrap validator isn't working,
    // so do this instead...
    // .on('click', 'a[href="#promote-settings"]', function () {
    //   if ($('#company_adwords_short_headline').val() === '') {
    //     var position = $(window).scrollTop();
    //     $('#company_adwords_short_headline').focus();
    //     $(window).scrollTop(position);
    //   }
    // })


    // .on('click', '#gads-set-reset button', function () {
    //   var $btn = $(this),
    //       storyIds = [],
    //       storyResult = function (storyTitle, newGads) {
    //         var errors = newGads.errors;
    //         return '<li class="' + (errors ? 'errors' : 'success') + '">' +
    //                   '<p>' + storyTitle + '</p>' +
    //                   '<p>' + (errors ? errors[0] : 'topic: ' + newGads.topic.ad_id) + '</p>' +
    //                   (errors ? '' : '<p>retarget: ' + newGads.retarget.ad_id + '</p>') +
    //                   // '<p>retarget ad: ' + (errors ? errors[1] : newGads.retarget.ad_id) + '</p>' +
    //                '</li>'
    //       },
    //       resetGads = function () {
    //         if (storyIds.length === 0) {
    //           $btn.prop('disabled', false).children().toggle();
    //           $('#gads-checklist li').removeClass('checked');
    //           $('#promoted-stories-table').DataTable().ajax.reload(function () {
    //             console.log('set/reset complete')
    //           });
    //           return;  // terminate if array exhausted
    //         } else if (storyIds.length)

    //         $.ajax({
    //           url: '/stories/' + storyIds.shift() + '/create_gads',
    //           method: 'put',
    //           dataType: 'json'
    //         })
    //           .done(function (data, status, xhr) {
    //             console.log(data);
    //             var story = data.story,
    //                 newGads = data.newGads;
    //             if ($('#gads-results__wrapper').is(':not(:visible)')) {
    //               $('#gads-results__wrapper').show();
    //             }
    //             $('#gads-results').append(storyResult(story.title, newGads));
    //             // TODO: add to promoted stories table
    //             resetGads();
    //           })
    //       };

    //   $('#gads-checklist li').removeClass('checked unchecked');
    //   $('#gads-results__wrapper').find('li').remove().end().hide();
    //   $btn.prop('disabled', true).children().toggle();
    //   $.ajax({
    //     url: $btn.data('action'),
    //     method: 'get',
    //     dataType: 'json'
    //   })
    //     .done(function (data, status, xhr) {
    //       console.log(data)
    //       if (readyForGads(data.requirementsChecklist)) {
    //         storyIds = data.publishedStoryIds;
    //         resetGads();
    //       } else {
    //         $btn.prop('disabled', false).children().toggle();
    //       }
    //     })

    // })

  // function readyForGads(requirementsChecklist) {
  //   var $items = $('#gads-checklist li');
  //   $items.eq(0).addClass(requirementsChecklist.promote_enabled ? 'checked' : 'unchecked');
  //   $items.eq(1).addClass(requirementsChecklist.default_headline ? 'checked' : 'unchecked');
  //   $items.eq(2).addClass(
  //       requirementsChecklist.square_image &&
  //       requirementsChecklist.landscape_image &&
  //       requirementsChecklist.valid_defaults ? 'checked' : 'unchecked'
  //     );
  //   return $items.toArray().every(function (item) {
  //             return $(item).hasClass('checked') ? true : false;
  //           });
  // };
}