
function widgetConfigListeners () {

  var customStories = [],  // set of stories selected by the user
      /**
       * since select2 does not pick up on the change in order created by the
       * jquery ui sortable plugin, we have to grab values from the dom in order
       * to return them in the right order
       */
      storyObjFromTitle = function (storyTitle) {
        return {
          id: parseInt(
            $('select.plugin-stories option')
              .filter(function () { return this.label === storyTitle; })
              .val(),
            10
          ),
          title: storyTitle
        };
      },
      updateCustomStories = function ($storyTags) {
        var storyTitles = [];
        $storyTags.each(function (index) {
          storyTitles.push($(this).attr('title'));
        });
        return storyTitles.map(function (title) {
          return storyObjFromTitle(title);
        });
      },
      customStoriesToJson = function () {
        var storyIds = customStories.map(function (story) { return story.id; });
        return JSON.stringify(storyIds);
      },
      sortStoryTags = function ($storyTags) {
        console.log($storyTags.sort(function (a, b) {
          return +$(a).data('sort') - +$(b).data('sort');
        }))
        return $storyTags.sort(function (a, b) {
          return +$(a).data('sort') - +$(b).data('sort');
        });
      };
      // following two functions copied over from companies/edit/profile.js
      // TODO better way to do this with css?  https://revelry.co/css-font-color/
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
      handleCustomStoriesChange = function () {
        var isFirstSelection = !$('.script-tag textarea').text().match(/data-stories/);
        $('.script-tag textarea').text(
          $('.script-tag textarea').text()
            .replace(
              isFirstSelection ? /><\/script>/ : /\xa0data-stories="\[((\d+(,)?)+)?\]"/,
              '\xa0data-stories="' + customStoriesToJson() + '"' + (isFirstSelection ? '></script>' : '')
            )
        );
      },
      makeSortable = function makeStorySelectionsSortable () {
        if (!$('select.plugin-stories').data('select2')) {
          setTimeout(function () {
            makeSortable();
          }, 100);
        } else {
          $(".content__select--custom ul.select2-selection__rendered").sortable({
            containment: 'parent',
            // start: function (e, ui) {},
            // change: function (e, ui) {},
            update: function () {
              var $storyTags = $(this).find('li.select2-selection__choice');
              customStories = updateCustomStories($storyTags);
              console.log('updated customStories', customStories);
              handleCustomStoriesChange();

              $(this).find('li.select2-selection__choice').each(function (index) {
                // console.log($(this).data('sort'))
              });
            }
          });
        }
      };

  makeSortable();

  $(document)

    .on('select2:selecting', 'select.plugin-stories', function () {
      // $('.select2-selection__rendered').css('visibility', 'hidden');
    })
    .on('select2:select', 'select.plugin-stories', function () {
      var $storyTags = $('.content__select--custom li.select2-selection__choice'),
          $newTag = $storyTags.last(),
          $sortedStoryTags;

      customStories.push(storyObjFromTitle($newTag.attr('title')));
      console.log('updated customStories', customStories)
      // now, sort the elements according to customStories
      // first, tag each story with its sort order
      $storyTags.each(function (index) {
        var $storyTag = $(this);
        customStories.forEach(function (story, index) {
          if ($storyTag.attr('title') === story.title) {
            $storyTag.data('sort', index);
          }
        });
      });
      console.log('data-sort attribute, story tags in order they appear:');
      $storyTags.each(function (index) {
        console.log($(this).data('sort'));
      });

      $sortedStoryTags = sortStoryTags($storyTags);
      console.log('sorted story tags:')
      console.log($sortedStoryTags)
      $storyTags.each(function () { $(this).remove(); });
      $('.select2-selection__rendered').prepend($sortedStoryTags);
      handleCustomStoriesChange();
    })

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

    .on('change', '[name="plugin[stories][]"]', handleCustomStoriesChange)

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

    .on('click', '.demo', function (e) {
      var demoPath = '/plugins/demo',
          params = '?',
          type = $('[name="plugin[type]"]:checked').val(),
          content = $('[name="plugin[content]"]:checked').val(),
          background = $('[name="carousel[background]"]:checked').val(),
          tabColor = $('[name="tabbed_carousel[tab_color]"]').val(),
          textColor = $('[name="tabbed_carousel[text_color]"]').val(),
          delay = $('[name="tabbed_carousel[delay]"]').val(),
          stories = customStoriesToJson().replace('[', '%5B').replace(']', '%5D'),
          category = $('[name="plugin[category]"]').find('option:selected').data('slug'),
          product = $('[name="plugin[product]"]').find('option:selected').data('slug');
      params += 'type=' + type +
        (content === 'custom' && $('[name="plugin[stories][]"]').val() ? '&stories=' + stories : '') +
        (content === 'category' && category ? '&category=' + category : '') +
        (content === 'product' && product ? '&product=' + product : '') +
        (type === 'carousel' ? '&background=' + background : '') +
        (type === 'tabbed_carousel' ? '&tab_color=' + tabColor.replace('#', '%23') : '') +
        (type === 'tabbed_carousel' ? '&text_color=' + textColor.replace('#', '%23') : '') +
        (type === 'tabbed_carousel' ? '&delay=' + delay : '');
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
      var htmlText = $('#plugin-config-form').find('textarea[readonly]').text();
          $temp = $("<textarea></textarea>");
      $("body").append($temp);
      console.log($temp.text());
      $temp.text(htmlText).select();
      document.execCommand("copy");
      $temp.remove();
      $('button.copy span, button.copy i').toggle();
      setTimeout(function () {
        $('button.copy span, button.copy i').toggle();
      }, 1500);
    });

}