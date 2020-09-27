import { renderGallery } from 'global';
import stories from 'views/stories';
// import storyCardTemplate from 'views/stories/story_card_template';

export default {
  init() {
    const loadStories = $.Deferred();
    $.when(loadStories).then(onLoadStoriesSuccess, onLoadStoriesError);
    stories.table.init(loadStories);
    stories.newStoryForm.initSelectInputs();
  },
  addListeners() {
    $(document)
      .on('click', '#dashboard-gallery .story-card', getStory)
      .on('change', '#curate-filters select', onFilterChange)
      .on(
        'show.bs.tab', 
        'a[href=".curate-stories"]', 
        (e) => $('.story-card').showLoading(false)
      )

      // summernote auto-focuses on url input when the modal opens; cancel this...
      .on('show.bs.modal', '.image-dialog', function () {
        $(this).find('.note-image-url').one('focus', function () {
          $(this).blur();
        });
      });
  }
}

const filters = {
  curatorId: '',
  status: '',
  customerId: '',
  categoryId: '',
  productId: ''
}

const filterCookies = [
  'dashboard-stories-filter-curator', 
  'dashboard-stories-ilter-status', 
  'dashboard-stories-filter-customer', 
  'dashboard-stories-filter-category', 
  'dashboard-stories-filter-product'
];

function onLoadStoriesSuccess(e) {
  initSelectInputs();
  preSelectFilters();
}

function onLoadStoriesError(e) {
  console.log('loadStories error', e)
}

function onFilterChange(e) {
  const $select = $(e.target);
  const $gallery = $('#dashboard-gallery');
  const selectIndex = $('#curate-filters select').index($select);
  const filter = ['curatorId', 'status', 'customerId', 'categoryId', 'productId'][selectIndex]
  $gallery.hide().empty();
  if (filter == 'status') {
    filters['status'] = $select.find('option:selected').text().split(' ')
      .filter(word => word != 'Story').join('-').toLowerCase();
  } else {
    filters[filter] = $select.val();
  }
  Cookies.set(
    `dashboard-stories-filter-${filter.replace('Id', '')}`, 
    $select.val()
  );
  renderGallery($gallery, filterStories(), true);
}

function filterStories () {
  // console.log('filters', filters)
  return $('#stories-table').DataTable().rows().data().filter((story) => (
    (filters['curatorId'] ? (story.curator.id == filters['curatorId']) : true) &&
    (filters['status'] ? (story.status == filters['status']) : true) &&
    (filters['customerId'] ? (story.customer.id == filters['customerId']) : true) && 
    (
      filters['categoryId'] ? 
        story.category_tags.filter(tag => tag.id == filters['categoryId']).length :
        true
    ) &&
    (
      filters['productId'] ? 
        story.product_tags.filter(tag => tag.id == filters['productId']).length :
        true
    )
  )).toArray();
}

function getStory(e) {
  e.preventDefault();
  const $storyCard = $(this);
  $storyCard.showLoading(true);
  $.ajax({
    method: 'GET',
    dataType: 'html',
    url: `/stories/${$storyCard.data('story-id')}/edit`,
  })
    .then((html) => $('#edit-story').empty().append(html))
    .then(stories.edit.init)
    .then(modifyHistory($storyCard))
}
  
function modifyHistory() {
  return ($storyCard) => {
    const storySlug = $storyCard.data('story-slug');
    const customerSlug = $storyCard.data('customer-slug');

    // replacing state ensures turbolinks:false for the first tab state
    window.history.replaceState({ turbolinks: false }, null, '/curate');
    
    // default to true, though this will lead to unnecessary requests in the case
    // of back/forward navigation (but that's better than not making a turbolinks
    // request when necessary)
    window.history.pushState(
      { turbolinks: true }, 
      null, 
      `/curate/${$storyCard.data('customer-slug')}/${$storyCard.data('story-slug')}`
    );
  }
}
  
function initSelectInputs() {
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

function preSelectFilters() {
  let filterCookiesArePresent;
  filterCookies.forEach((cookie) => {
    if (Cookies.get(cookie)) {
      filterCookiesArePresent = true;
      $(`.curate-filters__${cookie.slice(cookie.lastIndexOf('-') + 1, cookie.length)}`)
        .val(Cookies.get(cookie)).trigger('change');
    } 
  })
  if (!filterCookiesArePresent) {
    $('.curate-filters__curator')
      .val(APP.current_user.id)
      .trigger('change', { auto: true });
  }
}