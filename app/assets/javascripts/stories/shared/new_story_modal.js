
function newStoryListeners () {

  $(document)

    .on('click', '.success-actions .start-curation', function () {

      var customerId = $(this).closest('tr').data('customer-id'),
          successId = $(this).closest('tr').data('success-id');

      $('#new-story-form select.customer')
        .val( customerId ).trigger('change')
        .prop('disabled', true);

      $('#new-story-form select.success')
        .val( successId ).trigger('change')
        .prop('disabled', true);

      $('#new-story-modal').modal('show');

    })

    // new story modal (accessed from both Prospect and Curate)
    .on('show.bs.modal', '#new-story-modal', function () {
      if ( $('a[href="#curate"]').parent().hasClass('active') ) {
        $('.form-group.success').addClass('hidden');
      }
    })
    .on('shown.bs.modal', '#new-story-modal', function () {
      $('#new-story-form #story_title')[0].focus();
    })

     // if Curate view, success name mirrors story title
    .on('change', '#new-story-form #story_title', function () {
      if ( $('a[href="#curate"]').parent().hasClass('active') ) {
        $('#new-story-form #story_success_attributes_name').val( $(this).val() );
      }
    })

    // select customer by id or create a new customer
    .on('change', '#new-story-form select.customer', function () {
      $('#new-story-form #story_success_attributes_customer_id, ' +
          '#new-story-form #story_success_attributes_customer_attributes_id')
        .val( isNaN($(this).val()) ? null : $(this).val() );
      $('#new-story-form #story_success_attributes_customer_attributes_name')
        .val( $(this).find('option:selected').text() );
    })

    // update hidden fields on success change
    .on('change', '#new-story-form select.success', function () {
      $('#new-story-form #story_success_id, ' +
          '#new-story-form #story_success_attributes_id')
        .val( isNaN($(this).val()) ? null : $(this).val() );
      $('#new-story-form #story_success_attributes_name')
        .val( $(this).find('option:selected').text() );
    })

    // reset modal
    .on('hidden.bs.modal', '#new-story-modal', function () {
      // form inputs to default values
      $(this).find('form')[0].reset();
      // show everything by default
      $('.form-group.success').removeClass('hidden');
      // select2 inputs to default values
      $('#new-story-form select.customer')
        .prop('readonly', false)
        .val('').trigger('change.select2');
      $('#new-story-form select.success')
        .prop('readonly', false)
        .val('').trigger('change.select2');
      $('#new-story-form .story-tags')
        .val('').trigger('change.select2');
    })

    .on('submit', '#new-story-form', function () {
      $('button[type="submit"][form="new-story-form"] span').toggle();
      $('button[type="submit"][form="new-story-form"] .fa-spinner').toggle();
    });

}