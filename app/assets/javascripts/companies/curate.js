
function curate () {
  // don't need to call this here as the auto curator-select change event will trigger it
  // filterCurateGallery();
  $('.curate.curator-select').val(
      $('.curate.curator-select').children('[value="' + app.current_user.id.toString() + '"]').val()
    ).trigger('change', { auto: true });
}


function curateListeners () {

  $(document)

    .on('click', '#curate-gallery a.logo-published,' +
                 '#curate-gallery a.preview-published,' +
                 '#curate-gallery a.pending-curation',
      function (e) {
        e.preventDefault();
        var $story = $(this).closest('li'), storySlug = $story.data('story-slug');

    //     selectStory = function ($story) {
    //       $story.addClass('selected');
    //       // $('#curate-gallery li').not($story).css('pointer-events', 'none');
    //       $story.find('.thumbnail-view-hover').css('transform', 'none');
    //       $story.find('img').css('opacity', '0.1');
    //     };
    // selectStory($story);

    // replacing state ensure turbolinks:false for the first tab state
        window.history.replaceState(
          { turbolinks: false }, null, '/curate'
        );
    // default to true, though this will lead to unnecessary requests in the case
    // of back/forward navigation (but that's better than not making a turbolinks
    // request when necessary)
        window.history.pushState(
          { turbolinks: true }, null, '/curate/' + storySlug
        );

        $.ajax({
          url: '/stories/' + $story.data('story-id') + '/edit',
          method: 'get',
          dataType: 'html',
          success: function (html, status, xhr) {
            $.when(
                $('#curate-story').empty().append(html)
              ).then(function () {
                  initContributorsTable('curate');
                  $('a[href="#curate-story"]').tab('show');
                });
          }
        });
      })

    .on('change', '.curate.curator-select, .curate.category-select,' +
        '.curate.product-select, .curate.published, .curate.preview-published, ' +
        '.curate.logo-published, .curate.pending-curation',
      function (e) {
        filterCurateGallery();
      });
}

function filterCurateGallery () {
  var stories = [], $gallery= $('#curate-gallery'),
      storiesTemplate = _.template($('#stories-template').html()),
      curatorId = $('.curate.curator-select').val(),
      categoryId = $('.curate.category-select').val(),
      productId = $('.curate.product-select').val(),
      showPublished = $('.curate.published').prop('checked'),
      showPreviewPublished = $('.curate.preview-published').prop('checked'),
      showLogoPublished = $('.curate.logo-published').prop('checked'),
      showPendingCuration = $('.curate.pending-curation').prop('checked');

  var curatorStoryIds = (curatorId === '0') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
                  return story.success.curator_id == curatorId;
        }), 'id');
        // console.log(curatorStoryIds)
  var categoryStoryIds = (categoryId === '0') ? _.pluck(app.stories, 'id') :
        _.pluck(app.stories.filter(function (story) {
                  return story.success.story_categories &&
                     story.success.story_categories.some(function (category) {
                       return category.id == categoryId;
                     });
        }), 'id');
        // console.log(categoryStoryIds)
  var productStoryIds = (productId === '0') ? _.pluck(app.stories, 'id') :
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
        // console.log(publishedStoryIds)
  var previewStoryIds =
        _.pluck(app.stories.filter(function (story) {
                  return !story.published && story.preview_published;
        }), 'id');
  var logoStoryIds =
        _.pluck(app.stories.filter(function (story) {
                  return !story.published && !story.preview_published && story.logo_published;
        }), 'id');
        // console.log(logoStoryIds)
  var pendingStoryIds =
        _.pluck(app.stories.filter(function (story) {
                  return !story.published && !story.preview_published && !story.logo_published;
        }), 'id');
      // console.log(pendingStoryIds)

  storyIds = _.intersection(curatorStoryIds, categoryStoryIds, productStoryIds);
  // console.log('after intersection: ', storyIds);
  storyIds = showPublished ? storyIds : _.difference(storyIds, publishedStoryIds);
  // console.log('after removing published (if necessary): ', storyIds)
  storyIds = showPreviewPublished ? storyIds : _.difference(storyIds, previewStoryIds);
  storyIds = showLogoPublished ? storyIds : _.difference(storyIds, logoStoryIds);
  // console.log('after removing logo published (if necessary): ', storyIds)
  storyIds = showPendingCuration ? storyIds : _.difference(storyIds, pendingStoryIds);
  // console.log('after removing pending (if necessary): ', storyIds)
  stories = app.stories.filter(function (story) {
              return storyIds.includes(story.id);
            });

  // console.log('results: ', stories);
  $gallery.empty()
    .append(
      $(storiesTemplate({ stories: stories, isCurator: true }))
    )
    .hide().show('fast');

}

// when a story is selected,
// - disallow pointer events on other stories
// - stay in persistent hover state





