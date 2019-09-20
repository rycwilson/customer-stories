
function storiesIndex () {
  // there's a timing issue if trying to click immediately per gon.preview_story,
  // so pass a callback to initGridPreviews
  initGridPreviews({}, function () {
    if (gon.preview_story) {
      $('li[data-story-id="' + gon.preview_story.toString() + '"] > a')[0].click();
      delete gon.preview_story;
    }
  });
  // for a sync load, this isn't necessary => server will provide pre select
  // but what about a turbolinks restore?
  // preSelectFilters(getQueryString('category'), getQueryString('product'));

  // truncate story titles
  $('.story-card__title').each(function () {
    var $title = $(this).find('p');
    while ($title.outerHeight() > $(this).height()) {
      $title.text(function (index, text) {
        return text.replace(/\W*\s(\S)*$/, '...');
      });
    }
  });

}

function storiesIndexListeners () {

  $.fn.forceRedraw = function() {
    return this.hide(0, function() { $(this).show(); });
  };

  // this function is copied over from select2.js
  var prependTagType = function () {
        $('.select2-selection__rendered li:not(:last-of-type)')
          .each(function (index, tag) {
            tagId = $('.stories-filter__select--grouped').select2('data')[index].id;
            tagText = $('.stories-filter__select--grouped').select2('data')[index].text;
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
      },
      // when selecting a filter, sync select tags across different views (xs, sm, md-lg)
      // change.select2 => prevents the change event from triggering
      syncSelectTags = function (categoryId, productId) {
        var multiSelectFilterVal = [];
        if (categoryId) multiSelectFilterVal.push('c' + categoryId);
        if (productId) multiSelectFilterVal.push('p' + productId);
        $('.stories-filter__select--grouped').val(multiSelectFilterVal).trigger('change.select2');
        $('.stories-filter__select--category').val(categoryId).trigger('change.select2');
        $('.stories-filter__select--product').val(productId).trigger('change.select2');
      };

  $(document)

    .on('input', '.search-stories input', function () {
      $('.search-stories__input').not($(this)).val($(this).val());
      $('.search-stories input[type="hidden"]').val($(this).val());
      $('.search-stories__clear').hide();
    })
    .on('click', '.search-stories button[type="submit"]', function (e) {
      e.preventDefault();
      var $form = $(this).closest('form');
      if ($form.find('input').val() === '') {
        // false => reload from cache if available; true => reload from server
        location.reload(false)  
      } else {
        $('.search-stories__results').text('');
        replaceStateStoriesIndex('', '');
        $form.submit();
      }
    })
    .on('click', '.search-stories__clear', function () {
      var $form = $(this).closest('form')
      $form.find('input').val('').trigger('input');
      $('.search-stories__results').text('');
      updateGallery($(
        _.template($('#stories-template').html())({
          stories: filterStories('', ''),
          isCurator: false
        })
      ));
    })

    .on('click touchstart', 'li[data-story-id]:not(.hover) a.published', function (e) {
      // console.log('click touchstart')
      var $storyLink = $(this),
          $storyCard = $(this).parent(),
          storyLoading = function () {
            // the forceRedraw is necessary because the style changes won't take affect while the link is being followed
            $storyCard.addClass('loading still-loading').forceRedraw();

            // don't appy this change to current $storyCard or link won't be followed
            $('#stories-gallery li').not($storyCard).css('pointer-events', 'none');
          };

      if (e.type === 'click') {
        // console.log('click')
        storyLoading();
      } else {
        // console.log('touchstart')
        e.preventDefault();
        $storyCard.addClass('hover');

        // stop the subsequent touchend event from triggering the <a> tag
        $storyLink.one('touchend', function (e) {
          // console.log('touchend');
          e.preventDefault();
        });

        // next tap => load story
        $storyLink.one('touchstart', storyLoading);

        // undo style changes when navigating away
        // TODO: doesn't work
        window.addEventListener('beforeunload', function (e) {
          $storyCard.removeClass('loading still-loading');
          $('#stories-gallery li').css('pointer-events', 'auto');
        }, { once: true });

        // undo hover and click listener if clicking anywhere outside the story card
        $('body').one(
          'touchstart',
          // this selector is still allowing a click on the title <p> to trigger this listener => check in the function instead
          // ':not(li[data-story-id]:nth-of-type(' + $storyCard.index() + 1 + '), li[data-story-id]:nth-of-type(' + $storyCard.index() + 1 + ') *)',
          function (e) {
            // console.log('body touchstart')
            if ($(e.target).is($storyCard) || $storyCard.has(e.target).length ) {
              console.log('story card')
              // do nothing (link will be followed)
            } else {
              // console.log('not story card')
              $storyCard.removeClass('hover');
              $storyLink.off('touchstart', storyLoading);
            }
          }
        );

        // remove hover from other cards
        $('#stories-gallery').find('li').not($storyCard).each(function () {
          $(this).removeClass('hover');
        });
      }
    })

    .on('change', '.stories-filter__select', function () {
      var isGroupedFilter = $(this).is('[class*="--grouped"]'),
          $categoryFilter = $('.stories-filter__select--category'),
          $categoryResults = $('.stories-filter__results--category'),
          $productFilter = $('.stories-filter__select--product'),
          $productResults = $('.stories-filter__results--product'),
          $combinedResults = $('.stories-filter__results--grouped, .search-and-filters__results--combined'),
          filterResults = function (numFoundStories) {
            return numFoundStories === 1 ?
                      "1 story found" :
                      numFoundStories + "\xa0stories found";
          },
          categoryId, categorySlug,
          productId, productSlug,
          filteredStories;

      if (isGroupedFilter) {
        var categoryRawId = $(this).val() && 
                $(this).val().find(function (tagId) {
                  return tagId.includes('c');
                }),
            categoryId = categoryRawId && 
                         categoryRawId.slice(1, categoryRawId.length),
            categorySlug = categoryId &&
                $(this).find('optgroup[label="Category"] option:selected')
                         .data('slug'),
            productRawId = $(this).val() && 
                $(this).val().find(function (tagId) {
                  return tagId.includes('p');
                }),
            productId = productRawId && 
                        productRawId.slice(1, productRawId.length),
            productSlug = productId &&
                $(this).find('optgroup[label="Product"] option:selected')
                  .data('slug');

      } else {
        categoryId = $categoryFilter.val();
        categorySlug = categoryId && $categoryFilter.find('option:selected').data('slug');
        productId = $productFilter.val();
        productSlug = productId && $productFilter.find('option:selected').data('slug');
      }
          
      filteredStories = filterStories(categoryId, productId);

      // reset search
      $('.search-stories__input').val('').trigger('input');
      $('.search-stories__results').text('');

      // show/clear results 
      if (categoryId || productId) {
        $combinedResults.each(function () {
          $(this).text(
            $(this).is('[class*="--grouped"]') ?
              filterResults(filteredStories.length) :
              'Applied filters:\xa0\xa0' + filterResults(filteredStories.length)
          )
        });
        if (categoryId) {
          $categoryResults.text( 
            filterResults(filterStories(categoryId, '').length) 
          );
        } else {
          $categoryResults.text('');
        }
        if (productId) {
          $productResults.text( 
            filterResults(filterStories('', productId).length) 
          );
        } else {
          $productResults.text('');
        }
      } else {
        $combinedResults.add($categoryResults).add($productResults).text('');
      }

      syncSelectTags(categoryId, productId);
      prependTagType();
      updateGallery($(
        _.template($('#stories-template').html())({
          stories: filteredStories,
          isCurator: false
        })
      ));
      replaceStateStoriesIndex(categorySlug, productSlug);
    });
}

function filterStories (categoryId, productId) {
  var publicStories = CSP.stories.filter(function (story) {
          return story.logo_published || story.preview_published;
        }),
      categoryStoryIds = (!categoryId) ? _.pluck(publicStories, 'id') :
        _.pluck(publicStories.filter(function (story) {
          return story.success.story_categories &&
             story.success.story_categories.some(function (category) {
               return category.id == categoryId;
             });
        }), 'id'),
      productStoryIds = (!productId) ? _.pluck(publicStories, 'id') :
        _.pluck(publicStories.filter(function (story) {
          return story.success.products &&
            story.success.products.some(function (product) {
              return product.id == productId;
            });
        }), 'id'),
      storyIds = _.intersection(categoryStoryIds, productStoryIds);
  return publicStories.filter(function (story) {
    return storyIds.includes(story.id);
  });
}

// in progress; may not be necessary at all
function preSelectFilters (categorySlug, productSlug) {
  // var $categorySelect =
  // var categoryRawId = null, categoryId =productId = null;
  // if (categorySlug) {
  //   categoryRawId = $categorySelect.find("option[data-slug='" + categorySlug + "']").val();
  //   $categorySelect.val(categoryRawId).trigger('change.select2');
  // }
  // if (productSlug) {
  //   filterId = $productSelect.find("option[data-slug='" + productSlug + "']").val();
  //   $productSelect.val(filterId).trigger('change.select2');
  //   if ($categorySelect.length) { $categorySelect.val('0').trigger('change.select2'); }
  // } else {
  //   $categorySelect.val('0').trigger('change.select2');
  //   $productSelect.val('0').trigger('change.select2');
  // }
  // $("[name='category_select'] + span")
  //   .find('.select2-selection')
  //   .each(function () { $(this).blur(); });
  // $("[name='product_select'] + span")
  //   .find('.select2-selection')
  //   .each(function () { $(this).blur(); });
}

function updateGallery ($stories) {
  $('#stories-gallery').imagesLoaded(function () {
    $('#stories-gallery')
      .empty()
      .append($stories)
      .hide()
      .show('fast', initGridPreviews);
  });
}

// turbolinks will not save filter info to the state, so it's not included
function replaceStateStoriesIndex (categorySlug, productSlug) {
  if (!categorySlug && !productSlug) {
    history.replaceState({ turbolinks: true }, null, '/');
  } else if (categorySlug && !productSlug) {
    history.replaceState({ turbolinks: true }, null, '?category=' + categorySlug);
  } else if (!categorySlug && productSlug) {
    history.replaceState({ turbolinks: true }, null, '?product=' + productSlug);
  } else if (categorySlug && productSlug) {
    history.replaceState({ turbolinks: true }, null, '?category=' + categorySlug + '&product=' + productSlug);
  } else {
    // error
  }
}


//
// With { turbolinks: true } in all calls to history.pushState(),
// turbolinks is handling the browser history.
//
// function popstateHandler ($categorySelect, $productSelect, storiesTemplate) {

//   window.onpopstate = function (event) {

//     // if (event.state.turbolinks) { return false; }

//     var categorySlug = getQueryString('category'),
//         productSlug = getQueryString('product');
//         // categoryId = $categorySelect ? $categorySelect.find(':selected').val() : null,
//         // productId = $productSelect ? $productSelect.find(':selected').val() : null,

//     if (event.state.filter) {

//       var filterTag = event.state.filter.tag;
//       var filterId = event.state.filter.id; // this may be a slug

//       filteredStories = filterStories(filterTag, filterId);
//       updateGallery($(storiesTemplate({
//                          stories: filteredStories,
//                          isCurator: CSP.current_user.is_curator })));
//       selectBoxesTrackQueryString($categorySelect, categorySlug, $productSelect, productSlug);

//     // Safari only (calls window.onpopstate on initial load)
//     // } else {
//       // replacePageState($categorySelect, categorySlug, $productSelect, productSlug);
//     }
//   };
// }