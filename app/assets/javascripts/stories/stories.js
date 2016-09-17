
//= require ./index
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
    updateGallery($(storiesTemplate({
                      stories: app.stories,
                      isCurator: app.current_user &&
                                 app.current_user.is_curator })));
    // also make sure filters set to 'All'
  }

  // selectBoxesTrackQueryString($categorySelect, categorySlug, $productSelect, productSlug);

  // popstateHandler($categorySelect, $productSelect, storiesTemplate);

  /*
   *  Need to capture default filters (category=all, product=all)
   *  in the history object in order to enable history navigation
   *
   *  Safari calls window.onpopstate on initial page load,
   *  see function popstateHandler ()
   */
  // if (app.browser.isChrome || app.browser.isFirefox) {
    // replacePageState($categorySelect, categorySlug, $productSelect, productSlug);
  // }
}

function storiesShow () {
  loadVideoThumbnail();
}

function storiesEdit () {
  storiesEditInitBIP();
  storiesEditInitContentEditor();
}



