
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

  if ($gallery.children().length === 0 && app.stories.length !== 0 ) {
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
  } else if (app.stories.length === 0) {
    Cookies.remove('csp_init'); // let server know we don't have stories data
    Turbolinks.visit('/');
  }

  // selectBoxesTrackQueryString($categorySelect, categorySlug, $productSelect, productSlug);
}

function storiesShow () {
  loadVideoThumbnail();
  widgetsMonitor();
}

function storiesEdit () {
}




