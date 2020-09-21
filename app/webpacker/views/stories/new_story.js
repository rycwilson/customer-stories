export default {
  initSelectInputs() {
    $('select.new-story.customer, select.new-story.success')
      .select2({
        theme: 'bootstrap',
        tags: true,  // to allow custom input
        selectOnClose: true,
        placeholder: 'Select or Create',
      });
    $('.story-tags:not(.story-settings)')
      .select2({
        theme: 'bootstrap',
        placeholder: 'Select'
      })
      .on('select2:select, select2:unselect, change.select2', modifyTags)
  },
  addListeners() {
    $(document)
      .on('click', '.success-actions .start-curation', onStartStory)
      .on('show.bs.modal', '#new-story-modal', onShowModal)
      .on('change', '[name="story[title]"]', onTitleChange)
      .on('change', '#new-story-form select.customer', onCustomerChange)
      .on('change', '#new-story-form select.success', onCustomerWinChange)
      .on('select2:open', 'select.new-story.customer', toggleCustomerPlaceholder(true))
      .on('select2:close', 'select.new-story.customer', toggleCustomerPlaceholder())
      .on('hidden.bs.modal', '#new-story-modal', onHiddenModal);
  }
}

function onStartStory(e) {
  const customerId = $(this).closest('tr').data('customer-id');
  const cwId = $(this).closest('tr').data('success-id');
  $('select.new-story.customer').val(customerId).trigger('change');
  $('select.new-story.customer').prop('disabled', true);
  $('select.new-story.success').val(cwId).trigger('change');
  $('select.new-story.success').prop('disabled', true);
  $('#new-story-modal').modal('show');
}

function onShowModal(e) {
  if (isCurateView()) $('#new-story-modal').addClass('curate');
}

function onHiddenModal(e) {
  $(this).find('form')
    .removeClass('curate')
    .find('select.customer')
      .prop('readonly', false).val('').trigger('change.select2')
      .end()
    .find('select.success')
      .prop('readonly', false).val('').trigger('change.select2')
      .end()
    .find('.story-tags')
      .val('').trigger('change.select2')
      .end()
    .get(0).reset();    // form inputs to default values
}

function onTitleChange(e) {
  const $input = $(this);
  if (isCurateView()) {
    $('#new-story-form #story_success_attributes_name').val($input.val());
  }
}

function onCustomerChange() {
  const $input = $(this);
  $('#story_success_attributes_customer_id, #story_success_attributes_customer_attributes_id')
    .val( isNaN($input.val()) ? null : $input.val() );
  $('#story_success_attributes_customer_attributes_name')
    .val( $input.find('option:selected').text() );
}

function onCustomerWinChange() {
  const $input = $(this);
  $('#story_success_id, #story_success_attributes_id')
    .val( isNaN($input.val()) ? null : $input.val() );
  $('#story_success_attributes_name')
    .val( $input.find('option:selected').text() );
}

// placeholder hack
function toggleCustomerPlaceholder(isOpen) {
  return () => (
    $('.select2-search--dropdown .select2-search__field').attr(
      'placeholder', 
      isOpen ? 'Search or enter the name of a New Customer' : null
    )
  );
}

function modifyTags(e) {
  const $select = $(this);
  $select.next('.select2')
    .find('.select2-selection__choice__remove')
      .html('<i class="fa fa-fw fa-remove"></i>');
}

// TODO add global helpers for functions like this
function isCurateView() {
  $('a[href="#curate"]').is('[aria-expanded="true"]');
}

