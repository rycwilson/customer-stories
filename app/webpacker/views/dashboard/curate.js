import { truncateStoryTitles } from '../../global';
import stories from 'views/stories';

export default {
  init() {
    const loadStories = $.Deferred();
    stories.table.init(loadStories);
    initFilters();
    preSelectFilters();
  },
  addListeners() {
    $(document)
      .on('click', '#curate-gallery .story-card', getStory)
      .on('change', '#curate-filters select', filterStories)
      .on(
        'show.bs.tab', 
        'a[href=".curate-stories"]', 
        (e) => $('.story-card').showLoading(false)
      )
      .on(
        'shown.bs.tab', 
        'a[href="#curate"], a[href=".curate-stories"]', 
        truncateStoryTitles
      )

      // summernote auto-focuses on url input when the modal opens; cancel this...
      .on('show.bs.modal', '.image-dialog', function () {
        $(this).find('.note-image-url').one('focus', function () {
          $(this).blur();
        });
      });
  }
}

const filterCookies = [
  'dashboard-stories-filter-curator', 
  'dashboard-stories-ilter-status', 
  'dashboard-stories-filter-customer', 
  'dashboard-stories-filter-category', 
  'dashboard-stories-filter-product'
];

function filterStories(e) {
  // console.log('filterStories()')
  const $select = $(e.target);
  const filter = ['curator', 'status', 'customer', 'category', 'product']
                    [$('#curate-filters select').index($select)];
  const filterCookieName = `dashboard-stories-filter-${ filter }`;
  
  // TODO: set up a data table for stories, refactor filterCurateGallery as necessary 
  // filterCurateGallery();

  Cookies.set(filterCookieName, $select.val());
}

function preSelectFilters() {
  let filterCookiesArePresent;
  filterCookies.forEach((cookie) => {
    if (Cookies.get(cookie)) {
      filterCookiesArePresent = true;
      $(`.curate-filters__${ cookie.slice(cookie.lastIndexOf('-') + 1, cookie.length) }`)
        .val(Cookies.get(cookie)).trigger('change');
    } 
  })
  if (!filterCookiesArePresent) autoSelectCurator();
}

function autoSelectCurator() {
  $('.curate-filters__curator')
    .val(APP.current_user.id )
    .trigger('change', { auto: true });
}

function initFilters() {
  $('#curate-filters select')
    .select2({
      theme: 'bootstrap',
      width: 'style',
      placeholder: 'Select',
      allowClear: true
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
  $('#curate .layout-sidebar .curate-stories').attr('data-init', true);
}

function getStory(e) {
  e.preventDefault();
  const $storyCard = $(this);
  const storySlug = $storyCard.data('story-slug');
  const customerSlug = $storyCard.data('customer-slug');
  $storyCard.showLoading(true);
  $.ajax({
    url: `/stories/${ storyCard.data('story-id') }/edit`,
    method: 'GET',
    dataType: 'html'
  })
    .done((html, status, xhr) => {
      $.when(renderStory(html)).done(initStory)
      
      // replacing state ensures turbolinks:false for the first tab state
      window.history.replaceState({ turbolinks: false }, null, '/curate');
    
      // default to true, though this will lead to unnecessary requests in the case
      // of back/forward navigation (but that's better than not making a turbolinks
      // request when necessary)
      window.history.pushState(
        { turbolinks: true }, null, '/curate/' + customerSlug + '/' + storySlug
      );
    });
}

function renderStory (html) { 
  return () => $('#edit-story').empty().append(html); 
}
  
function initStory() {
  console.log('initStory()')
  // var showTab = function () {
  //   $('a[href=".edit-story"]')
  //     .one('shown.bs.tab', function () { window.scrollTo(0, 0); })
  //     .tab('show');
  // };
  // Cookies.set('cs-edit-story-tab', '#story-settings');
  // initStoriesEdit(showTab);
}