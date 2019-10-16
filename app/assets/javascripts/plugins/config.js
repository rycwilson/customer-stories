
function pluginConfigListeners () {

  var customStoriesToJson = function () {
        var storyIds = $('select.plugin-stories').val() ?
                         $('select.plugin-stories').val().map(function (id) { return +id; }) :
                         [];
        return JSON.stringify(storyIds);
      },
      hexToRgb = function (hex) {
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
        return (o > 125) ? 'dark' : 'light';
      },
      updateScriptTag = function updateScriptTagOnCustomStoryChange () {
        var isFirstSelection = !$('.script-tag textarea').text().match(/data-stories/);
        $('.script-tag textarea').text(
          $('.script-tag textarea').text()
            .replace(
              isFirstSelection ? /><\/script>/ : /\xa0data-stories="\[((\d+(,)?)+)?\]"/,
              '\xa0data-stories="' + customStoriesToJson() + '"' + (isFirstSelection ? '></script>' : '')
            )
        );
      };

  $(document)

    .on('change', '[name="plugin[type]"]', function () {
      var type = $(this).val(),
          tabbedCarouselAttrs = '\xa0data-delay="' + $('[name="tabbed_carousel[delay]"]').val() + '"\xa0data-tab-color="' + $('[name="tabbed_carousel[tab_color]"]').val() + '"\xa0data-text-color="' + $('[name="tabbed_carousel[text_color]"]').val() + '"';
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(/id="(cs-gallery|cs-carousel|cs-tabbed-carousel)"/, function () {
            // for working on the server, input values for plugin[type] use underscore (namely: tabbed_carousel),
            // but id attributes (and attributes in general) use hyphen
            return (type === 'tabbed_carousel') ? 'id="cs-tabbed-carousel"' : 'id="cs-' + type + '"';
          })
          .replace(/\/plugins\/(gallery|carousel|tabbed_carousel)/, '/plugins/' + type)

          // remove the gallery attributes
          .replace(/\sdata-max-rows="\d+"/, '')
          // re-add them if gallery was selected
          .replace(/><\/script>/, function () {
            return (type === 'gallery' && $('[name="gallery[max_rows]"]').val()) ?
              '\xa0data-max-rows="' + $('[name="gallery[max_rows]"]').val() + '"></script>' :
              '></script>';
          })

          // remove the carousel attributes
          .replace(/\sdata-background="\w+"/, '')
          // re-add them if carousel was selected
          .replace(/><\/script>/, function () {
            return (type === 'carousel') ? '\xa0data-background="' + $('[name="carousel[background]"]:checked').val() + '"></script>' : '></script>';
          })

          // remove the tabbed carousel attributes
          .replace(/\sdata-delay="\d+"\sdata-tab-color="#\w+"\sdata-text-color="#\w+"/, '')
          // re-add them if tabbed carousel was selected
          .replace(/><\/script>/, function () {
            return (type === 'tabbed_carousel') ? tabbedCarouselAttrs + '></script>' : '></script>';
          })
      );

      if (type === 'gallery') {
        $('div.checkbox.logos-only input[type="checkbox"]').prop('disabled', false);
        $('.settings.collapse').one('hidden.bs.collapse', function () {
          $('.settings.collapse .carousel, .settings.collapse .tabbed-carousel').show();
        });
        $('.settings.collapse .tabbed-carousel, .settings.collapse .carousel').hide();
        $('.settings.collapse .gallery').show();
        // $('.settings.collapse').collapse('hide');
      } else if (type === 'carousel') {
        if ($('div.checkbox.logos-only input[type="checkbox"]').prop('checked')) {
          $('div.checkbox.logos-only input[type="checkbox"]').trigger('click');
        }
        $('div.checkbox.logos-only input[type="checkbox"]').prop('disabled', true);
        $('.settings.collapse .gallery, .settings.collapse .tabbed-carousel').hide();
        $('.settings.collapse .carousel').show();
        // $('.settings.collapse').collapse('show');
      } else if (type === 'tabbed_carousel') {
        if ($('div.checkbox.logos-only input[type="checkbox"]').prop('checked')) {
          $('div.checkbox.logos-only input[type="checkbox"]').trigger('click');
        }
        $('div.checkbox.logos-only input[type="checkbox"]').prop('disabled', true);
        $('.settings.collapse .gallery, .settings.collapse .carousel').hide();
        $('.settings.collapse .tabbed-carousel').show();
        // $('.settings.collapse').collapse('show');
      }
    })

    .on('change', '[name="gallery[max_rows]"]', function () {
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(/\sdata-max-rows="\d+"/, '\xa0data-max-rows="' + $(this).val() + '"')
      );
    })

    .on('change', '[name="gallery[no_max_rows]"]', function () {
      if ($(this).prop('checked')) {
        $('[name="gallery[max_rows]"]').val('')
        $('.form-group.max-rows .spinner').addClass('disabled')
        $('.script-tag textarea').text(
          $('.script-tag textarea').text().replace(/\sdata-max-rows="\d+"/, '')
        );
      } else {
        $('[name="gallery[max_rows]"]').val('4')
        $('.form-group.max-rows .spinner').removeClass('disabled')
        $('.script-tag textarea').text(
          $('.script-tag textarea').text()
            .replace(/><\/script>/, '\xa0data-max-rows="4"></script>')
        );
      }
    })

    .on('change', '[name="carousel[background]"]', function () {
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(/data-background="\w+"/, 'data-background="' + $(this).val() + '"')
      );
    })

    .on('change', '[name="tabbed_carousel[tab_color]"]', function () {
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(/data-tab-color="#\w+"/, 'data-tab-color="' + $(this).val() + '"')
      );
      if (colorContrast(hexToRgb($(this).val())) === 'light') {
        $('[name="tabbed_carousel[text_color]"]').minicolors('value', { color: '#ffffff' });
      } else {
        $('[name="tabbed_carousel[text_color]"]').minicolors('value', { color: '#333333' });
      }
    })

    .on('change', '[name="tabbed_carousel[text_color]"]', function () {
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(/data-text-color="#\w+"/, 'data-text-color="' + $(this).val() + '"')
      );
    })

    .on('change', '[name="tabbed_carousel[delay]"]', function () {
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(/data-delay="\d+"/, 'data-delay="' + $(this).val() + '"')
      );
    })

    .on('change', '[name="plugin[content]"]', function () {
      var content = $(this).val();  // IN [custom, category, product]
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()

          // remove data-stories
          .replace(/\sdata-stories="\[((\d+(,)?)+)?\]"/, '')
          // re-add if custom was selected and a selection exists
          // the multiple select option makes .val() behave different
          .replace(/><\/script>/, function () {
            return (content === 'custom' && $('[name="plugin[stories][]"]').val() !== null) ? '\xa0data-stories="' + customStoriesToJson() + '"></script>' : '></script>';
          })

          // remove data-category
          .replace(/\sdata-category="((\w|-)+)?"/, '')
          // re-add if category was selected and a selection exists
          .replace(/><\/script>/, function () {
            return (content === 'category' && $('[name="plugin[category]"]').val() !== '') ? '\xa0data-category="' + ($('[name="plugin[category]"]').find('option:selected').data('slug') || '') + '"></script>' : '></script>';
          })

          // remove data-product
          .replace(/\sdata-product="((\w|-)+)?"/, '')
          // re-add if product was selected and a selection exists
          .replace(/><\/script>/, function () {
            return (content === 'product' && $('[name="plugin[product]"]').val() !== '') ? '\xa0data-product="' + ($('[name="plugin[product]"]').find('option:selected').data('slug') || '') + '"></script>' : '></script>';
          })
      );

      if (content === 'custom') {
        $('.content__select--category, .content__select--product').hide();
        $('.content__select--custom').show();
      } else if (content === 'category') {
        $('.content__select--custom, .content__select--product').hide();
        $('.content__select--category').show();
      } else if (content === 'product') {
        $('.content__select--custom, .content__select--category').hide();
        $('.content__select--product').show();
      }

    })

    .on('change', '[name="plugin[stories][]"]', updateScriptTag)

    .on('change', '[name="plugin[category]"]', function () {
      var isFirstSelection = !$('.script-tag textarea').text().match(/data-category/),
          isClear = ($(this).val() === '');
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            isFirstSelection ? /><\/script>/ : /\xa0data-category="(\w|-)*"/,
            isClear ? '' : '\xa0data-category="' + $(this).find('option:selected').data('slug') + '"' + (isFirstSelection ? '></script>' : '')
          )
      );
    })

    .on('change', '[name="plugin[product]"]', function () {
      var isFirstSelection = !$('.script-tag textarea').text().match(/data-product/),
          isClear = ($(this).val() === '');
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            isFirstSelection ? /><\/script>/ : /\xa0data-product="(\w|-)*"/,
            isClear ? '' : '\xa0data-product="' + $(this).find('option:selected').data('slug') + '"' + (isFirstSelection ? '></script>' : '')
          )
      );
    })

    .on('change', '[name="plugin[logos_only]"]', function () {
      // var isFirstSelection = !$('.script-tag textarea').text().match(/data-logos-only/);
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            $(this).prop('checked') ? /><\/script>/ : /\xa0data-logos-only="true"/,
            $(this).prop('checked') ? '\xa0data-logos-only="true"></script>' : ''
          )
      );
    })

    .on('change', '[name="plugin[grayscale]"]', function () {
      var isFirstSelection = !$('.script-tag textarea').text().match(/data-grayscale/);
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            $(this).prop('checked') ? /><\/script>/ : /\xa0data-grayscale="true"/,
            $(this).prop('checked') ? '\xa0data-grayscale="true"></script>' : ''
          )
      );

    })

    .on('click', 'a.plugin-demo:not([disabled])', function (e) {
      var demoPath = '/plugins/demo',
          params = '?',
          type = $('[name="plugin[type]"]:checked').val(),
          content = $('[name="plugin[content]"]:checked').val(),
          maxRows = $('[name="gallery[max_rows]"]').val(),
          background = $('[name="carousel[background]"]:checked').val(),
          tabColor = $('[name="tabbed_carousel[tab_color]"]').val(),
          textColor = $('[name="tabbed_carousel[text_color]"]').val(),
          logosOnly = $('[name="plugin[logos_only]"]').prop('checked'),
          grayscale = $('[name="plugin[grayscale]"]').prop('checked'),
          delay = $('[name="tabbed_carousel[delay]"]').val(),
          stories = customStoriesToJson().replace('[', '%5B').replace(']', '%5D'),
          category = $('[name="plugin[category]"]').find('option:selected').data('slug'),
          product = $('[name="plugin[product]"]').find('option:selected').data('slug');
      params += 'type=' + type +
        (content === 'custom' && $('[name="plugin[stories][]"]').val() ? '&stories=' + stories : '') +
        (content === 'category' && category ? '&category=' + category : '') +
        (content === 'product' && product ? '&product=' + product : '') +
        (type === 'gallery' && maxRows ? '&max_rows=' + maxRows : '') +
        (type === 'carousel' ? '&background=' + background : '') +
        (logosOnly ? '&logos_only=true' : '') +
        (grayscale ? '&grayscale=true' : '') +
        (type === 'tabbed_carousel' ? '&tab_color=' + tabColor.replace('#', '%23') : '') +
        (type === 'tabbed_carousel' ? '&text_color=' + textColor.replace('#', '%23') : '') +
        (type === 'tabbed_carousel' ? '&delay=' + delay : '');
        console.log('params', params)
      if (params.length === 1) params = '';   // no params
// console.log('GET', demoPath + params)
      $(this).attr('href', demoPath + params);
      $(this).popupWindow(e, window.innerWidth * 0.85, window.innerHeight * 0.85);
    })

    // ref http://bootsnipp.com/snippets/featured/input-spinner-with-min-and-max-values
    .on('click', '.spinner .btn:first-of-type', function () {
      var step = 1, $input = $(this).closest('.spinner').find('input');
      if ($input.attr('max') === undefined || parseInt($input.val()) < parseInt($input.attr('max'))) {
        $input.val(parseInt($input.val(), 10) + step);
        $input.trigger('change');
      } else {
        $(this).next("disabled", true);
      }
    })
    .on('click', '.spinner .btn:last-of-type', function () {
      var step = 1, $input = $(this).closest('.spinner').find('input');
      if ($input.attr('min') === undefined || parseInt($input.val()) > parseInt($input.attr('min'))) {
        $input.val(parseInt($input.val(), 10) - step);
        $input.trigger('change');
      } else {
        $(this).prev("disabled", true);
      }
    })

    .on('click', '.copy', function () {
      var htmlText = $('#plugin-config-form').find('textarea[readonly]').text(),
          $temp = $("<textarea></textarea>");
      $("body").append($temp);
      $temp.text(htmlText).select();
      document.execCommand("copy");
      $temp.remove();
      $('button.copy span, button.copy i').toggle();
      setTimeout(function () {
        $('button.copy span, button.copy i').toggle();
      }, 1500);
    });

}