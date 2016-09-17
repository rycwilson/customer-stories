
function popstateHandler ($categorySelect, $productSelect, storiesTemplate) {

  window.onpopstate = function (event) {

    // if (event.state.turbolinks) { return false; }

    var categorySlug = getQueryString('category'),
        productSlug = getQueryString('product');

    if (event.state.filter) {

      var filterTag = event.state.filter.tag;
      var filterId = event.state.filter.id; // this may be a slug

      filteredStories = filterStories(filterTag, filterId);
      updateGallery($(storiesTemplate({
                         stories: filteredStories,
                         isCurator: app.current_user.is_curator })));
      selectBoxesTrackQueryString($categorySelect, categorySlug, $productSelect, productSlug);


    /*
     *  Safari only (calls window.onpopstate on initial load)
     */
    // } else {
      // replacePageState($categorySelect, categorySlug, $productSelect, productSlug);
    }

    // categoryId = $categorySelect ? $categorySelect.find(':selected').val() : null,
    // productId = $productSelect ? $productSelect.find(':selected').val() : null,
  };
}

function storiesIndexHandlers () {

  $(document).on('change', '.stories-filter', function () {

    var $categorySelect = $("[name='category_select']"),
        $productSelect = $("[name='product_select']"),
        filterTag = $(this).attr('name').replace('_select', ''),
        filterId = $(this).val(),
        filterSlug = $(this).find("option[value='" + filterId + "']").data('slug'),
        storiesTemplate = _.template($('#stories-template').html()),
        filteredStories = [];

    console.log('filtering with: ', filterTag, filterId);
    filteredStories = filterStories(filterTag, filterId);
    console.log('filteredStories: ', filteredStories);
    updateGallery($(storiesTemplate({
                      stories: filteredStories,
                      isCurator: app.current_user && app.current_user.is_curator
                    })));

    replaceStateStoriesIndex(filterTag, filterId, filterSlug);

    mutuallyExcludeFilters(filterTag, filterId, $categorySelect, $productSelect);

  });
}

function filterStories (filterTag, filterId) {
  if (filterId === '0') { return app.stories; }  // all stories
  return app.stories.filter(function (story, index) {
    if (filterTag === 'category') {
      return story.success.story_categories.some(function (category) {
        // loosely typed because former is string, latter is number ...
        return category.id == filterId;
      });
    } else if (filterTag === 'product') {
      return story.success.products.some(function (product) {
        return product.id == filterId;
      });
    } else {
      // TODO: error
    }
  });
}

// function initFilters (filtersTemplate) {
//   $('.stories-filters-container')
//     .append(filtersTemplate({
//               isCurator: gon.current_user.is_curator,
//               categorySelectOptions: gon.stories.filters.category.select_options,
//               productSelectOptions: gon.stories.filters.product.select_options
//             })).hide().show(0); // make sure DOM updated before calling select2;
//                                 // 0 specifies timeout
//   $('.stories-filter').select2({
//     theme: 'bootstrap',
//     width: 'style'
//   });
// }

function mutuallyExcludeFilters (filterTag, filterId, $categorySelect, $productSelect) {
  /**
    Filter select boxes are mutually exclusive
    If a category was selected, the product is 'all' (and vice versa)
  */
  if (filterTag === 'category' && $productSelect.length) {
    // $categorySelect.val(filterId.toString()).trigger('change.select2');
    $productSelect.val('0').trigger('change.select2');
  } else if (filterTag === 'product' && $categorySelect.length) {
    // $productSelect.val(filterId.toString()).trigger('change.select2');
    $categorySelect.val('0').trigger('change.select2');
  }
  // TODO: why did I put this here? same for above
  // } else if (filterTag === 'all') {
  //   $productSelect.val('0').trigger('change.select2');
  //   $categorySelect.val('0').trigger('change.select2');
  // }
}

function selectBoxesTrackQueryString ($categorySelect, categorySlug, $productSelect, productSlug) {
  var filterId = null;
  if (categorySlug) {
    filterId = $categorySelect.find("option[data-slug='" + categorySlug + "']").val();
    $categorySelect.val(filterId).trigger('change.select2');
    if ($productSelect.length) { $productSelect.val('0').trigger('change.select2'); }
  } else if (productSlug) {
    filterId = $productSelect.find("option[data-slug='" + productSlug + "']").val();
    $productSelect.val(filterId).trigger('change.select2');
    if ($categorySelect.length) { $categorySelect.val('0').trigger('change.select2'); }
  } else {
    $categorySelect.val('0').trigger('change.select2');
    $productSelect.val('0').trigger('change.select2');
  }
  $("[name='category_select'] + span").find('.select2-selection')
                                        .each(function () { $(this).blur(); });
  $("[name='product_select'] + span").find('.select2-selection')
                                       .each(function () { $(this).blur(); });
}

