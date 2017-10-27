
function successActionsListeners () {

  var forceFilters = function (successId) {
    // if the success is not in the result data set after filter is applied,
    // enable a checkbox filter that will amke it appear
    // how to choose which filter?
    // choose the show-published filter, because we want to show all contributors
    // to a given win/story, not just toggle individual users
    // but if
  }

  $(document)

    .on('click', '.success-actions .manage-contributors', function (e) {
      var successId = $(this).closest('tr').data('success-id');
      $('a[href="#prospect-contributors"]').tab('show');
      $('#contributors-filter').val('success-' + successId).trigger('change');
      // for a filtered view, default to checkbox filters all applied (nothing hidden)
      $('.contributors.checkbox-filter input').prop('checked', true).trigger('change');
    })

    .on('click', '.success-actions .start-curation', function () {
      // see stories/shared/new_story.js
    })

    .on('click', '.success-actions .add-contributor', function (e) {

      var $modal = $('#new-contributor-modal'),
          customerId = $(this).closest('tr').data('customer-id'),
          successId = $(this).closest('tr').data('success-id');

      $('a[href="#prospect-contributors"]').tab('show');
      $('#contributors-filter').val('success-' + successId).trigger('change');
      $modal.modal('show');
      $modal.find('#contribution_customer_id').val(customerId).trigger('change');
      $modal.find('#contribution_success_id').val(successId).trigger('change');

    });
}


