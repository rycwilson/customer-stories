
function companyProfileListeners() {

  var hexToRgb = function (hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // ref: https://stackoverflow.com/questions/11867545/
  var colorContrast = function (bgRgb) {
    // http://www.w3.org/TR/AERT#color-contrast
    var o = Math.round(((parseInt(bgRgb.r) * 299) +
                        (parseInt(bgRgb.g) * 587) +
                        (parseInt(bgRgb.b) * 114)) / 1000);
    return (o > 125) ? 'light-background' : 'dark-background';
  };

  $(document)

    .on('click', '.company-logo-upload__button', function (e) {
      $('.company-logo-upload__logo--existing').attr('src') ?
        $('.company-logo-upload__logo--existing').click() :
        $('.company-logo-upload__logo--placeholder').click()
    })

    .on('change', '.headers-color-picker .upper', function () {
      console.log($(this).val())
      $('.company-logo-upload__company-header').css('background-color', $(this).val());
    })

    .on('change', '.headers-color-picker .lower', function () {
      var $storiesHeader = $('.company-logo-upload__stories-header');
      $storiesHeader
        .css('background-color', $(this).val())
        .removeClass(
          'company-logo-upload__stories-header--light-background ' +
          'company-logo-upload__stories-header--dark-background'
        )
        .addClass(
          'company-logo-upload__stories-header--' + colorContrast(hexToRgb($(this).val()))
        )
      
      $('input[name="company[header_text_color]"]')
        .minicolors(
          'value', 
          { 
            color: $storiesHeader.attr('class').includes('light-background') ? 
                      '#333333' :
                      '#ffffff'
          }
        )
    })

    .on('change', '.headers-color-picker .text', function () {
      $('.company-logo-upload__stories-header h3').css('color', $(this).val());
    })

}