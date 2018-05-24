
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

    .on('click', '#company-profile-form .fileinput button', function () {
      $(this).closest('.fileinput').find('img').click();
    })

    .on('change', '.color-picker .upper', function () {
      $('#company-profile-form .logo-upload .thumbnail').css({ background: $(this).val() });
    })

    .on('change', '.color-picker .lower', function () {
      var $nav = $('#company-profile-form .stories-header');
      $nav.css({ background: $(this).val() });
      if (colorContrast(hexToRgb($(this).val())) === 'light') {
        $nav.find('h3, .icon-button').addClass('light').removeClass('dark');
        $nav.find('i').css({ color: $(this).val() });
      } else {
        $nav.find('i').css({ color: 'rgba(255, 255, 255, 0.9)' });
        $nav.find('h3, .icon-button').addClass('dark').removeClass('light');
      }
    })

    // Dynamically change the max-height of the select box
    //   (a static setting doesn't work for some reason)
    .on('select2:open', '#company-profile',
      function () {
        $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
      })

    .on('click', 'button[type="submit"][form="company-profile-form"]', function (e) {
      var $form = $('#company-profile-form'), $button = $(this);
      if ($form.data('submitted')) {
        e.preventDefault();
        return false;
      }
      $form.data('submitted', '1');
      $button.find('span, .fa-spin').toggle();
    });

}