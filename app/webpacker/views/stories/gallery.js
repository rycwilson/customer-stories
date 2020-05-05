
import _intersection from 'lodash/intersection';
// import _template from 'lodash/template';
// import _templateSettings from 'lodash/templateSettings';
import Rails from '@rails/ujs';
import storyCardTemplate from './story_card_template';
import { pluck, truncateStoryTitles } from 'global';

// custom template delimiters (to avoid clashing with erb)
// https://stackoverflow.com/questions/9802402
// _templateSettings.evaluate = /{{([\s\S]+?)}}/g;
// _templateSettings.interpolate = /{{=([\s\S]+?)}}/g;

export default {
  init() {
    initFilters();
    truncateStoryTitles();
  },
  addListeners() {
    $(document)
      .on('input', '.search-stories__input', onSearchInput)
      .on('click', '.search-stories [type="submit"]', onSearchClick)
      .on('click', '.search-stories__clear', clearSearch)
      .on('change', '.stories-filter', onFilterChange)
      .on('ajax:success', '.search-stories', onSearchSuccess)
      .on(
        'click touchstart', 
        '#stories-gallery .story-card:not(.hover) a.published', 
        onStoryClick
      );
  }
}

function onSearchInput (e) {
  $('.search-stories__input').not($(this)).val($(this).val());
  $('.search-stories [type="hidden"][name="q"]').val($(this).val());
  $('.search-stories__clear').hide();
  $('.stories-search-form .input-group-btn').removeClass('show-clear');
}

function clearSearch() {
  $.getJSON('/stories/search', ({ filter, stories }, status, xhr) => renderGallery(stories));
  $('#stories-gallery').empty();
  $('.search-stories__input').val('').trigger('input');
  $('.search-stories__results').text('');
  replacePageState('', '', '');
}

function onSearchClick (e) {
  e.preventDefault();
  const $form = $(this).closest('form');
  const searchString = $form.find('[name="q"]').val();
  if (searchString === '') {
    // false => reload from cache if available; true => reload from server
    location.reload(false) 
  } else {
    $('[class*="stories-filter__select"]').val('').trigger('change.select2');
    $('.stories-filter__results--category, .stories-filter__results--product, .stories-filter__results--grouped, .search-and-filters__results--combined')
      .text('');
    $('#stories-gallery').hide();
    $('.search-stories__clear').show();

    // https://github.com/rails/rails/issues/29546
    // $form.submit()
    Rails.fire($form[0], 'submit')
    replacePageState(searchString, '', '');
  }
}

function onSearchSuccess(e) {
  const [stories, status, xhr] = e.detail;
  $('.search-stories__results').text(
    stories.length === 1 ? '1 story found' : stories.length + '\xa0stories found' 
  );
  renderGallery(stories);
}

function onFilterChange(e) {
  e.preventDefault();
  $('#stories-gallery').hide();
  let categoryId, categorySlug, productId, productSlug;
  const $select = $(e.target);
  const $container = $select.closest('.search-and-filters');
  const isGroupedFilter = $select.is('[class*="--grouped"]');

  // make sure to select filters from the same container,
  // lest the value of the just-changed filter be ""
  const $categoryFilter = $select.is('[class*="--category"]') ?
          $select :
          $container.find('.stories-filter__select--category');
  const $categoryResults = $('.stories-filter__results--category');
  const $productFilter = $select.is('[class*="--product"]') ?
          $select :
          $container.find('.stories-filter__select--product');
  const $productResults = $('.stories-filter__results--product');
  const $combinedResults = $('.stories-filter__results--grouped, .search-and-filters__results--combined');
  const queryString = (categoryId, productId) => `${ 
    categoryId ? 
      (productId ? 
        '?category_id=' + categoryId + '&product_id=' + productId : 
        '?category_id=' + categoryId) :
      (productId ? '?product_id=' + productId : '') 
  }`;
  
  // clear results
  $combinedResults.add($categoryResults).add($productResults).text('');
  $('.search-stories__input').val('').trigger('input');
  $('.search-stories__results').text('');
  $('.search-stories__clear').hide();

  if (isGroupedFilter) {
    const categoryRawId = $select.val() && $select.val().find((tagId) => tagId.includes('c'));
    categoryId = categoryRawId && categoryRawId.slice(1, categoryRawId.length);
    categorySlug = categoryId && 
                    $select.find('optgroup[label="Category"] option:selected').data('slug');
    const productRawId = $select.val() && $select.val().find((tagId) => tagId.includes('p'));
    productId = productRawId && productRawId.slice(1, productRawId.length),
    productSlug = productId && 
                  $select.find('optgroup[label="Product"] option:selected').data('slug');

  } else {
    categoryId = $categoryFilter.val();
    categorySlug = categoryId && $categoryFilter.find('option:selected').data('slug');
    productId = $productFilter.val();
    productSlug = productId && $productFilter.find('option:selected').data('slug');
  }
  $.getJSON(
    `/stories/search${ queryString(categoryId, productId) }`, 
    onFilterSuccess($combinedResults, $categoryResults, $productResults)
  )
  syncSelectTags(categoryId, productId);
  replacePageState('', categorySlug, productSlug);
}

