type AdImageType = 'SquareImage' | 'LandscapeImage' | 'SquareLogo' | 'LandscapeLogo';

// need to validate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
export function initS3Upload($form?: JQuery<HTMLFormElement>, $input?: JQuery<HTMLInputElement>) {
  // console.log('initS3Upload()...', $form, $input)
  if ($form && $input) {
    initS3FileInput($input, $form.data('s3'), $form.data('assetHost'));
  } else if ($form) {
    $form.find('input:file').each((i, input) => {
      initS3FileInput($(input) as JQuery<HTMLInputElement>, $form.data('s3'), $form.data('assetHost'))
    });
  } else {
    $('form.directUpload:not(#gads-form)').each((i, form) => {
      $(form).find('input:file').each((j, input) => {
        /**
         *  summernote's native file input seems to be ignored when selecting a file, so a buffer
         *  is used instead. When drag-dropping, the file gets uploaded multiple times - see note below
         */
        if ($(input).is('.note-image-input')) return false;
        initS3FileInput($(input) as JQuery<HTMLInputElement>, $(form).data('s3'), $(form).data('assetHost'))
      });
    });
  }
}

export const imageValidatorOptions: ValidatorOptions = {
  focus: false,
  disable: false,
  custom: {
    'max-file-size': validateFileSize,
    'min-dimensions': validateImageDimensions,
    'required-image': function ($fileInput: JQuery<HTMLInputElement>) {
      // console.log('checking for required image (skipping)...', $fileInput)
    }
  }
}

function initS3FileInput($fileInput: JQuery<HTMLInputElement>, s3: S3DirectPost, assetHost?: string): void {
  const $formGroup = $fileInput.closest('.form-group') as unknown as JQuery<HTMLDivElement>;
  $fileInput.fileupload({
    fileInput: $fileInput,
    type: 'POST',
    url: s3.url,
    autoUpload: true,
    formData: s3.postData,
    paramName: 'file',  // S3 does not like nested name fields i.e. name="user[avatar_url]"
    dataType: 'XML',    // S3 returns XML if success_action_status is set to 201
    replaceFileInput: false,
    progressall: (e, data) => {
      // const progress = parseInt(data.loaded / data.total * 100, 10);
    },
    submit: ({ target }: { target: EventTarget }, data: object) => {
      console.info('s3 submit...') 
      /*
      *  When drag-dropping an image into summernote editor, the image gets uploaded twice, see:
      *    https://stackoverflow.com/questions/41768242
      *  The .fileupload('active') method will return the number of active uploads
      *  => don't start another upload if one is already active
      */
      if ($fileInput.is('#narrative__img-upload') && $fileInput.fileupload('active')) {
        return false;
      }
      /*
      *  don't allow spaces in file names
      *  note this is dependent upon bootstrap jasny hack,
      *  ref https://github.com/jasny/bootstrap/issues/179
      */
      const filePath = <string>$(target).val();
      const fileName = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.length);
      if (fileName.indexOf(' ') !== -1) {
        if ($fileInput.is('[name*="images_attributes"]')) {
          $formGroup
            .addClass('has-error')
            .find('.help-block.with-errors')
            .text('Spaces in file name not allowed');
        } else if ($('#customer-form').has($fileInput[0]).length) {
          $('.customer-logo__header').addClass('has-error');
          setTimeout(() => $('.customer-logo__header').removeClass('has-error'), 3000);
        } else {
          // flashDisplay('File name can not contain spaces', 'danger');
        }

        // TODO: this is reverting back to the placeholder instead of the existing image
        ($fileInput.closest('.fileinput') as unknown as JasnyFileInputContainer).fileinput('reset');  // jasny bootstrap
        return false;
      }
    },
    start: (e) => {
      console.log('s3 start...')
    },
    done: (e, data) => {
      console.log('s3 done...')
      const key = $(<Document>data.jqXHR.responseXML).find('Key').text();
      const url = assetHost ? `${assetHost}/${key}` : `https://${s3.host}/${key}`;
      let $imageUrlInput;

      /*
      * find the image_url input, may be different for:
      * - company logo
      * - customer logo
      * - summernote image
      * - promote image
      */

      // promote images
      if ($fileInput.is('[name*="images_attributes"]')) {
        // the hidden image_url input isn't inside the form-group lest jasny js screw with it
        $imageUrlInput = $formGroup.prevAll('input[name*="[image_url]"]');
      }

      // summernote
      if ($fileInput.is('#narrative__img-upload')) {
        $('#narrative-editor').summernote(
          'pasteHTML',
          `<img src="${url}" alt="story image" style="max-width: 100%">`
        );

      } else {
        // note the image is being uploaded to s3 even if there's a validation error (autoupload)
        if ($formGroup.hasClass('has-error')) {
          // console.log('error')
        } else {
          if ($imageUrlInput) {
            $imageUrlInput.val(url);
          } else {
            $imageUrlInput = $('<input>', { type:'hidden', name: $fileInput.attr('name'), value: url });
            $formGroup.append($imageUrlInput);
          }
        }
      }

      // if the input buffer's value isn't set to blank, it will force a request with data-type=html
      $fileInput.val('');
    },
    fail: (e, data) => {
      // possible to get a 403 Forbidden error
      // console.log('s3 fail')
    }
  });
};

