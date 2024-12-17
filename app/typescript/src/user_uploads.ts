import type ImageCardController from './controllers/image_card_controller';

interface JasnyFileInputContainer extends HTMLDivElement {
  fileinput: ((options: object) => void) & ((action: string) => void)
}

// need to validate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
// export function initS3Upload($form?: JQuery<HTMLFormElement, any>, $input?: JQuery<HTMLInputElement, any>) {
//   // console.log('initS3Upload()...', $form, $input)
//   if ($form && $input) {
//     initS3FileInput($input, $form.data('s3'), $form.data('assetHost'));
//   } else if ($form) {
//     $form.find('input:file').each((i: number, input: HTMLInputElement) => {
//       initS3FileInput($(input), $form.data('s3'), $form.data('assetHost'))
//     });
//   } else {
//     $('form.directUpload:not(#gads-form)').each((i: number, form: HTMLFormElement) => {
//       $(form).find('input:file').each((j: number, input: HTMLInputElement) => {
//         /**
//          *  summernote's native file input seems to be ignored when selecting a file, so a buffer
//          *  is used instead. When drag-dropping, the file gets uploaded multiple times - see note below
//          */
//         if ($(input).is('.note-image-input')) return false;
//         initS3FileInput($(input), $(form).data('s3'), $(form).data('assetHost'))
//       });
//     });
//   }
// }

export const imageValidatorOptions: ValidatorOptions = {
  focus: false,
  disable: false,
  custom: {
    'max-file-size': validateFileSize,
    'min-dimensions': validateImageDimensions,
    'required-image': function ($fileInput: JQuery<HTMLInputElement, any>) {
      console.log('checking for required image (skipping)...', $fileInput)
    }
  }
}

export function onS3Done(this: ImageCardController, url: string) {
  this.urlInputTarget.value = url;
  this.inputsEnabledValue = true;

  // if the input buffer's value isn't set to blank, it will force a request with data-type=html
  this.fileInputTarget.value = '';

  // pre-load the image so it will be in browser cache when response arrives (no flicker)
  this.imgTarget.addEventListener(
    'load', 
    () => {
      // remove the spinner for cases in which the form is not immediately sent upon successful upload
      if (this.hasUserProfileOutlet || this.hasCompanyProfileOutlet || this.hasCustomerOutlet) {
        this.element.classList.remove('image-card--uploading');
      }
      this.dispatch('upload-ready', { detail: { card: this.element, userAction: 'add' } });
    },
    { once: true }
  )
  this.imgTarget.setAttribute('src', url);
}

