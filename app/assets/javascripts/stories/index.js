
function storiesIndex () {
  // there's a timing issue if trying to click immediately per gon.preview_story,
  // so pass a callback to initGridPreviews
  initGridPreviews({}, function () {
    if (gon.preview_story) {
      $('li[data-story-id="' + gon.preview_story.toString() + '"] > a')[0].click();
      delete gon.preview_story;
    }
  });
  // for a sync load, this isn't necessary => server will provide pre select
  // but what about a turbolinks restore?
  // preSelectFilters(getQueryString('category'), getQueryString('product'));
}

function storiesIndexListeners () {

  var loading = function ($story) {
        $story.addClass('loading');
        setTimeout(function () { $story.addClass('loading-icon'); }, 1000);
        $('#stories-gallery li').css('pointer-events', 'none');
      },

      // this function is copied over from select2.js
      prependTagType = function () {
        $('.select2-selection__rendered li:not(:last-of-type)')
          .each(function (index, tag) {
            tagId = $('#grouped-stories-filter').select2('data')[index].id;
            tagText = $('#grouped-stories-filter').select2('data')[index].text;
            if (!tag.innerHTML.includes('Category:') && !tag.innerHTML.includes('Product:')) {
              tag.innerHTML =
                tag.innerHTML.replace(
                    tagText,
                    tagId.includes('c') ? 'Category:\xa0' + tagText : 'Product:\xa0' + tagText
                  );
            }
          });
      },
      // when selecting a filter, sync select tags across different views (xs, sm, md-lg)
      // change.select2 => prevents the change event from triggering
      syncSelectTags = function (categoryId, productId) {
        var multiSelectFilterVal = [];
        if (categoryId) multiSelectFilterVal.push('c' + categoryId);
        if (productId) multiSelectFilterVal.push('p' + productId);
        $('[name="category_select"]').val(categoryId).trigger('change.select2');
        $('[name="product_select"]').val(productId).trigger('change.select2');
        $('[name="filter_select[]"]').val(multiSelectFilterVal).trigger('change.select2');
        prependTagType();
      };

  $(document)

    .on('input', '.stories-search', function () {
      $('.stories-search').not($(this)).val($(this).val());
      $('.stories-search-form [name="search"]').val($(this).val());
      $('.clear-search').hide();
      $(this).next().removeClass('show-clear');
    })
    .on('click', '.submit-search', function () {
      if ($(this).closest('form').find('.stories-search').val() === '') return false;
      $(this).closest('form').submit();
    })
    .on('click', '.clear-search', function () {
      $('.stories-search').val('').trigger('input');
      $('.search-results').text('');
      updateGallery($(
        _.template($('#stories-template').html())({
          stories: filterStories('', ''),
          isCurator: false
        })
      ));
    })
    .on('submit', '.stories-search-form', function () {
      $('.search-results').text('');
      replaceStateStoriesIndex('', '');
      $(this).find('.input-group-btn').addClass('show-clear');
    })

    .on('click', 'a.published', function (e) {
      var $story = $(this).closest('li');
      loading($story);
    })

    .on('change', '#grouped-stories-filter', function () {
      var categoryRawId = $(this).val() && $(this).val().find(function (tagId) {
                            return tagId.includes('c');
                          }),
          categoryId = categoryRawId && categoryRawId.slice(1, categoryRawId.length),
          categorySlug = categoryId &&
            $(this).find('optgroup[label="Category"] option:selected').data('slug'),
          productRawId = $(this).val() && $(this).val().find(function (tagId) {
                            return tagId.includes('p');
                          }),
          productId = productRawId && productRawId.slice(1, productRawId.length),
          productSlug = productId &&
            $(this).find('optgroup[label="Product"] option:selected').data('slug'),
          filteredStories = filterStories(categoryId, productId),
          filterResults = filteredStories.length === 1 ? "1 story found" : filteredStories.length.toString() + " stories found",
          categoryFilterResults = filterStories(categoryId, '').length === 1 ? "1 story found" : filterStories(categoryId, '').length.toString() + " stories found",
          productFilterResults = filterStories('', productId).length === 1 ? "1 story found" : filterStories('', productId).length.toString() + " stories found";

      syncSelectTags(categoryId, productId);

      // reset search
      $('.stories-search').val('').trigger('input');
      $('.search-results').text('');

      // show results
      if (categoryId || productId) {
        $('.filters-container.visible-xs-block .filter-results > span').text(filterResults);
        $('.filters-container.tall .combined-results')
          .find('> span > span:last-child').text(filterResults).end()
          .find('> span').show();
        if (categoryId) {
          $('.stories-filter.category-select')
            .nextAll('.filter-results').children('span').text(categoryFilterResults);
        } else {
          $('.stories-filter.category-select')
            .nextAll('.filter-results').children('span').text('');
        }
        if (productId) {
          $('.stories-filter.product-select')
            .nextAll('.filter-results').children('span').text(productFilterResults);
        } else {
          $('.stories-filter.product-select')
            .nextAll('.filter-results').children('span').text('');
        }
      } else {
        $('.filters-container.visible-xs-block .filter-results > span').text('');
        $('.filters-container.tall .combined-results > span').hide();
      }

      updateGallery($(
        _.template($('#stories-template').html())({
          stories: filteredStories,
          isCurator: false
        })
      ));
      replaceStateStoriesIndex(categorySlug, productSlug);
    })

    .on('change', '.stories-filter', function () {
      var $categorySelect = $(this).closest('.filters-container').find("[name='category_select']"),
          categoryId = $categorySelect.val(),
          categorySlug = categoryId && $categorySelect.find('option:selected').data('slug'),
          $productSelect = $(this).closest('.filters-container').find("[name='product_select']"),
          productId = $productSelect.val(),
          productSlug = productId && $productSelect.find('option:selected').data('slug'),
          filteredStories = filterStories(categoryId, productId),
          filterResults = filteredStories.length === 1 ? "1 story found" : filteredStories.length.toString() + " stories found",
          categoryFilterResults = filterStories(categoryId, '').length === 1 ? "1 story found" : filterStories(categoryId, '').length.toString() + " stories found",
          productFilterResults = filterStories('', productId).length === 1 ? "1 story found" : filterStories('', productId).length.toString() + " stories found";

      syncSelectTags(categoryId, productId);

      // reset search
      $('.stories-search').val('').trigger('input');
      $('.search-results').hide();

      // show combined filter results (only when both filters are shown)
      if (categoryId || productId) {
        $('.filters-container.tall .combined-results')
          .find('> span > span:last-child').text(filterResults).end()
          .find('> span').show();
        $('.filters-container.visible-xs-block .filter-results > span').text(filterResults);
      } else {
        $('.filters-container.tall .combined-results > span').hide();
        $('.filters-container.visible-xs-block .filter-results > span').text('');
      }

      // show individual filter results
      $('.stories-filter').each(function () {
        if ($(this).val()) {
          $(this).closest('.form-group')
                 .find('.filter-results > span')
                 .text($(this).hasClass('category-select') ? categoryFilterResults : productFilterResults);
        } else {
          $(this).closest('.form-group').find('.filter-results > span').text('');
        }
      });

      // show results for grouped stories filter
      if ($('#grouped-stories-filter').val()) {
        $('#filters-container.visible-xs-block .filter-results > span').text(filterResults);
      } else {
        $('#filters-container.visible-xs-block .filter-results > span').text('');
      }

      updateGallery($(
        _.template($('#stories-template').html())({
          stories: filteredStories,
          isCurator: false
        })
      ));
      replaceStateStoriesIndex(categorySlug, productSlug);
    });
}

