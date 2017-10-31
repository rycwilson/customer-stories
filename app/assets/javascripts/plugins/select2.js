
/*
  It would be nice to have a .tags class to which the common
  settings (theme, tags) can be applied, but that doesn't work.
  Only one .select2() call per element will work, others ignored
*/
function initSelect2 () {

  // select2ScrollBoundaries();


  // TODO: What does this do?
  //  minimumResultsForSearch: -1
  /**
   * customer
   */
  $(".new-success.customer, .new-contributor.customer, .new-story.customer").select2({
    theme: "bootstrap",
    tags: true,  // to allow custom input
    selectOnClose: true,
    placeholder: 'Select or Create',
  });

  /**
   * success
   */
  $(".new-contributor.success, .new-story.success").select2({
    theme: "bootstrap",
    tags: true,  // to allow custom input
    selectOnClose: true,
    placeholder: 'Select or Create',
  });

  /**
   * contributor
   */
  $('.new-contributor.contributor').select2({
    theme: 'bootstrap',
    // minimumResultsForSearch: -1,
    placeholder: 'Select or Create'
  });

  /**
   * referrer
   */
  $('.new-success.referrer, .new-contributor.referrer').select2({
    theme: 'bootstrap',
    placeholder: 'Select or Create'
  });

  $('.new-contributor.invitation-template').select2({
    theme: "bootstrap",
    placeholder: 'Select'
  });


  // story settings has its own init routine
  $('.story-tags:not(.story-settings)').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });

// ref: http://stackoverflow.com/questions/36497723
// console.log('uninitialized s2: ', $(document).find('select.stories-filter').not('.select2-hidden-accessible'));

  $('.customer-select, .curator-select, .category-select, .product-select').select2({
    theme: 'bootstrap',
    width: 'style'
  });
  $('.stories-filter').data('init', true);

  // $('.stories-filter').each(function () {
  //   if ($(this)[0].getAttribute('data-init') === null) {
  //     console.log("init'ing select2");
  //     $(this).select2({
  //       theme: 'bootstrap',
  //       width: 'style'   // get the width from stories.scss
  //     });
  //     $(this)[0].setAttribute('data-init', true);
  //   }
  // });

// }

/*
  Company tags are for maintaining a list of options for Story tagging
  Thus, company tag select boxes should not show a list of options, because the
  options are being created at this stage.  There is nothing to select.
  */
  $('.company-tags').select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'Add tags'
  });

  $('select.crowdsourcing-template').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });

  $('.widget-filter-category').select2({
    theme: 'bootstrap',
    placeholder: 'Select category',
    width: 'style'
  });

  $('.widget-filter-product').select2({
    theme: 'bootstrap',
    placeholder: 'Select product',
    width: 'style'
  });

  // restore last selected value
  // change the selected item, but avoid 'change' event
  $('select').each(function () {
    if ($(this).hasClass('stories-filter') &&
        (preSelect = $(this).data('pre-select'))) {
      $(this).val(preSelect.toString()).trigger('change.select2');
    }
  });

  $('#charts-story-select, #visitors-story-select, #ads-preview-story-select')
    .select2({
      theme: 'bootstrap',
      width: 'style'
    });

}

function select2Listeners () {
  // prevents the options list from showing when a tag is removed
  $('.select2').prev()
               .on('select2:unselecting', function (e) {
                 $(this).data('unselecting', true);
               })
               .on('select2:open', function (e) { // note the open event is important
                 if ($(this).data('unselecting')) {
                   $(this).removeData('unselecting'); // you need to unset this before close
                   $(this).select2('close');
                 }
               });
}

// ref: http://stackoverflow.com/questions/8737709
function select2ScrollBoundaries () {
  var maxY = null;
  $(document).on('wheel', '.select2-results__options', function (event) {

    maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
    // console.log('scrollHeight: ', $(this).prop('scrollHeight'))
    // console.log('offsetHeight: ', $(this).prop('offsetHeight'))
    // If this event looks like it will scroll beyond the bounds of the element,
    // prevent it and set the scroll to the boundary manually
    if ($(this).prop('scrollTop') + event.originalEvent.deltaY < 0 ||
        $(this).prop('scrollTop') + event.originalEvent.deltaY > maxY) {
      event.preventDefault();
      $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + event.originalEvent.deltaY)));
    }
  });
}