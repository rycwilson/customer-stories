
function successActionsListeners () {

  $(document)

    .on('click', '.success-actions .manage-contributors', function (e) {
      var successId = $(this).closest('tr').data('success-id');
      $('a[href="#prospect-contributors"]').tab('show');
      $('#contributors-filter').val('success-' + successId).trigger('change');
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