function updateGallery ($stories) {

  var $gallery = $('#stories-gallery');

  if ($gallery.children().length) {  // trying to empty an already empty .grid element can lead to problems
    $gallery.empty().masonry();
  }

  $stories.imagesLoaded(function () {
    $gallery.append($stories)
            .masonry('appended', $stories);
  });


  // $gallery.empty()
  //         .masonry();

  // setTimeout(function () {
  //   $gallery.append($stories);
  //   $gallery.masonry('appended', $stories);
  // }, 200);

}

function replaceStateStoriesIndex (filterTag, filterId, filterSlug) {
  if (filterId === '0') {  // all
    console.log('replacing state - all');
    history.replaceState({ turbolinks: true, filter: { tag: 'all', id: '0' } }, null, '/');
  } else if (filterTag === 'category') {
    console.log('replacing state - category');
    history.replaceState({ turbolinks: true, filter: { tag: 'category', id: filterId } },
                        null, '/?category=' + filterSlug);
  } else if (filterTag === 'product') {
    console.log('replacing state - product');
    history.replaceState({ turbolinks: true, filter: { tag: 'product', id: filterId } },
                        null, '/?product=' + filterSlug);
  } else {
    // error
  }
}

function pushStateStoriesIndex (filterTag, filterId, filterSlug) {

  if (filterId === '0') {  // all
    history.pushState({ filter: { tag: 'all', id: '0' } }, null, '/');
  } else if (filterTag === 'category') {
    history.pushState({ turbolinks: true, filter: { tag: 'category', id: filterId } },
                        null, '/?category=' + filterSlug);
  } else if (filterTag === 'product') {
    history.pushState({ filter: { tag: 'product', id: filterId } },
                        null, '/?product=' + filterSlug);
  } else {
    // error
  }
}

function getFilteredStoriesSuccess ($categorySelect, $productSelect, data, pushStateIsRequired, filterTag, filterId, isPopstate) {

  var storyTiles = JSON.parse(data.story_tiles),
      filterSlug = data.filter_slug,
      isCurator = data.is_curator,
      template = _.template($('#stories-template').html()),
      storyPath = null;

  // console.log('story data: ', storyTiles);

  $('#stories-gallery').empty();

  if (isPopstate) {
    $("[name='category_select'] + span").find('.select2-selection')
                                        .each(function () { $(this).blur(); });
    $("[name='product_select'] + span").find('.select2-selection')
                                       .each(function () { $(this).blur(); });
  }

  if (storyTiles.length) {
    storyTiles.forEach(function (success) {
      if (success.products.length && success.story.published) {
        storyPath = '/' + success.customer.slug +
                    '/' + success.products[0].slug +
                    '/' + success.story.slug;
      } else if (success.story.published) {
        storyPath = '/' + success.customer.slug +
                    '/' + success.story.slug;
      } else if (data.curator) {
        storyPath = '/stories/' + success.story.id + '/edit';
      }
      $.extend(success, { path: storyPath });
    });

    updateGallery( $(template({ isCurator: isCurator,
                                storyTiles: storyTiles })) );

    if (pushStateIsRequired) {
      pushStateStoriesIndex(filterTag, filterId, filterSlug);
    }

    /**
      Filter select boxes are mutually exclusive
      If a category was selected, the product is 'all'
      (and vice versa)
    */
    if (filterTag === 'category' && $productSelect.length) {
      $categorySelect.val(filterId.toString()).trigger('change.select2');
      $productSelect.val('0').trigger('change.select2');
    } else if (filterTag === 'product' && $categorySelect.length) {
      $productSelect.val(filterId.toString()).trigger('change.select2');
      $categorySelect.val('0').trigger('change.select2');
    } else if (filterTag === 'all') {
      $productSelect.val('0').trigger('change.select2');
      $categorySelect.val('0').trigger('change.select2');
    }
  }
}

function replacePageState ($categorySelect, categorySlug, $productSelect, productSlug) {
  var filterTag = categorySlug ? 'category' : (productSlug ? 'product' : 'all'),
      filterId = categorySlug ?
          $categorySelect.find("option[data-slug='" + categorySlug + "']")
                         .val() :
          (productSlug ? $productSelect.find("option[data-slug='" + productSlug + "']")
                                       .val() : '0');
  // don't overwrite history.state.turbolinks
  $.extend(history.state, { filter: { tag: filterTag, id: filterId }});

}