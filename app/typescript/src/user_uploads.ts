// import type FormController from './controllers/form_controller'
import type ImageCardController from './controllers/image_card_controller';

interface JasnyFileInputContainer extends HTMLDivElement {
  fileinput: ((options: object) => void) & ((action: string) => void)
}

type FileInputData = DOMStringMap & {
  maxFileSize: string,
  imageType?: string,
  minDimensions?: string,
  collection?: string,
}

type AdImageType = 'SquareImage' | 'LandscapeImage' | 'SquareLogo' | 'LandscapeLogo';

interface ImageConstraints { 
  width: number,
  height: number,
  tolerance: number
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



export function onS3Done(this: ImageCardController, url: string) {
  this.urlInputTarget.value = url;
  this.inputsEnabledValue = true;

  // if the input buffer's value isn't set to blank, it will force a request with data-type=html
  this.fileInputTarget.value = '';

  // pre-load the image so it will be in browser cache when response arrives (no flicker)
  this.imgTarget!.addEventListener(
    'load', 
    () => {
      // remove the spinner for cases in which the form is not immediately sent upon successful upload

      // TODO: !!!
      // if (this.hasFormOutlet || this.hasCompanyProfileOutlet) {
      //   this.element.classList.remove('image-card--uploading');
      // }

      this.dispatch('upload-ready', { detail: { card: this.element } });
    },
    { once: true }
  )
  this.imgTarget!.setAttribute('src', url);
}

export function initS3FileInput(input: HTMLInputElement, onUploadDone: (url: string) => void) {
  const $fileInput = $(input);
  const s3 = JSON.parse(<string>input.dataset.s3);
  const assetHost: string | undefined = input.dataset.assetHost;
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

export function validateImage(input: HTMLInputElement, file: File, img: HTMLImageElement) {
  const { maxFileSize, minDimensions } = input.dataset as FileInputData;
  let error = '';
  if (!input.accept.includes(file.type)) {
    error = 'Must be .png or .jpeg';
  } else if (file.size > +maxFileSize) {
    error = 'Must be < 5.2MB';
  } else if (minDimensions) {
    error = validateImageDimensions(img.naturalWidth, img.naturalHeight, input);
  }
  input.setCustomValidity(error);
}

function validateImageDimensions(width: number, height: number, input: HTMLInputElement) {
  const { minDimensions, imageType, collection } = input.dataset as FileInputData;
  if (!minDimensions) return '';

  console.log('validating dimensions...', imageType || 'no type specified', width, height)

  const min = JSON.parse(minDimensions);
  let error = '', isValid;

  if (imageType) {
    isValid = isValidImage(
      width,
      height,
      min[imageType].width,
      min[imageType].height || min[imageType].width,
      min[imageType].tolerance
    )
  } else {
    isValid = isValidGoogleImage(collection === 'images' ? 'Image' : 'Logo', width, height, min);
    input.dataset.imageType = isValid ? 
      `${imageOrientation(width, height, min['SquareImage'].tolerance)}Image` :
      undefined;
  }

  if (!isValid) {
    error = imageType ?
      `Must be \u2265 ${min[imageType].width}\u00d7${min[imageType].height || min[imageType].width}` :
      `${width}\u00d7${height} is not valid`
  }
  return error;
}

function imageOrientation(
  width: number, height: number, aspectRatioTolerance: number
): 'Square' | 'Landscape' {
  const aspectRatio = width / height;
  return Math.abs(aspectRatio - 1) <= aspectRatioTolerance ? 'Square' : 'Landscape';
};

function isValidImage(
  width: number, height: number, minWidth: number, minHeight: number, aspectRatioTolerance: number
): boolean {
  const aspectRatio = width / height;
  const requiredAspectRatio = minWidth / minHeight;
  const plusMinus = aspectRatioTolerance * requiredAspectRatio;
  const hasAspectRatio = (
    aspectRatio >= (requiredAspectRatio - plusMinus) && 
    aspectRatio <= (requiredAspectRatio + plusMinus)
  )
  return width >= minWidth && height >= minHeight && hasAspectRatio;
}

function isValidGoogleImage(
  subType: 'Image' | 'Logo',
  width: number,
  height: number,
  min: { [key: string]: { width: number, height?: number, tolerance: number }  }
) {
  return [`Square${subType}`, `Landcape${subType}`].some(googleType => {
    return isValidImage(
      width,
      height,
      min[googleType].width,
      min[googleType].height || min[googleType].width,
      min[googleType].tolerance
    );
  });
}