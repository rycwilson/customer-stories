
export default {

  init: () => {
    initFilters();
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
      .on('change', '.stories-filter', function () {
        const $categorySelect = $(this).closest('.filters-container')
                                         .find('[name="category_select"]');
        const categoryId = $categorySelect.val();
        const categorySlug = categoryId && $categorySelect.find('option:selected').data('slug');
        const $productSelect = $(this).closest('.filters-container')
                                        .find('[name="product_select"]');
        const productId = $productSelect.val();
        const productSlug = productId && $productSelect.find('option:selected').data('slug');
        const filteredStories = filterStories(categoryId, productId);
        const filterResults = filteredStories.length === 1 ? 
            "1 story found" : 
            `${filteredStories.length} stories found`;
        const categoryFilterResults = filterStories(categoryId, '').length === 1 ? 
            "1 story found" : 
            `${filterStories(categoryId, '').length} stories found`;
        const productFilterResults = filterStories('', productId).length === 1 ? 
            "1 story found" : 
            `${filterStories('', productId).length} stories found`;
  
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
function prependTagType() {
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
function syncSelectTags(categoryId, productId) {
  var multiSelectFilterVal = [];
  if (categoryId) multiSelectFilterVal.push('c' + categoryId);
  if (productId) multiSelectFilterVal.push('p' + productId);
  $('[name="category_select"]').val(categoryId).trigger('change.select2');
  $('[name="product_select"]').val(productId).trigger('change.select2');
  $('[name="filter_select[]"]').val(multiSelectFilterVal).trigger('change.select2');
  prependTagType();
}

function initFilters() {
  $('.stories-filter').select2({
    theme: 'bootstrap',
    placeholder: 'Select',
    allowClear: true,
    width: 'style'   
  })
    .on('select2:unselecting', function () {
      $(this).data('unselecting', true);
    })
    .on('select2:opening', function (e) {
      if ($(this).data('unselecting')) {
        $(this).removeData('unselecting');
        e.preventDefault();
      }
    });
}

function updateGallery($stories) {
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