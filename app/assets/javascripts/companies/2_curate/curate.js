
function curate () {

  // don't need to call this here as the auto curator-select change event will trigger it
  // filterCurateGallery();
  $('#curate-filters .curator').val(
      $('#curate-filters .curator').children('[value="' + app.current_user.id + '"]').val()
    ).trigger('change', { auto: true });
}

// keep track of filters with session cookies
function preselectFilters () {
  $('#curate-filters').find('select.curator').val(Cookies.get('csp-curate-filter-curator') || app.current_user.id).trigger('change');
  $('#curate-filters').find('select.customer').val(Cookies.get('csp-curate-filter-customer') || 0).trigger('change');
  $('#curate-filters').find('select.category').val(Cookies.get('csp-curate-filter-category') || 0).trigger('change');
  $('#curate-filters').find('select.product').val(Cookies.get('csp-curate-filter-product') || 0).trigger('change');

  // control the default by choosing 'true' or 'false' for comparison
  $('#status-filters .published').prop('checked', Cookies.get('csp-curate-filter-published') === 'true' ? true : false).trigger('change');
  $('#status-filters .logo-published').prop('checked', Cookies.get('csp-curate-filter-logo-published') === 'false' ? false : true).trigger('change');
  $('#status-filters .preview-published').prop('checked', Cookies.get('csp-curate-filter-preview-published') === 'false' ? false : true).trigger('change');
  $('#status-filters .pending').prop('checked', Cookies.get('csp-curate-filter-pending') === 'false' ? false : true).trigger('change');
}

function curateListeners () {

  var loading = function ($story) {
        $story.addClass('loading');
        setTimeout(function () { $story.addClass('loading-icon'); }, 1000);
        $('#curate-gallery li').css('pointer-events', 'none');
      },
      cancelLoading = function () {
        $('#curate-stories li').each(function () {
          $(this).removeClass('loading loading-icon');
          $(this).css('pointer-events', 'auto');
        });
      };

  $(document)

    .on('show.bs.tab', 'a[href="#curate-stories"]', cancelLoading)

    .on('click', '#curate-gallery a.logo-published,' +
                 '#curate-gallery a.preview-published,' +
                 '#curate-gallery a.pending-curation', function (e) {

      e.preventDefault();

      var $story = $(this).closest('li'), storySlug = $story.data('story-slug'),
          customerSlug = $story.data('customer-slug');
      loading($story);

  // replacing state ensure turbolinks:false for the first tab state
      window.history.replaceState(
        { turbolinks: false }, null, '/curate'
      );
  // default to true, though this will lead to unnecessary requests in the case
  // of back/forward navigation (but that's better than not making a turbolinks
  // request when necessary)
      window.history.pushState(
        { turbolinks: true }, null, '/curate/' + customerSlug + '/' + storySlug
      );

      $.ajax({
        url: '/stories/' + $story.data('story-id') + '/edit',
        method: 'get',
        dataType: 'html'
      })
        .done(function (html, status, xhr) {
          var cbShowTab = function () { $('a[href="#curate-story"]').tab('show'); };
          $.when( $('#curate-story').empty().append(html) )
            .then(function () { initStoriesEdit(cbShowTab); });
        });
    })

    .on('change', '#curate-filters select, #status-filters input',
      function (e) {
        var filterCookieName = 'csp-curate-filter-' + $(this).attr('class').split(' ')[0],
            filterCookieVal;

        // toggle the X icon
        if ($(this).val() === '0') {
          $(this).prev().css('display', 'none');
        } else {
          $(this).prev().css('display', 'inline-block');
        }

        if ($(this).is('select')) filterCookieVal = $(this).val();
        else filterCookieVal = $(this).prop('checked');
        Cookies.set(filterCookieName, filterCookieVal);
        filterCurateGallery();
      });



}

function filterCurateGallery () {
  var stories = [],
      $gallery= $('#curate-gallery'),
      storiesTemplate = _.template($('#stories-template').html()),
      customerId = $('#curate-filters .customer').val(),
      curatorId = $('#curate-filters .curator').val(),
      categoryId = $('#curate-filters .category').val(),
      productId = $('#curate-filters .product').val(),
      showPending = $('#status-filters .pending').prop('checked'),
      showLogoPublished = $('#status-filters .logo-published').prop('checked'),
      showPreviewPublished = $('#status-filters .preview-published').prop('checked'),
      showPublished = $('#status-filters .published').prop('checked');

  var customerStoryIds = (customerId === '') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
          return story.success.customer.id == customerId;
        }), 'id');

  var curatorStoryIds = (curatorId === '') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
          return story.success.curator_id == curatorId;
        }), 'id');
        // console.log(curatorStoryIds)
  var categoryStoryIds = (categoryId === '') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
          return story.success.story_categories &&
             story.success.story_categories.some(function (category) {
               return category.id == categoryId;
             });
        }), 'id');
        // console.log(categoryStoryIds)
  var productStoryIds = (productId === '') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
          return story.success.products &&
            story.success.products.some(function (product) {
              return product.id == productId;
            });
        }), 'id');
        // console.log(productStoryIds)
  var publishedStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return story.published;
        }), 'id');
        console.log('published: ', publishedStoryIds)
  var previewStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return !story.published && story.preview_published;
        }), 'id');
  var logoStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return !story.published && !story.preview_published && story.logo_published;
        }), 'id');
        console.log('logo published: ', logoStoryIds)
  var pendingStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return !story.published && !story.preview_published && !story.logo_published;
        }), 'id');
      // console.log(pendingStoryIds)

  storyIds = _.intersection(customerStoryIds, curatorStoryIds, categoryStoryIds, productStoryIds);
  // console.log('after intersection: ', storyIds);
  storyIds = showPublished ? storyIds : _.difference(storyIds, publishedStoryIds);
  // console.log('after removing published (if necessary): ', storyIds)
  storyIds = showPreviewPublished ? storyIds : _.difference(storyIds, previewStoryIds);
  storyIds = showLogoPublished ? storyIds : _.difference(storyIds, logoStoryIds);
  // console.log('after removing logo published (if necessary): ', storyIds)
  storyIds = showPending ? storyIds : _.difference(storyIds, pendingStoryIds);
  // console.log('after removing pending (if necessary): ', storyIds)

  stories = app.stories.filter(function (story) { return storyIds.includes(story.id); });

console.log('stories: ', stories)

  $gallery.empty();

  if (stories.length === 0) {
    $gallery.append('<li><h3 class="lead grid-item">No Stories found</h3></li>');
  } else {
    $gallery.append($(storiesTemplate({ stories: stories, isCurator: true })))
            .hide().show('fast');
  }

}






