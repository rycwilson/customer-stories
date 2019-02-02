
function storyTagsListeners () {

}

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
      hideShownCtas = function () {
        $('[id*="edit-cta-"]').each(function () {
          if ($(this).is('.in')) {
            $(this).find('form')[0].reset();
            $(this).collapse('hide');
          }
        });
      },

      renderCtaUrlParams = function () {
        $('#cta-url-params > div').prepend(
          _.template($('#cta-url-params-template').html())({
            isNew: false,
            params: [ { key: 'foo', value: 'bar' }, { key: 'lorem', value: 'ipsum' } ]
          })
        );
      };

  renderCtaUrlParams();

  $(document)

    .on('click', '.section-header .help-block a', function () {
      $(this).closest('.help-block').find('a').each(function () {
        $(this).toggle();
      });
      $(this).closest('.section-header').find('p.help-block').toggle();
    })

    .on('click', '#primary-cta [data-target="#new-cta-modal"]', function () {
      makeNewCtaPrimary = true;
    })

    .on('click', '.cta-header', function (e) {
      e.preventDefault();
      var awaitingRemovalConfirmation = $(this).find('.confirm-removal').is(':visible'),
          isRemoveBtn = $(e.target).is('[class*="remove"]');
      if (awaitingRemovalConfirmation) {
        return false;
      } else if (isRemoveBtn) {  // removal confirmation handled separately (see below)
        $(this).closest('.list-group-item').addClass('remove');
        return false;
      } else {
        $(this).next().collapse('toggle')
      }
    })
    .on('shown.bs.collapse hidden.bs.collapse', '[id*="edit-cta-"]', function (e) {
      $(this).prev().find('> button:first-of-type i').toggle();
      e.type === 'shown' ?
        $(this).closest('.list-group-item').addClass('shown') :
        $(this).closest('.list-group-item').removeClass('shown');
    })
    .on('show.bs.collapse', '[id*="edit-cta-"]', function (e) {
      hideShownCtas();
    })
    .on('shown.bs.collapse', '[id*="edit-cta-"]', function () {
      var top = $(this).prev().offset().top - (window.innerHeight / 2) + (($(this).outerHeight() + $(this).prev().outerHeight()) / 2);
      window.scrollTo(0, top);
    })
    .on('click', 'body:not(.list-group-item.remove)', function () {
      $('.list-group-item.remove').removeClass('remove');
    })
    .on('click', '#configure-ctas .confirm-removal__button', function (e) {
      var $li = $(this).closest('li'),
          id = $li.data('cta-id');
      if ($(this).closest('ul').is('#primary-cta')) {
        $('#primary-cta li')
          .removeClass('remove')
          .attr('data-cta-id', '')
          .empty()
          .append(
            '<a href="javascript:;" data-toggle="modal" data-target="#new-cta-modal"><em>Add a Primary CTA</em></a>'
          );
      } else {
        $li.remove();
      }
      $.ajax({
        url: '/ctas/' + id,
        method: 'DELETE',
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          // already removed elements
        });
    })

    .on('shown.bs.collapse hidden.bs.collapse', '#cta-url-params', function () {
      $('button[class*="__params"] i').toggle();
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

    .on('show.bs.collapse hidden.bs.collapse', '#cta-url-params', function () {
      $('.cta-actions__params').toggleClass('params-shown');
    })
    .on('click', 'button.cta-url-params__new', function () {
      $('#cta-url-params .last-item').removeClass('last-item');
      $.when(
        $(this).closest('div').before(
          _.template($('#cta-url-params-template').html())({
            isNew: true,
            params: [ { key: '', value: '' } ]
          })
        )
      )
        .done(function () {
          $('.last-item input:first-of-type')[0].focus();
        })
    })
    .on('click', 'button.cta-url-params__apply', function () {
      $(this).find('span, i').toggle();
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