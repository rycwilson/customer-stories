
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
    return (o > 125) ? 'dark' : 'light';
  };

  // CSP test-colors-btn
  var defaultHeaderStyle = "background:linear-gradient(45deg, #FBFBFB 0%, #85CEE6 100%);color:#333333;",
      defaultColorLeft = '#fbfbfb',
      defaltColorRight = '#85cee6',
      defaultTextColor = '#333333';

  $(document)

    .on('click', '#company-profile-form .fileinput button', function (e) {
      var $previewImg = $(this).closest('.fileinput').find('.fileinput-preview img');
      $previewImg.attr('src') ?
        // click on the preview
        $(this).closest('.fileinput').find('.thumbnail')[1].click() :
        // click on the placeholder
        $(this).closest('.fileinput').find('.thumbnail')[0].click();
    })

    .on('change', '.color-picker .upper', function () {
      $('#company-profile-form .logo-upload .thumbnail').css('background-color', $(this).val());
    })

    .on('change', '.color-picker .lower', function () {
      var $storiesHeader = $('#company-profile-form .stories-header');
      $storiesHeader.css('background-color', $(this).val());
      if (colorContrast(hexToRgb($(this).val())) === 'light') {
        $storiesHeader.find('h4').removeClass('dark').addClass('light')
        $('input[name="company[header_text_color]"]').minicolors('value', { color: '#ffffff' });
      } else {
        $storiesHeader.find('h4').addClass('dark').removeClass('light');
        $('input[name="company[header_text_color]"]').minicolors('value', { color: '#333333' });
        // $storiesHeader.find('i').css({ color: 'rgba(255, 255, 255, 0.9)' });
      }
    })

    .on('change', '.color-picker .text', function () {
      $('#company-profile-form .stories-header h3').css('color', $(this).val());
    })

    // Dynamically change the max-height of the select box
    //   (a static setting doesn't work for some reason)
    .on('select2:open', '#edit-company-profile', function () {
      $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
    })

}