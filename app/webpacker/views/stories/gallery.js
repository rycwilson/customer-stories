
export default {

  init: () => {
    // oldInit();

  },

  addListeners: () => {
    $(document)
      .on('input', '.stories-search', handleSearchInput)
      .on('click', '.submit-search', handleSearchSubmission)

      .on('click', '.clear-search', clearSearch)
      .on('submit', '.stories-search-form', function () {
        $('.search-results').text('');
        replaceStateStoriesIndex('', '');
        $('.stories-search-form .input-group-btn').addClass('show-clear');
      })

  }

}

function handleSearchInput (e) {
  $('.stories-search').not($(this)).val($(this).val());
  $('.stories-search-form [name="search"]').val($(this).val());
  $('.clear-search').hide();
  $('.stories-search-form .input-group-btn').removeClass('show-clear');
}

function handleSearchSubmission (e) {
  if ($(this).closest('form').find('.stories-search').val() === '') {
    return false;
  }
  $(this).closest('form').submit();
}

function clearSearch () {
  $('.stories-search').val('').trigger('input');
  $('.search-results').text('');
  // updateGallery($(
  //   _.template($('#stories-template').html())({
  //     stories: filterStories('', ''),
  //     isCurator: false
  //   })
  // ));
}

// this function also found in select2.js
function prependTagType {
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
}

// when selecting a filter, sync select tags across different views (xs, sm, md-lg)
// change.select2 => prevents the change event from triggering
function syncSelectTags = (categoryId, productId) {
  var multiSelectFilterVal = [];
  if (categoryId) multiSelectFilterVal.push('c' + categoryId);
  if (productId) multiSelectFilterVal.push('p' + productId);
  $('[name="category_select"]').val(categoryId).trigger('change.select2');
  $('[name="product_select"]').val(productId).trigger('change.select2');
  $('[name="filter_select[]"]').val(multiSelectFilterVal).trigger('change.select2');
  prependTagType();
};

function updateGallery ($stories) {
  $('#stories-gallery').imagesLoaded(() => {
    $('#stories-gallery')
      .empty()
      .append($stories)
      .hide()
      .show('fast', initGridPreviews);
  });
}

function filterStories(categoryId, productId) {
  const publicStories = APP.stories.filter((story) => {
          return story.logo_published || story.preview_published;
        });
  const categoryStoryIds = categoryId ? 
          _.pluck(publicStories.filter((story) => {
              return story.success.story_categories &&
                  story.success.story_categories.some((category) => {
                    return category.id == categoryId;
                  });
            }), 'id') :
          _.pluck(publicStories, 'id');
  const productStoryIds = productId ? 
          _.pluck(publicStories.filter((story) => {
              return story.success.products &&
                  story.success.products.some((product) => {
                    return product.id == productId;
                  });
            }), 'id') :
          _.pluck(publicStories, 'id');
  const storyIds = _.intersection(categoryStoryIds, productStoryIds);
  return publicStories.filter((story) => storyIds.includes(story.id));
}

function oldInit () {
  // there's a timing issue if trying to click immediately per gon.preview_story,
  // so pass a callback to initGridPreviews
  // initGridPreviews({}, function () {
  //   if (gon.preview_story) {
  //     $('li[data-story-id="' + gon.preview_story.toString() + '"] > a')[0].click();
  //     delete gon.preview_story;
  //   }
  // });
  // for a sync load, this isn't necessary => server will provide pre select
  // but what about a turbolinks restore?
  // preSelectFilters(getQueryString('category'), getQueryString('product'));
}