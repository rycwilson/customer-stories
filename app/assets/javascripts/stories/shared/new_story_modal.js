
function newStoryListeners () {

  $(document)

    .on('click', '.success-actions .start-curation', function () {

      var customerId = $(this).closest('tr').data('customer-id'),
          successId = $(this).closest('tr').data('success-id');

      $('select.new-story.customer')
        .val( customerId ).trigger('change');
      $('select.new-story.customer')
        .prop('disabled', true);

      $('select.new-story.success')
        .val( successId ).trigger('change');
      $('select.new-story.success')
        .prop('disabled', true);

      $('#new-story-modal').modal('show');

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

     // select2 needs a hack for search placeholder
    .on("select2:open", "select.new-story.customer", function() {
      $(".select2-search--dropdown .select2-search__field").attr("placeholder", 'Search or enter the name of a New Customer');
    })
    .on("select2:close", "select.new-story.customer", function() {
        $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
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
    });

}