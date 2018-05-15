
/*
  It would be nice to have a .tags class to which the common
  settings (theme, tags) can be applied, but that doesn't work.
  Only one .select2() call per element will work, others ignored
*/
function initSelect2 () {

  // select2ScrollBoundaries();

  // for customers, successes, contributors, referrers => don't initialize if the form submission modal is still open

  /**
   * customer (includes new success, new contributor, new story)
   */
  $("select.customer:not(.modal.in select)").select2({
    theme: "bootstrap",
    tags: true,  // to allow custom input
    selectOnClose: true,
    placeholder: 'Select or Create',
  });

  /**
   * success (includes new contributor, new story)
   */
  $("select.success:not(.modal.in select)").select2({
    theme: "bootstrap",
    tags: true,  // to allow custom input
    selectOnClose: true,
    placeholder: 'Select or Create',
  });

  /**
   * contributor (includes new success, new contributor)
   */
  $('select.contributor:not(.modal.in select)').select2({
    theme: 'bootstrap',
    // minimumResultsForSearch: -1,
    placeholder: 'Select or Create'
  });

  /**
   * referrer (includes new success, new referrer)
   */
  $('select.referrer:not(.modal.in)').select2({
    theme: 'bootstrap',
    placeholder: 'Select or Create'
  });

  /**
   * curator (includes new success, new contributor)
   */
   $('.new-success.curator').select2({
     theme: 'bootstrap',
     placeholder: 'Select'
   });

  $('.new-contributor.invitation-template').select2({
    theme: "bootstrap",
    placeholder: 'Select'
  });


  /**
   * may not be present if datatables not yet rendered
   * this code duplicated from csp_datatables.js
   */
  if ($('.successes-header').length && $('.contributors-header').length) {
    $('.crowdsource.curator-select')
       .select2({
         theme: 'bootstrap',
         width: 'style',
         minimumResultsForSearch: -1   // hides text input
       })
       // select2 is inserting an empty <option> for some reason
       .children('option').not('[value]').remove();
    $('.dt-filter').select2({
       theme: 'bootstrap',
       width: 'style',
       // allowClear: true
    });
  }

  // story settings has its own init routine
  $('.story-tags:not(.story-settings)').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });

  $('#curate-filters select').select2({
    theme: 'bootstrap',
    width: 'style',
    placeholder: 'Select',
    allowClear: true
  })
    .on("select2:unselecting", function (e) {
      $(this).data('state', 'unselected');
    })
    .on("select2:open", function (e) {
      if ($(this).data('state') === 'unselected') {
        $(this).removeData('state');
        var self = $(this);
        setTimeout(function() { self.select2('close'); }, 0);
      }
    });

  $('.stories-filter').select2({
      theme: 'bootstrap',
      placeholder: 'Select',
      allowClear: true,
      width: 'style'   // get the width from stories.scss
    })
    // ref https://stackoverflow.com/questions/29618382/disable-dropdown-opening-on-select2-clear
    .on('select2:unselecting', function() {
        $(this).data('unselecting', true);
      })
    .on('select2:opening', function(e) {
       if ($(this).data('unselecting')) {
         $(this).removeData('unselecting');
         e.preventDefault();
        }
      });

  $('#grouped-stories-filter').select2({
    theme: 'bootstrap',
    placeholder: 'Select Category and/or Product',
    tags: true,
    width: 'style',
  })
    // ref https://stackoverflow.com/questions/29618382/disable-dropdown-opening-on-select2-clear
    // the answer that worked above did not work for this one, but this one does:
    .on('select2:unselecting', function (e) {
      var self = $(this);
      setTimeout(function () {
        self.select2('close');
      }, 0);
    })
    // ref https://github.com/select2/select2/issues/4589
    .on('select2:selecting', function (e) {
      var siblings = e.params.args.data.element.parentElement.children;
      for(var i = 0; i < siblings.length; i++) {
        siblings[i].selected = false;
      }
    });

  // TODO Is this an issue?  http://stackoverflow.com/questions/36497723
  // $('.stories-filter').data('init', true);
  // $('.stories-filter').each(function () {
  //   if ($(this)[0].getAttribute('data-init') === null) {
  //     // console.log("init'ing select2");
  //     $(this).select2({
  //       theme: 'bootstrap',
  //       placeholder: 'Select',
  //       allowClear: true,
  //       width: 'style'   // get the width from stories.scss
  //     })
  //       .on('select2:unselecting', function() {
  //           $(this).data('unselecting', true);
  //         })
  //       .on('select2:opening', function(e) {
  //          if ($(this).data('unselecting')) {
  //            $(this).removeData('unselecting');
  //            e.preventDefault();
  //           }
  //         });
  //     $(this)[0].setAttribute('data-init', true);
  //   }
  // });

/*
  Company tags are for maintaining a list of options for Story tagging
  Thus, company tag select boxes should not show a list of options, because the
  options are being created at this stage.  There is nothing to select.
  */
  $('.company-tags').select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'Add tags',
    selectOnClose: true
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

// this works, but only hides options on removing a tag
// for hiding options whether adding or removing a tag, css is used to hide the results
// ref: https://github.com/select2/select2/issues/3320
function select2Listeners () {
    // .on('select2:unselecting', function (e) {
    //   $(this).data('unselecting', true);
    // })
    // .on('select2:open', function (e) { // note the open event is important
    //   if ($(this).data('unselecting')) {
    //     $(this).removeData('unselecting'); // you need to unset this before close
    //     $(this).select2('close');
    //   }
    // });
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