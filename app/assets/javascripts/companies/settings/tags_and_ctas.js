
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
      // parseQueryString = function (queryString) {
      //   var query = {},
      //       pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
      //   for (var i = 0, max = pairs.length; i < max; i++) {
      //     var pair = pairs[i].split('=');
      //     query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      //   }
      //   return query;
      // },
      parseExistingParams = function ($urlInputs) {
        var params = {}, queryString;
        $urlInputs.each(function () {
          queryString = $(this).val().includes('?') &&
            $(this).val().slice($(this).val().indexOf('?'), $(this).val().length);
          if (queryString) {
            (new URLSearchParams(queryString)).forEach(function (value, key) {
              if (!Object.keys(params).includes(key)) {
                params[key] = value;
              }
            })
          }
        })
        return params;
      }
      renderCtaUrlParams = function ($urlInputs) {
        $('#cta-url-params > div').prepend(
          _.template($('#cta-url-params-template').html())({
            isNew: false,
            isFirstParam: $('.cta-url-params__param').length === 0,
            params: parseExistingParams($urlInputs)
          })
        );
      };

  $(document)
    .on('shown.bs.tab', 'a[href="#edit-ctas"]', function () {
      var $urlInputs = $('[name*="cta"][name*="[link_url]"]');
      if ($urlInputs.length) renderCtaUrlParams($urlInputs);
    })

    /**
     *  help text
     */
    .on('click', '.section-header .help-block a', function () {
      $(this).closest('.help-block').find('a').toggle()
             .closest('.section-header').find('p.help-block').toggle();
    })

    /**
     *  New CTA
     */
    .on('click', '#primary-cta [data-target="#new-cta-modal"]', function () {
      makeNewCtaPrimary = true;
    })
    .on('shown.bs.modal', '#new-cta-modal', function () {
      if (makeNewCtaPrimary) {
        $('#new-cta-form [name="new_cta[make_primary]"]').prop('checked', true);
      }
    })
    // reset the form
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


    /**
     *  accordion behavior
     */
    .on('click', '.cta-header', function (e) {
      e.preventDefault();
      var isRemoveBtn = $(e.target).is('[class*="remove"]'),
          awaitingRemovalConfirmation = $(this).find('.confirm-removal').is(':visible');
      if (isRemoveBtn || awaitingRemovalConfirmation) {
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


    /**
     *  remove CTA
     */
    .on('click', '.cta-header button.remove', function () {
      $(this).closest('.list-group-item').addClass('remove');
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


    /**
     *  URL Params
     */
    .on('shown.bs.collapse hidden.bs.collapse', '#cta-url-params', function () {
      $('button[class*="__params"] i').toggle();
    })
    .on('show.bs.collapse hidden.bs.collapse', '#cta-url-params', function () {
      $('.cta-actions__params').toggleClass('params-shown');
    })
    .on('click', '.cta-url-params__checkbox .dropdown-menu a', function () {
      (({
        'All': function () {
          $('.cta-url-params__checkbox input').prop('checked', true);
        },
        'None': function () {
          $('.cta-url-params__checkbox input').prop('checked', false);
        },
        'Remove': function () {
          $('.cta-url-params__checkbox input:checked').each(function () {
            $(this).closest('.cta-url-params__param').remove();
          })
        },
      })[$(this).text()])();
    })
    .on('click', 'button.cta-url-params__new', function () {
      $.when(
        $(this).closest('div').before(
          _.template($('#cta-url-params-template').html())({
            isNew: true,
            isFirstParam: $('.cta-url-params__param').length === 0,
            params: { '': '' }
          })
        )
      )
        .done(function () {
          $('.cta-url-params__param').last().find('input:first-of-type')[0].focus();
        })
    })

    .on('click', '[id*="cta-form-"] [type="submit"]', function (e) {
      // console.log('well?')
      // e.preventDefault();
      // var $form = $(this).closest('form');
      // $.ajax({
      //   url: $form.attr('action'),
      //   method: 'POST',
      //   data: $form.serialize(),
      //   dataType: 'script'
      // })
    })

    .on('click', 'button.cta-url-params__apply', function () {
      var params = new URLSearchParams(),
          updatedUrls = [];
      // $(this).find('span, i').toggle();

      $('.cta-url-params__param').each(function () {
        params.append(
          $(this).find('.cta-url-params__key input').val(),
          $(this).find('.cta-url-params__value input').val()
        )
      })
      $('[name*="cta"][name*="[link_url]"]').each(function () {
        var updatedUrl = $(this).val().replace(/($|\?.+$)/, '?' + params.toString())
        // requests.push(
        //   $.ajax({
        //     url: $(this).attr('action'),
        //     data:
        //   })
        // )
        $(this)
          .val( updatedUrls )
          .trigger('input')
          // .closest('form')[0]
          // .submit()

      })

//       var urls = [
//          '/url/to/script1.js',
//          '/url/to/script2.js',
//          '/url/to/script3.js',
//          '/url/to/script4.js'
//       ];

// var requests = urls.map(function(url){ return $.getScript(url); });


    })


    /**
     *  form management
     */
    .on('input', '[id*="edit-cta-"] form', function () {
      $(this).find('button[type="submit"]').prop('disabled', false);
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