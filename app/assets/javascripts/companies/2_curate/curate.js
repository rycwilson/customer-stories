
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

    .on('change', '#curate-filters select',
      function (e) {
        var filterCookieName = 'csp-curate-filter-' + $(this).attr('class').split(' ')[0],
            filterCookieVal;

        // toggle the X icon
        // if ($(this).val() === '') {
        //   console.log('fart', $(this).prev())
        //   $(this).prev().css('display', 'none');
        // } else {
        //   $(this).prev().css('display', 'inline-block');
        // }

        if ($(this).is('select')) filterCookieVal = $(this).val();
        else filterCookieVal = $(this).prop('checked');
        Cookies.set(filterCookieName, filterCookieVal);
        filterCurateGallery();
      });



}

function filterCurateGallery (context) {
  var stories = [],
      $gallery = $('#curate-gallery'),
      storiesTemplate = _.template($('#stories-template').html()),
      customerId = $('#curate-filters .customer').val(),
      curatorId = $('#curate-filters .curator').val(),
      categoryId = $('#curate-filters .category').val(),
      productId = $('#curate-filters .product').val(),
      status = $('#curate-filters .status').val();

      // showPending = $('#status-filters .pending').prop('checked'),
      // showLogoPublished = $('#status-filters .logo-published').prop('checked'),
      // showPreviewPublished = $('#status-filters .preview-published').prop('checked'),
      // showPublished = $('#status-filters .published').prop('checked');

  var curatorStoryIds = (curatorId === '') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
          return story.success.curator_id == curatorId;
        }), 'id');
        // console.log(curatorStoryIds)
  var customerStoryIds = (customerId === '') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
          return story.success.customer.id == customerId;
        }), 'id');

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

  var pendingStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return !story.published && !story.preview_published && !story.logo_published;
        }), 'id');
      // console.log(pendingStoryIds)
  var logoStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return !story.published && !story.preview_published && story.logo_published;
        }), 'id');
        // console.log('logo published: ', logoStoryIds)
  var previewStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return !story.published && story.preview_published;
        }), 'id');
  var publishedStoryIds =
        _.pluck(app.stories.filter(function (story) {
          return story.published;
        }), 'id');
        // console.log('published: ', publishedStoryIds)

  storyIds = _.intersection(curatorStoryIds, customerStoryIds, categoryStoryIds, productStoryIds);
  storyIds = (status === '' || status === '0') ? storyIds : _.difference(storyIds, pendingStoryIds);
  storyIds = (status === '' || status === '1') ? storyIds : _.difference(storyIds, logoStoryIds);
  storyIds = (status === '' || status === '2') ? storyIds : _.difference(storyIds, previewStoryIds);
  storyIds = (status === '' || status === '3') ? storyIds : _.difference(storyIds, publishedStoryIds);

  stories = app.stories.filter(function (story) { return storyIds.includes(story.id); });

// console.log('stories: ', stories)

  $gallery.empty();

  if (stories.length === 0) {
    $gallery.append('<li><h3 style="padding-top: 15px;" class="lead grid-item">No Stories found</h3></li>');
  } else {
    $gallery.append($(storiesTemplate({ stories: stories, isCurator: true })))
            .hide().show('fast');
  }

}






