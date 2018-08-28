
function widgetConfigListeners () {

  var storiesToJson = function () {
        var stories = [];
        $('[name="plugin[stories][]').find('option:selected').each(function () {
          stories.push(parseInt($(this).val(), 10));
        });
        return JSON.stringify(stories);
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

          // remove the carousel attributes
          .replace(/\sdata-background="\w+"/, '')
          // re-add them if carousel was selected
          .replace(/><\/script>/, function () {
            return (type === 'carousel') ? '\xa0data-background="' + $('[name="carousel[background]"]').val() + '"></script>' : '></script>';
          })

          // remove the tabbed carousel attributes
          .replace(/\sdata-delay="\d+"\sdata-tab-color="#\w+"\sdata-text-color="#\w+"/, '')
          // re-add them if tabbed carousel was selected
          .replace(/><\/script>/, function () {
            return (type === 'tabbed_carousel') ? tabbedCarouselAttrs + '></script>' : '></script>';
          })
      );

      if (type === 'gallery') {
        $('.settings.collapse').one('hidden.bs.collapse', function () {
          $('.settings.collapse .carousel, .settings.collapse .tabbed-carousel').show();
        });
        $('.settings.collapse').collapse('hide');
      } else if (type === 'carousel') {
        $('.settings.collapse .tabbed-carousel').hide();
        $('.settings.collapse .carousel').show();
        $('.settings.collapse').collapse('show');
      } else if (type === 'tabbed_carousel') {
        $('.settings.collapse .carousel').hide();
        $('.settings.collapse .tabbed-carousel').show();
        $('.settings.collapse').collapse('show');
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
            return (content === 'custom' && $('[name="plugin[stories][]"]').val() !== null) ? '\xa0data-stories="' + storiesToJson() + '"></script>' : '></script>';
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

    .on('change', '[name="plugin[stories][]"]', function () {
      var isFirstSelection = !$('.script-tag textarea').text().match(/data-stories/);
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            isFirstSelection ? /><\/script>/ : /\xa0data-stories="\[((\d+(,)?)+)?\]"/,
            '\xa0data-stories="' + storiesToJson() + '"' + (isFirstSelection ? '></script>' : '')
          )
      );
    })

    .on('change', '[name="plugin[category]"]', function () {
      var isFirstSelection = !$('.script-tag textarea').text().match(/data-category/);
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            isFirstSelection ? /><\/script>/ : /\xa0data-category="(\w|-)*"/,
            '\xa0data-category="' + $(this).find('option:selected').data('slug') + '"' + (isFirstSelection ? '></script>' : '')
          )
      );
    })

    .on('change', '[name="plugin[product]"]', function () {
      var isFirstSelection = !$('.script-tag textarea').text().match(/data-product/);
      $('.script-tag textarea').text(
        $('.script-tag textarea').text()
          .replace(
            isFirstSelection ? /><\/script>/ : /\xa0data-product="(\w|-)*"/,
            '\xa0data-product="' + $(this).find('option:selected').data('slug') + '"' + (isFirstSelection ? '></script>' : '')
          )
      );
    })

    .on('click', '.demo', function (e) {
      var demoPath = '/plugins/demo',
          params = '?',
          type = $('[name="plugin[type]"]:checked').val(),
          content = $('[name="plugin[content]"]:checked').val(),
          background = $('[name="carousel[background]"]:checked').val(),
          tabColor = $('[name="tabbed_carousel[tab_color]"]').val(),
          textColor = $('[name="tabbed_carousel[text_color]"]').val(),
          delay = $('[name="tabbed_carousel[delay]"]').val(),
          stories = storiesToJson().replace('[', '%5B').replace(']', '%5D'),
          category = $('[name="plugin[category]"]').find('option:selected').data('slug'),
          product = $('[name="plugin[product]"]').find('option:selected').data('slug');
      params += 'type=' + type +
        (content === 'custom' && $('[name="plugin[stories][]"]').val() ? '&stories=' + stories : '') +
        (content === 'category' ? '&category=' + category : '') +
        (content === 'product' ? '&product=' + product : '') +
        (type === 'carousel' ? '&background=' + background : '') +
        (type === 'tabbed_carousel' ? '&tab_color=' + tabColor.replace('#', '%23') : '') +
        (type === 'tabbed_carousel' ? '&text_color=' + textColor.replace('#', '%23') : '') +
        (type === 'tabbed_carousel' ? '&delay=' + delay : '');

      if (params.length === 1) params = '';   // no params
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
      var htmlText = $(this).parent().find('textarea').text();
          $temp = $("<textarea></textarea>");
      $("body").append($temp);
      $temp.text(htmlText).select();
      document.execCommand("copy");
      $temp.remove();
      $('button.copy span').toggle();
      setTimeout(function () {
        $('button.copy span').toggle();
      }, 1500);
    });

}