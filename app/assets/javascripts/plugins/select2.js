
/*
  It would be nice to have a .tags class to which the common
  settings (theme, tags) can be applied, but that doesn't work.
  Only one .select2() call per element will work, others ignored
*/
function initSelect2 () {

  $('.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

// ref: http://stackoverflow.com/questions/36497723
// console.log('uninitialized s2: ', $(document).find('select.stories-filter').not('.select2-hidden-accessible'));

  $('.curator-select, .category-select, .product-select').select2({
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
  $('.new-contributor-role').select2({
    theme: 'bootstrap'
  });
  $('.new-contributor-referrer').select2({
    theme: 'bootstrap',
    placeholder: 'Who referred you to this contributor?'
  });

  /*
    Company tags are for maintaining a list of options for Story tagging
    Thus, company tag select boxes should not show a list of options, because the
    options are being created at this stage.  There is nothing to select.
  */
  $('.company-tags').select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'add tags'
  });

  $('.templates-select').select2({
    theme: 'bootstrap',
    placeholder: 'select template'
  });

  $('.widget-filter-category').select2({
    theme: 'bootstrap',
    placeholder: 'select category',
    width: 'style'
  });

  $('.widget-filter-product').select2({
    theme: 'bootstrap',
    placeholder: 'select product',
    width: 'style'
  });

  // has the curate tab content been rendered?
  //   (it may not have been if company not yet registered)
  if ($('#curate-panel').length) {
    // is there a list of existing customers to choose from?
    if ($('.new-story-customer').length) {

      $(".new-story-customer").select2({  // single select
        theme: "bootstrap",
        tags: true,  // to allow new customer creation
        placeholder: 'select or create a new customer',
        // allowClear: true
      });
    }

    // when tagging stories, user can't create new tags,
    // has to do so under company settings
    // TODO: enable new tags from here?
    $(".new-story-tags").select2({
      theme: 'bootstrap',
      placeholder: 'select tag(s)'
    });

  }

  // restore last selected value
  // change the selected item, but avoid 'change' event
  $('select').each(function () {
    if ($(this).hasClass('stories-filter') &&
        (preSelect = $(this).data('pre-select'))) {
      $(this).val(preSelect.toString()).trigger('change.select2');
    }
  });

  $('#story-ctas-select').select2({
    theme: 'bootstrap',
    placeholder: 'select CTAs',
    tags: true
  });

  $('#charts-story-select, #visitors-story-select, #ads-preview-story-select')
    .select2({
      theme: 'bootstrap',
      width: 'style'
    });

  $(".new-success-customer").select2({
      theme: "bootstrap",
      tags: true,  // to allow new customer creation
      placeholder: 'select or create a new customer',
      // allowClear: true
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