function imageDidPersist(img: HTMLImageElement): boolean {
  const src = img.getAttribute('src');
  return Boolean(src && src.includes('http'));
}

function setCardClassName($imageCard: JQuery<HTMLLIElement>, imageType: AdImageType | '') {
  // console.log(`setCardClassName(${type})`, $imageCard.prop('class'))
  const typeMatch = imageType ? imageType.match(/Square|Landscape/) : null;
  const typeClassName = typeMatch ? `$&--${typeMatch[0].toLowerCase()}` : '';
  $imageCard.attr(
    'class',
    $imageCard.attr('class')!
      //.replace('hidden', '')
      .replace(/gads-(image|logo)/, typeClassName)
      .concat($imageCard.is('.gads-default') ? ' ad-image-card--new' : '') 
  );
};

// http://stackoverflow.com/questions/39488774
function validateFileSize($fileInput: JQuery<HTMLInputElement>): string | undefined {
  console.log('validating file size...')
  if ($fileInput.prop('files')[0].size > $fileInput.data('maxFileSize')) {
    return 'Image file size is too big';
  }
}

// only want to validate new images => a url indicates an existing image
function validateImageDimensions($fileInput: JQuery<HTMLInputElement>): string | undefined {
  // console.log('validating image dimensions...')

  const img = $fileInput.closest('.form-group').find('img')[0];
  if (imageDidPersist(img)) return;

  const $imageCard = ($fileInput.closest('.ad-image-card') as unknown) as JQuery<HTMLLIElement>;
  const collection: 'images' | 'logos' = $fileInput.data('collection');
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const aspectRatio = width / height;
  const hasCorrectAspectRatio = (requiredAspectRatio: number) => {
    const aspectRatioTolerance = Number($fileInput.data('aspect-ratio-tolerance')); 
    const plusMinus = aspectRatioTolerance * requiredAspectRatio;
    return aspectRatio >= (requiredAspectRatio - plusMinus) && aspectRatio <= (requiredAspectRatio + plusMinus);
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
  const isSquareImage = width >= squareImageMin && height >= squareImageMin && hasCorrectAspectRatio(1);
  const isLandscapeImage = (
    width >= landscapeImageMinWidth &&
    height >= landscapeImageMinHeight &&
    hasCorrectAspectRatio(landscapeImageAspectRatio)
  );
  const isSquareLogo = width >= squareLogoMin && height >= squareLogoMin && hasCorrectAspectRatio(1);
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
  const imageType: AdImageType | '' = isValid ? 
    (collection[0].toUpperCase() + collection.slice(1))
      .replace(/^/, isSquareImage || isSquareLogo ? 'Square' : 'Landscape')
      .replace(/s$/, '') as AdImageType : 
    '';
  if (!$fileInput.data('default-type')) setCardClassName($imageCard, imageType);
  if (isValid) {
    $imageCard.children('input[name*="[type]"]').val(imageType);
  } else {
    return 'Image is wrong size';
  }
}