function filterStories (categoryId, productId) {
  var publicStories = app.stories.filter(function (story) {
          return story.logo_published || story.preview_published;
        }),
      categoryStoryIds = (!categoryId) ? _.pluck(publicStories, 'id') :
        _.pluck(publicStories.filter(function (story) {
          return story.success.story_categories &&
             story.success.story_categories.some(function (category) {
               return category.id == categoryId;
             });
        }), 'id'),
      productStoryIds = (!productId) ? _.pluck(publicStories, 'id') :
        _.pluck(publicStories.filter(function (story) {
          return story.success.products &&
            story.success.products.some(function (product) {
              return product.id == productId;
            });
        }), 'id'),
      storyIds = _.intersection(categoryStoryIds, productStoryIds);
  return publicStories.filter(function (story) {
    return storyIds.includes(story.id);
  });
}

// in progress; may not be necessary at all
function preSelectFilters (categorySlug, productSlug) {
  // var $categorySelect =
  // var categoryRawId = null, categoryId =productId = null;
  // if (categorySlug) {
  //   categoryRawId = $categorySelect.find("option[data-slug='" + categorySlug + "']").val();
  //   $categorySelect.val(categoryRawId).trigger('change.select2');
  // }
  // if (productSlug) {
  //   filterId = $productSelect.find("option[data-slug='" + productSlug + "']").val();
  //   $productSelect.val(filterId).trigger('change.select2');
  //   if ($categorySelect.length) { $categorySelect.val('0').trigger('change.select2'); }
  // } else {
  //   $categorySelect.val('0').trigger('change.select2');
  //   $productSelect.val('0').trigger('change.select2');
  // }
  // $("[name='category_select'] + span")
  //   .find('.select2-selection')
  //   .each(function () { $(this).blur(); });
  // $("[name='product_select'] + span")
  //   .find('.select2-selection')
  //   .each(function () { $(this).blur(); });
}