function onFilterSuccess($combinedResults, $categoryResults, $productResults) {
  return (data, status, xhr) => {
    const { filter, stories } = data;
    renderGallery(stories);
    displayFilterResults(filter, stories.length, $combinedResults, $categoryResults, $productResults);
  }
}

function displayFilterResults(filter, storiesCount, $combinedResults, $categoryResults, $productResults) { 
  const resultsText = (count) => count === 1 ? '1 story found' : `${ count } stories found`;
  if (filter.category || filter.product) {
    $combinedResults.each(function () {
      $(this).text(
        $(this).is('[class*="--grouped"]') ?
          resultsText(storiesCount) :
          `Applied filters:\xa0\xa0${ resultsText(storiesCount) }` 
      )
    });
  }
  if (filter.category) {
    $categoryResults.text( resultsText(filter.category.count) );
  } 
  if (filter.product) {
    $productResults.text( resultsText(filter.product.count) );
  } 
}

function prependTagType() {
  $('.select2-selection__rendered li:not(:last-of-type)')
    .each(function (index, tag) {
      const tagId = $('.stories-filter__select--grouped').select2('data')[index].id;
      const tagText = $('.stories-filter__select--grouped').select2('data')[index].text;
      if (!tag.innerHTML.includes('Category:') && !tag.innerHTML.includes('Product:')) {
        tag.innerHTML =
          tag.innerHTML.replace(
              tagText,
              tagId.includes('c') ? 
                'Category:\xa0' + '<span style="font-weight: bold">' + tagText + '</span>' : 
                'Product:\xa0' + '<span style="font-weight: bold">' + tagText + '</span>'
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
  $('.stories-filter__select--grouped').val(multiSelectFilterVal).trigger('change.select2');
  $('.stories-filter__select--category').val(categoryId).trigger('change.select2');
  $('.stories-filter__select--product').val(productId).trigger('change.select2');
}

function initFilters() {
  $('.stories-filter__select--category, .stories-filter__select--product')
    .select2({
      theme: 'bootstrap',
      placeholder: 'Select',
      allowClear: true,
      width: 'style'   
    })
    .on('select2:unselecting', function (e) {
      $(this).data('unselecting', true);
    })
    .on('select2:open', function (e) {
      if ($(this).data('unselecting')) {
        $(this).removeData('unselecting')
              .select2('close');
      }
    })
    .on('change.select2', function (e) {
      if ($(this).val()) {
        $(this).next('.select2').addClass('select2-container--allow-clear')
      } else {
        $(this).next('.select2').removeClass('select2-container--allow-clear')
      }
    })
    .each(function (e) {
      // pre-selected value
      if ($(this).val()) {
        $(this).next('.select2').addClass('select2-container--allow-clear')
      }
    })

  $('.stories-filter__select--grouped')
    .select2({
      theme: 'bootstrap',
      placeholder: 'Select Category and/or Product',
      tags: true,
      width: 'style',
    })
    // ref https://stackoverflow.com/questions/29618382/disable-dropdown-opening-on-select2-clear
    // the answer that worked above did not work for this one, but this one does:
    .on('select2:unselecting', function (e) {
      var self = $(this);
      setTimeout(function () {
        self.select2('close');
      }, 0);
    })
    // ref https://github.com/select2/select2/issues/4589
    .on('select2:selecting', function (e) {
      var siblings = e.params.args.data.element.parentElement.children;
      for(var i = 0; i < siblings.length; i++) {
        siblings[i].selected = false;
      }
    })
    .on('select2:select, select2:unselect, change.select2', function () {
      prependTagType();
      $(this).next('.select2')
               .find('.select2-selection__choice__remove')
                 .html('<i class="fa fa-fw fa-remove"></i>');
    })

  // modify close button
  $('.stories-filter__select--grouped')
    .next('.select2')
      .find('.select2-selection__choice__remove')
        .html('<i class="fa fa-fw fa-remove"></i>');
  prependTagType();
  $('.search-and-filters').attr('data-init', true);
}

function renderGallery(stories) {
  const $gallery = $('#stories-gallery');
  const companyClass = `story-card--${ location.href.match(/:\/\/((\w|-)+)\./)[1] }`;
  const isDashboard = false;
  const storiesHtml = stories.map((story) => {
    const statusClass = `story-card--${ (story.published && 'published') || (story.preview_published && 'preview-published') || (story.logo_published && 'logo-published') || '' }`;
    const cardClass = statusClass + ` ${ isDashboard ? 'story-card--small story-card--dashboard' : companyClass }`;
    const storyLink = `${
      isDashboard || story.preview_published ? 
        'javascript:;' : 
        (story.published && story.csp_story_path) || ''
    }`;
    const storySlug = story.csp_story_path.match(/\/((\w|-)+)$/)[1];
    const customerSlug = story.csp_story_path.match(/^\/((\w|-)+)\//)[1];
    return storyCardTemplate(
      story, cardClass, storyLink, storySlug, customerSlug
    );
  }).join(' ');
  $gallery.empty().append($(storiesHtml)).show();
}

// turbolinks will not save filter info to the state, so it's not included
function replacePageState(searchString, categorySlug, productSlug) {
  if (searchString) {
    history.replaceState({ turbolinks: true }, null, `/stories/search?q=${ encodeURIComponent(searchString) }`);
  } else {
    history.replaceState(
      { turbolinks: true },
      null,
      `/${ categorySlug ? 
            (productSlug ? 
              '?category=' + categorySlug + '&product=' + productSlug : 
              '?category=' + categorySlug) :
            (productSlug ? '?product=' + productSlug : '') }`
    )
  }
}

function onStoryClick(e) {
  // console.log('click touchstart')
  const $storyLink = $(this);
  const $storyCard = $(this).parent();
  const showStoryLoading = () => $storyCard.showLoading(true);

  if (e.type === 'click') {
    // console.log('click')
    $storyCard.showLoading(true);

  } else {
    // console.log('touchstart')
    e.preventDefault();
    $storyCard.addClass('hover');

    // stop the subsequent touchend event from triggering the <a> tag
    $storyLink.one('touchend', (e) => e.preventDefault());

    // next tap => load story (link will be followed)
    $storyLink.one('touchstart', showStoryLoading);

    // undo style changes when navigating away
    // TODO: doesn't work
    window.addEventListener('beforeunload', (e) => {
      $storyCard.removeClass('loading still-loading');
      $('#stories-gallery li').css('pointer-events', 'auto');
    }, { once: true });

    // undo hover and click listener if clicking anywhere outside the story card
    $('body').one(
      'touchstart',
      // this selector is still allowing a click on the title <p> to trigger this listener => check in the function instead
      // ':not(li[data-story-id]:nth-of-type(' + $storyCard.index() + 1 + '), li[data-story-id]:nth-of-type(' + $storyCard.index() + 1 + ') *)',
      (e) => {
        // console.log('body touchstart')
        if ($(e.target).is($storyCard) || $storyCard.has(e.target).length ) {
          // do nothing (link will be followed)
        } else {
          // console.log('not story card')
          $storyCard.removeClass('hover');
          $storyLink.off('touchstart', showStoryLoading);
        }
      }
    );

    // remove hover from other cards
    $('.story-card').not($storyCard).each(function () {
      $(this).removeClass('hover');
    });
  }
}