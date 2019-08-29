
import _intersection from 'lodash/intersection';
import _template from 'lodash/template';
import _templateSettings from 'lodash/templateSettings';
import storyCardTemplate from './story_card_template';
import { pluck } from 'global';

// custom template delimiters (to avoid clashing with erb)
// https://stackoverflow.com/questions/9802402
_templateSettings.evaluate = /{{([\s\S]+?)}}/g;
_templateSettings.interpolate = /{{=([\s\S]+?)}}/g;

export default {
  init: () => {
    initFilters();
    // console.log(story_cards);
  },
  addListeners: () => {
    $(document)
      .on('input', '.stories-search', handleSearchInput)
      .on('click', '.submit-search', handleSearchClick)
      .on('click', '.clear-search', clearSearch)
      .on('submit', '.stories-search-form', handleSearchSubmission)
      .on('change', '.stories-filter', handleFilterChange);
  }
}

function handleSearchInput (e) {
  $('.stories-search').not($(this)).val($(this).val());
  $('.stories-search-form [name="search"]').val($(this).val());
  $('.clear-search').hide();
  $('.stories-search-form .input-group-btn').removeClass('show-clear');
}

function handleSearchClick (e) {
  if ($(this).closest('form').find('.stories-search').val() === '') {
    return false;
  }
  $(this).closest('form').submit();
}

function handleSearchSubmission() {
  $('.search-results').text('');
  replacePageState('', '');
  $('.stories-search-form .input-group-btn').addClass('show-clear');
}

function clearSearch() {
  $('.stories-search').val('').trigger('input');
  $('.search-results').text('');
  // updateGallery($(
  //   _.template($('#stories-template').html())({
  //     stories: filterStories('', ''),
  //     isCurator: false
  //   })
  // ));
}

function handleFilterChange() {
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
  const storyCardsHtml = filteredStories.reduce(function (html, currentStory) {
    return html + _template(storyCardTemplate)({
      story: currentStory,
      storyLink: (currentStory.published && currentStory.csp_story_path) || 
                  (currentStory.preview_published && 'javascript:;'),
      storySlug: currentStory.csp_story_path.match(/\/((\w|-)+)$/)[1],
      className: `public ${ currentStory.published ? 'published' : (currentStory.preview_published ? 'preview-published' : 'logo-published') }`,
      customerSlug: currentStory.csp_story_path.match(/^\/((\w|-)+)\//)[1],
    })
  })
    .replace('[object Object]', '');  // TODO: wtf is up with this?

  console.log(storyCardsHtml);


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
  updateGallery($(storyCardsHtml));
  replacePageState(categorySlug, productSlug);
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
  const $gallery = $('#stories-gallery');
  $gallery.imagesLoaded(function () {
    $gallery.empty()
            .append($stories)
            .hide()
            .show('fast');  // then => initGridPreviews
  });
}

function filterStories(categoryId, productId) {
  const publicStories = APP.stories.filter((story) => {
          return story.logo_published || story.preview_published;
        });
  const categoryStoryIds = categoryId ? 
          pluck(
            publicStories.filter(story => {
              return story.success.story_categories &&
                  story.success.story_categories.some(category => {
                    return category.id == categoryId;
                  });
            }), 
            'id'
          ) :
          pluck(publicStories, 'id');
  const productStoryIds = productId ? 
          pluck(
            publicStories.filter(story => {
              return story.success.products &&
                  story.success.products.some(product => {
                    return product.id == productId;
                  });
            }), 
            'id'
          ) :
          pluck(publicStories, 'id');
  const storyIds = _intersection(categoryStoryIds, productStoryIds);
  return publicStories.filter(story => storyIds.includes(story.id));
}

// turbolinks will not save filter info to the state, so it's not included
function replacePageState(categorySlug, productSlug) {
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