export function initS3FileInput(input: HTMLInputElement, onUploadDone: (url: string) => void) {
  const $fileInput = $(input);
  const s3 = JSON.parse(<string>input.dataset.s3);
  const assetHost: string | undefined = input.form!.dataset.assetHost;  // undefined in development environment
  const $formGroup = $fileInput.closest('.form-group') as unknown as JQuery<HTMLDivElement, any>;
  $fileInput.fileupload({
    fileInput: $fileInput,
    type: 'POST',
    url: s3.url,
    autoUpload: false,
    formData: s3.postData,
    paramName: 'file',  // S3 does not like nested name fields i.e. name="user[avatar_url]"
    dataType: 'XML',    // S3 returns XML if success_action_status is set to 201
    replaceFileInput: false,
    progressall: (e: Event, data: any) => {
      // const progress = parseInt(data.loaded / data.total * 100, 10);
    },
    submit: ({ target }: { target: EventTarget }, data: object) => {
      console.info('s3 submit') 
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
    start: (e: Event) => {
      console.log('s3 start')
    },
    done: (e: Event, data: any) => {
      const key = $(<Document>data.jqXHR.responseXML).find('Key').text();
      const url = assetHost ? `${assetHost}/${key}` : `https://${s3.host}/${key}`;
      console.log('s3 done:', url)
      // let $imageUrlInput;
      onUploadDone(url);

      /*
      * find the image_url input, may be different for:
      * - company logo
      * - customer logo
      * - summernote image
      * - promote image
      */

      // promote images
      // if ($fileInput.is('[name*="images_attributes"]')) {
        // the hidden image_url input isn't inside the form-group lest jasny js screw with it
        // $imageUrlInput = $formGroup.prevAll('input[name*="[image_url]"]');
      // }

      // summernote
      if ($fileInput.is('#narrative__img-upload')) {
        $('#narrative-editor').summernote(
          'pasteHTML',
          `<img src="${url}" alt="story image" style="max-width: 100%">`
        );

      } 
      // else {
      //   if ($formGroup.hasClass('has-error')) {
      //     // console.log('error')
      //   } else {
      //     if ($imageUrlInput) {
      //       $imageUrlInput.val(url);
      //     } else {
      //       $imageUrlInput = $('<input>', { type:'hidden', name: $fileInput.attr('name'), value: url });
      //       $formGroup.append($imageUrlInput);
      //     }
      //   }
      // }
    },
    fail: (e: Event, data: any) => {
      // possible to get a 403 Forbidden error
      // console.log('s3 fail')
    }
  });
};

function imageDidPersist(img: HTMLImageElement): boolean {
  const src = img.getAttribute('src');
  return Boolean(src && src.includes('http'));
}

// http://stackoverflow.com/questions/39488774
function validateFileSize($fileInput: JQuery<HTMLInputElement, any>): string | undefined {
  console.log('validating file size...')
  if ($fileInput.prop('files')[0].size > $fileInput.data('maxFileSize')) {
    // console.log('image file size is invalid')
    return 'Image file size is too big';
  } else {
    // console.log('image file size is valid')
  }
}

// only want to validate new images => a url indicates an existing image
function validateImageDimensions($fileInput: JQuery<HTMLInputElement, any>): string | undefined {
  console.log('validating image dimensions...')

  const img = $fileInput.closest('.form-group').find('.fileinput-preview img')[0];
  // if (imageDidPersist(img)) return;
  
  const $imageCard = <JQuery<HTMLLIElement, any>>($fileInput.closest('.image-card') as unknown);
  const matchGroups = (<string>$imageCard.attr('class'))
    .match(/--(?<aspectRatio>Square|Landscape)(?<kind>Image|Logo)/)
    ?.groups;
  let imageKind = matchGroups ? Object.values(matchGroups).reduce((acc, val) => acc + val, '') : '';
  let isValid;
  const collection = $fileInput.data('collection');
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const hasAspectRatio = (requiredAspectRatio: number) => {
    const aspectRatio = width / height;
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
  const isSquareImage = width >= squareImageMin && height >= squareImageMin && hasAspectRatio(1);
  const isLandscapeImage = (
    width >= landscapeImageMinWidth &&
    height >= landscapeImageMinHeight &&
    hasAspectRatio(landscapeImageAspectRatio)
  );
  const isSquareLogo = width >= squareLogoMin && height >= squareLogoMin && hasAspectRatio(1);
  const isLandscapeLogo = (
    width >= landscapeLogoMinWidth &&
    height >= landscapeLogoMinHeight && 
    hasAspectRatio(landscapeLogoAspectRatio)
  );
  if (imageKind) {
    isValid = (
      (imageKind === 'SquareImage' && isSquareImage) ||
      (imageKind === 'LandscapeImage' && isLandscapeImage) ||
      (imageKind === 'SquareLogo' && isSquareLogo) ||
      (imageKind === 'LandscapeLogo' && isLandscapeLogo)
    );
  } else if (collection === 'images' && (isSquareImage || isLandscapeImage)) {
    isValid = true;
    imageKind = `${isSquareImage ? 'Square' : 'Landscape'}Image`;
  } else if (collection === 'logos' && (isSquareLogo || isLandscapeLogo)) {
    isValid = true;
    imageKind = `${isSquareLogo ? 'Square' : 'Landscape'}Logo`;
  }
  if (isValid) {
    $imageCard
      .toggleClass(`image-card--${imageKind}`, true)
      .children('input[name*="[type]"]').val(imageKind);
  } else {
    return 'Image is wrong size';
  }
}