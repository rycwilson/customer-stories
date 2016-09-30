
//= require ./index
//= require ./show
//= require ./edit

function attachStoriesHandlers () {
  storiesIndexHandlers();
  storiesEditHandlers();
}

function storiesIndex () {

  var $categorySelect = $("[name='category_select']"),
      categorySlug = getQueryString('category'),
      $productSelect = $("[name='product_select']"),
      productSlug = getQueryString('product'),
      storiesTemplate = _.template($('#stories-template').html()),
      // filtersTemplate = _.template($('#stories-filters-template').html()),
      $gallery = $('#stories-gallery');

  if ($gallery.children().length === 0 && app.stories) {

    if (app.current_user.is_curator) {
      updateGallery(
        $(storiesTemplate({ stories: app.stories, isCurator: true }) ));
    } else {
      updateGallery(
        $(storiesTemplate({
            stories: app.stories.filter(function (story) {
                       return story.logo_published; }),
            isCurator: false }) ));
    }
    // also make sure filters set to 'All'
  } else {
    // neither?
  }

  // selectBoxesTrackQueryString($categorySelect, categorySlug, $productSelect, productSlug);
}

function storiesShow () {
  loadVideoThumbnail();
  widgetsMonitor();
}

function storiesEdit () {
}




