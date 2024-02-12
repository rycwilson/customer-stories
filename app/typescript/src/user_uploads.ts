type AdImageType = 'SquareImage' | 'LandscapeImage' | 'SquareLogo' | 'LandscapeLogo';

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