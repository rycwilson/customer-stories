function storyCTAsListeners () {

  var makeNewCtaPrimary = false;

  // following two functions copied over from companies/edit/profile.js
  // TODO better way to do this with css?  https://revelry.co/css-font-color/
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
      },
      // ref: https://stackoverflow.com/questions/11867545/
      colorContrast = function (bgRgb) {
        // http://www.w3.org/TR/AERT#color-contrast
        var o = Math.round(((parseInt(bgRgb.r) * 299) +
                            (parseInt(bgRgb.g) * 587) +
                            (parseInt(bgRgb.b) * 114)) / 1000);
        return (o > 125) ? 'bg-light' : 'bg-dark';
      },
      closeOpenAccordions = function () {
        $('#edit-ctas .edit-cta.collapse').each(function () {
          if ($(this).is('.in')) {
            $(this).find('form')[0].reset();
            $(this).collapse('hide');
          }
        });
      };

  $(document)

    .on('click', '.section-header .help-block a', function () {
      $(this)
        .add($(this).siblings())
          .toggle()
          .end()
        .closest('.section-header')
          .find('p.help-block')
            .toggle();
    })

    .on('click', '#primary-cta [data-target="#new-cta-modal"]', function () {
      makeNewCtaPrimary = true;
    })

    .on('click', '.cta-description', function () {
      if (!$(this).is('[class*="remove"]')) {
        if (!$(this).is('.in')) {
          closeOpenAccordions();
        }
        $(this).next().collapse('toggle');
      }
    })

    .on('shown.bs.collapse', '.edit-cta.collapse', function () {
      var top = $(this).prev().offset().top - (window.innerHeight / 2) + (($(this).outerHeight() + $(this).prev().outerHeight()) / 2);
      window.scrollTo(0, top);
      $(this).closest('.list-group-item').addClass('open');
      // $(this).prev()[0].scrollIntoView();
    })
    .on('hidden.bs.collapse', '.edit-cta.collapse', function () {
      $(this).closest('.list-group-item').removeClass('open');
    })

    .on('shown.bs.modal', '#new-cta-modal', function () {
      if (makeNewCtaPrimary) {
        $('#new-cta-form [name="new_cta[make_primary]"]').prop('checked', true);
      }
    })

    // reset the new cta form
    .on('hidden.bs.modal', '#new-cta-modal', function () {
      $('#new-cta-form')
        .find('input, textarea')
        .not('[name="new_cta[type]"]')
        .each(function () { this.value = this.defaultValue; });
      makeNewCtaPrimary = false;
      $('#new-cta-form [name="new_cta[make_primary]"]').prop('checked', false);
      if ($('#new_cta_type_form').prop('checked')) {
        $('#new_cta_type_link').trigger('click');
      }
    })

    .on('click', '#edit-ctas [class*="remove"]', function (e) {
      e.stopPropagation();  // don't trigger collapse
      var id = $(this).closest('li').data('cta-id');
      $.ajax({
        url: '/ctas/' + id,
        method: 'delete',
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          if (data.isPrimary) {
            $('#primary-cta li').empty().append('<em>Add a primary CTA</em>');
          } else {
            $('li[data-cta-id="' + data.id + '"]').remove();
          }
        });
    })

    .on('change', '[name="primary_cta[background_color]"]', function () {
      if (colorContrast(hexToRgb($(this).val())) === 'bg-light') {
        $('[name="primary_cta[text_color]"]').minicolors('value', { color: '#333333' });
      } else {
        $('[name="primary_cta[text_color]"]').minicolors('value', { color: '#ffffff' });
      }
    })

    .on('click', '#new-cta-form .btn-group input', function () {
      $(this).closest('form').find('.form-group.cta-link, .form-group.cta-form').toggle();
      $(this).closest('form').find('input, textarea').val();
    });

}