function updateGallery ($stories) {
  $('#stories-gallery').imagesLoaded(function () {
    $('#stories-gallery')
      .empty()
      .append($stories)
      .hide()
      .show('fast', initGridPreviews);
  });
}

// turbolinks will not save filter info to the state, so it's not included
function replaceStateStoriesIndex (categorySlug, productSlug) {
  if (!categorySlug && !productSlug) {
    history.replaceState({ turbolinks: true }, null, '/');
  } else if (categorySlug && !productSlug) {
    history.replaceState({ turbolinks: true }, null, '/?category=' + categorySlug);
  } else if (!categorySlug && productSlug) {
    history.replaceState({ turbolinks: true }, null, '/?product=' + productSlug);
  } else if (categorySlug && productSlug) {
    history.replaceState({ turbolinks: true }, null, '/?category=' + categorySlug + '&product=' + productSlug);
  } else {
    // error
  }
}


//
// With { turbolinks: true } in all calls to history.pushState(),
// turbolinks is handling the browser history.
//
// function popstateHandler ($categorySelect, $productSelect, storiesTemplate) {

//   window.onpopstate = function (event) {

//     // if (event.state.turbolinks) { return false; }

//     var categorySlug = getQueryString('category'),
//         productSlug = getQueryString('product');
//         // categoryId = $categorySelect ? $categorySelect.find(':selected').val() : null,
//         // productId = $productSelect ? $productSelect.find(':selected').val() : null,

//     if (event.state.filter) {

//       var filterTag = event.state.filter.tag;
//       var filterId = event.state.filter.id; // this may be a slug

//       filteredStories = filterStories(filterTag, filterId);
//       updateGallery($(storiesTemplate({
//                          stories: filteredStories,
//                          isCurator: app.current_user.is_curator })));
//       selectBoxesTrackQueryString($categorySelect, categorySlug, $productSelect, productSlug);

//     // Safari only (calls window.onpopstate on initial load)
//     // } else {
//       // replacePageState($categorySelect, categorySlug, $productSelect, productSlug);
//     }
//   };
// }