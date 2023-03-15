
function curate () {


  var $curatorSelect = $('.curate-filters__curator');
  // don't need to call this here as the auto curator-select change event will trigger it
  // filterCurateGallery();
  $curatorSelect
    .val(CSP.current_user.id)
    .trigger('change', { auto: true });

}

// keep track of filters with session cookies
function preselectFilters () {
  $('.curate-filters__curator').val(Cookies.get('csp-curate-filter-curator') || CSP.current_user.id).trigger('change');
  $('.curate-filters__customer').val(Cookies.get('csp-curate-filter-customer') || 0).trigger('change');
  $('.curate-filters__category').val(Cookies.get('csp-curate-filter-category') || 0).trigger('change');
  $('.curate-filters__product').val(Cookies.get('csp-curate-filter-product') || 0).trigger('change');
}

function curateListeners () {

  var loading = function ($storyCard) {
        $storyCard.addClass('loading');
        setTimeout(() => $storyCard.addClass('still-loading'), 1000);
        $('#curate-gallery .story-card').css('pointer-events', 'none');
      },
      cancelLoading = function () {
        $('#curate-gallery .story-card').each(function () {
          $(this).removeClass('loading still-loading')
                 .css('pointer-events', 'auto');
        });
      };

  $(document)

    // summernote auto-focuses on url input when the modal opens; cancel this...
    .on('show.bs.modal', '.image-dialog', function () {
      $(this).find('.note-image-url').one('focus', function () {
        $(this).blur();
      });
    })

    .on('show.bs.tab', 'a[href=".curate-stories"]', function () {
      cancelLoading();
    })

    .on('click', '#curate-gallery .story-card', function (e) {
      e.preventDefault();

      var $storyCard = $(this), 
          storySlug = $storyCard.data('story-slug'),
          customerSlug = $storyCard.data('customer-slug');

      loading($storyCard);
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
        url: '/stories/' + $storyCard.data('story-id') + '/edit',
        method: 'GET',
        dataType: 'html'
      })
        .done(function (html, status, xhr) {
          var showTab = function () {
            $('a[href=".edit-story"]')
              .one('shown.bs.tab', function () { window.scrollTo(0, 0); })
              .tab('show');
          };
          $.when( $('#edit-story').empty().append(html) )
            .done(function () {
              Cookies.set('csp-edit-story-tab', '#story-settings');
              initStoriesEdit(showTab);
            });
        });
    })

    .on('change', '#curate-filters select',
      function (e) {
        var filterCookieName = 'csp-curate-filter-' + $(this).attr('class').split(' ')[0],
        filterCookieVal;    
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
      customerId = $('.curate-filters__customer').val(),
      curatorId = $('.curate-filters__curator').val(),
      categoryId = $('.curate-filters__category').val(),
      productId = $('.curate-filters__product').val(),
      status = $('.curate-filters__status').val();

      // showPending = $('#status-filters .pending').prop('checked'),
      // showLogoPublished = $('#status-filters .logo-published').prop('checked'),
      // showPreviewPublished = $('#status-filters .preview-published').prop('checked'),
      // showPublished = $('#status-filters .published').prop('checked');

  var curatorStoryIds = (curatorId === '') ? _.pluck(CSP.stories, 'id') :
        _.pluck(CSP.stories.filter(function (story) {
          return story.success.curator_id == curatorId;
        }), 'id');
        // console.log(curatorStoryIds)
  var customerStoryIds = (customerId === '') ? _.pluck(CSP.stories, 'id') :
        _.pluck(CSP.stories.filter(function (story) {
          return story.success.customer.id == customerId;
        }), 'id');

  var categoryStoryIds = (categoryId === '') ? _.pluck(CSP.stories, 'id') :
        _.pluck(CSP.stories.filter(function (story) {
          return story.success.story_categories &&
             story.success.story_categories.some(function (category) {
               return category.id == categoryId;
             });
        }), 'id');
        // console.log(categoryStoryIds)
  var productStoryIds = (productId === '') ? _.pluck(CSP.stories, 'id') :
        _.pluck(CSP.stories.filter(function (story) {
          return story.success.products &&
            story.success.products.some(function (product) {
              return product.id == productId;
            });
        }), 'id');
        // console.log(productStoryIds)

  var pendingStoryIds =
        _.pluck(CSP.stories.filter(function (story) {
          return !story.published && !story.preview_published && !story.logo_published;
        }), 'id');
      // console.log(pendingStoryIds)
  var logoStoryIds =
        _.pluck(CSP.stories.filter(function (story) {
          return !story.published && !story.preview_published && story.logo_published;
        }), 'id');
        // console.log('logo published: ', logoStoryIds)
  var previewStoryIds =
        _.pluck(CSP.stories.filter(function (story) {
          return !story.published && story.preview_published;
        }), 'id');
  var publishedStoryIds =
        _.pluck(CSP.stories.filter(function (story) {
          return story.published;
        }), 'id');
        // console.log('published: ', publishedStoryIds)

  storyIds = _.intersection(curatorStoryIds, customerStoryIds, categoryStoryIds, productStoryIds);
  storyIds = (status === '' || status === '0') ? storyIds : _.difference(storyIds, pendingStoryIds);
  storyIds = (status === '' || status === '1') ? storyIds : _.difference(storyIds, logoStoryIds);
  storyIds = (status === '' || status === '2') ? storyIds : _.difference(storyIds, previewStoryIds);
  storyIds = (status === '' || status === '3') ? storyIds : _.difference(storyIds, publishedStoryIds);

  stories = CSP.stories.filter(function (story) { return storyIds.includes(story.id); });

// console.log('stories: ', stories)

  $gallery.empty();

  if (stories.length === 0) {
    $gallery.append('<li><h3 style="padding-top: 15px;" class="lead">No Stories found</h3></li>');

  } else {
    $gallery.hide()
            .append( 
                $(storiesTemplate({ 
                  stories: stories, 
                  subdomain: location.href.match(/:\/\/((\w|-)+)\./)[1],
                  isDashboard: true,
                  cardClass: 'card'
                })) 
              )
            .imagesLoaded(function () {
              $gallery.show({
                duration: 0,
                complete: function () {
                  // truncate titles
                  $gallery.find('.story-card__title')
                            .each(function (index, wrapper) {
                              var $title = $(wrapper).find('p');
                              while ($title.outerHeight() > $(wrapper).height()) {
                                $title.text(function (index, text) {
                                  return text.replace(/\W*\s(\S)*$/, '...');
                                });
                              }
                            });
                }
              });
            });
  }

}






