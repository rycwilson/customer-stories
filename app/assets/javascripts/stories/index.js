
function storiesIndex () {
  var $categorySelect = $("[name='category_select']"),
      categorySlug = getQueryString('category'),
      $productSelect = $("[name='product_select']"),
      productSlug = getQueryString('product'),
      storiesTemplate = _.template($('#stories-template').html()),
      filterTag = categorySlug ? 'category' : (productSlug ? 'product' : null),
      filterSlug = categorySlug ? categorySlug : (productSlug ? productSlug : null),
      previewStorySlug = getQueryString('preview');

  // there's a timing issue if trying to click immediately per gon.preview_story,
  // so pass a callback to initGridPreviews
  initGridPreviews({}, function () {
    if (gon.preview_story) {
      $('li[data-story-id="' + gon.preview_story.toString() + '"] > a')[0].click();
      delete gon.preview_story;
    }
  });
}

function storiesIndexListeners () {

  var loading = function ($story) {
        $story.addClass('loading');
        setTimeout(function () { $story.addClass('loading-icon'); }, 1000);
        $('.stories-gallery li').css('pointer-events', 'none');
      };

  $(document)

    .on('click', 'a.published', function (e) {
      var $story = $(this).closest('li');
      loading($story);
    })

    .on('change', '.grouped-stories-filter', function () {
      var filterTag = $(this).find('option:selected').closest('optgroup').attr('label').toLowerCase(),
          filterId = $(this).val(),
          filterSlug = $(this).find('option:selected').data('slug'),
          storiesTemplate = _.template($('#stories-template').html());

      updateGallery(
        $(storiesTemplate({
            stories: filterStories(filterTag, filterId, filterSlug),
            isCurator: false
          }))
      );

      replaceStateStoriesIndex(filterTag, filterId, filterSlug);

    })

    .on('change', '.stories-filter', function () {
      var $categorySelect = $("[name='category_select']"),
          $productSelect = $("[name='product_select']"),
          filterTag = $(this).attr('name').replace('_select', ''),
          filterId = $(this).val(),
          filterSlug = $(this).find("option[value='" + filterId + "']").data('slug'),
          storiesTemplate = _.template($('#stories-template').html());

      updateGallery(
        $(storiesTemplate({
            stories: filterStories(filterTag, filterId, filterSlug),
            isCurator: false
          }))
      );

      replaceStateStoriesIndex(filterTag, filterId, filterSlug);
      mutuallyExcludeFilters(filterTag, filterId, $categorySelect, $productSelect);

    });
}

function filterStories (filterTag, filterId, filterSlug) {

  if (filterId === '0' || filterSlug === null) {  // all stories
    return app.stories.filter(function (story) {
             return story.logo_published || story.preview_published;
           });
  }
  return app.stories.filter(function (story, index) {
    if (filterTag === 'category') {
      return (story.preview_published || story.logo_published) &&
        story.success.story_categories.some(function (category) {
          // loosely typed because former is string, latter is number ...
          return category.id == filterId || category.slug == filterSlug;
        });
    } else if (filterTag === 'product') {
      return (story.preview_published || story.logo_published) &&
        story.success.products.some(function (product) {
          return product.id == filterId || product.slug == filterSlug;
        });
    } else {
      // TODO: error
    }
  });
}

function mutuallyExcludeFilters (filterTag, filterId, $categorySelect, $productSelect) {
  if (filterTag === 'category' && $productSelect.length) {
    // change the selected option without triggering the 'change' event
    $productSelect.val('0').trigger('change.select2');
  } else if (filterTag === 'product' && $categorySelect.length) {
    $categorySelect.val('0').trigger('change.select2');
  }
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
  $('.stories-gallery').imagesLoaded(function () {
    $('.stories-gallery')
      .empty()
      .append($stories)
      .hide().show('fast', function () { initGridPreviews(); });
  });
}

// turbolinks will not save filter info to the state, so it's not included
function replaceStateStoriesIndex (filterTag, filterId, filterSlug) {
  if (filterId === '0') {  // all
    history.replaceState({ turbolinks: true }, null, '/');
  } else if (filterTag === 'category') {
    history.replaceState({ turbolinks: true }, null, '/?category=' + filterSlug);
  } else if (filterTag === 'product') {
    history.replaceState({ turbolinks: true }, null, '/?product=' + filterSlug);
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