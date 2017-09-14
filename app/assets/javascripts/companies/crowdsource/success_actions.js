
function successActionsListeners () {

  $(document)

    .on('click', '.success-actions-dropdown .manage-contributors',
      function (e) {
        // // if (no contributions) { e.preventDefault(); }
        var successId = $(this).closest('tr').data('success-id');
        $('a[href="#crowdsource-contributors"]').tab('show');
        $('#contributors-filter').val('success-' + successId).trigger('change');
      })

    .on('click', '.success-actions-dropdown .create-story',
      function () {
        var $modal = $('#new-story-modal'),
            customerId = $(this).closest('tr').data('customer-id'),
            successId = $(this).closest('tr').data('success-id');
        $modal.find('#story_customer').val(customerId).trigger('change');
        $modal.find('#story_success_id').val(successId);
        $modal.modal('show');
      })

    .on('shown.bs.modal', '#new-story-modal', function () {
      if (window.location.pathname === '/crowdsource') {
        $(this).find('#story_customer')[0].focus();
      }
    })

    .on('click', '.success-actions-dropdown .new-contributor',
      function (e) {
        var $modal = $('#new-contributor-modal'),
            customerId = $(this).closest('tr').data('customer-id'),
            successId = $(this).closest('tr').data('success-id');
        $('a[href="#crowdsource-contributors"]').tab('show');
        $('#contributors-filter').val('success-' + successId).trigger('change');
        $modal.modal('show');
        $modal.find('#contribution_customer_id').val(customerId).trigger('change');
        $modal.find('#contribution_success_id').val(successId).trigger('change');
      }
    );
}


