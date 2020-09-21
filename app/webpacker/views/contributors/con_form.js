import { formIsValid } from 'lib/forms';
import Rails from '@rails/ujs';
import dashboard from '../dashboard';
import contributors from './contributors';
import _uniq from 'lodash/uniq';

let $form;

export default {
  init() {
    initSelectInputs();
  },
  addListeners() {
    $(document)
      .on('show.bs.modal', '#new-contributor-modal', onShowModal)
      .on('hidden.bs.modal', '#new-contributor-modal', onHiddenModal)
      .on('select2:open', 'select.new-contributor.contributor', onOpenContributor)
      .on('select2:close','select.new-contributor.contributor', onCloseContributor)
      .on('change', 'select.new-contributor.customer', onCustomerChange)
      .on('change', 'select.new-contributor.success', onCustWinChange)
      .on('change', 'select.new-contributor.contributor', onContributorChange)
      .on('change', 'select.new-contributor.referrer', onReferrerChange)
      .on('change', '#new-contributor-form input[id*="email"]', onEmailChange)
      .on('select2:open', 'select.new-contributor', modifySearchPlaceholder)
      .on('select2:close', 'select.new-contributor', () => (
        $('.select2-search--dropdown .select2-search__field').attr('placeholder', null)
      ))
      .on('click', 'button[type="submit"][form="new-contributor-form"]', onSubmit);
  }
}

function initSelectInputs () {
  $('select.new-contributor.customer')
    .add('select.new-contributor.success')
    .add('select.new-contributor.contributor')
    .add('select.new-contributor.referrer')
    .select2({
      theme: 'bootstrap',
      // minimumResultsForSearch: -1,
      placeholder: 'Select or Create'
    });
  $('select.new-contributor.invitation-template').select2({
    theme: "bootstrap",
    placeholder: 'Select'
  });
}

// need to listen for the click on the submit button instead of 'submit' on 'new-contributor-form'
// => the button is outside the form, linked to it through form= attribute
// => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
function onSubmit (e) {
  var $form = $('#new-contributor-form'),
      $button = $(this);
  e.preventDefault();
  if (!$form.data('submitted') && validateForm()) {
    toggleFormWorking($form);
    $form.submit();
  } else {
  }
}

/**
 * pre-select fields if adding contributors from the curate view,
 * or if adding contributors while a filter is applied (success or customer)
 */
function onShowModal () {
  $form = $form || $('#new-contributor-form');
  let customerId, successId;
  const dtSuccesses = $('#successes-table').DataTable();
  if (dashboard.activeTab() == 'curate') {
    customerId = $('#edit-story-layout').data('customer-id');
    successId = $('#edit-story-layout').data('success-id');
    preSelectCustomerAndSuccess(customerId, successId);
  } else if ($('#contributors-filter').val().match(/customer/)) {
    customerId = $('#contributors-filter').val().match(/-(\d+)/)[1];
    preSelectCustomerAndSuccess(customerId, null);
  } else if ($('#contributors-filter').val().match(/success/)) {
    successId = $('#contributors-filter').val().match(/-(\d+)/)[1];
    customerId = dtSuccesses.row(`[data-success-id="${successId}"]`).data().customer.id;
    successId = preSelectCustomerAndSuccess(customerId, successId);
  }
}

function onHiddenModal () {
  resetForm();
}

function resetForm () {
  $form[0].reset();
  $form
    .find('.create-contributor, .create-referrer').addClass('hidden').end()
    .find('select').val('').trigger('change.select2').end()
    .find('select, select option').prop('disabled', false).end()
    .find('.form-group').removeClass('has-error').end()
    .find('.create-contributor input, .create-referrer input').prop('required', false).end()
    .find('button[type="submit"] span').css('display', 'inline').end()
    .find('button[type="submit"] i').css('display', 'none');
}

function onCustomerChange (e) {
  $form = $form || $('#new-contributor-form');
  const $select = $(this);
  const customerId = isNaN($select.val()) ? null : $select.val();
  const successVal = $form.find('select.new-contributor.success').val();
  const successId = isNaN(successVal) ? null : successVal;

  // re-enable any contributor options that were disabled via success selection
  $('select.new-contributor.contributor').find('option:disabled').prop('disabled', false);

  // update hidden customer_id
  $form.find('input[id*="success_attributes_customer_id"]').val(customerId);

  if (customerId) {
    // turn off customer attributes
    $form.find('input[id*="customer_attributes"]').each((index, input) => {
        $(input).prop('disabled', true);
      });
    tagSuggestedContributors(customerId);
  } else {
    // update and enable customer attributes
    $form.find('input[id*="customer_attributes_id"]').val('');
    $form.find('input[id*="customer_attributes_name"]').val(customerVal);
    $form.find('input[id*="customer_attributes"]').prop('disabled', false);

    /**
     * reset select.success if an existing success was previously selected
     * TODO: check if success belongs to selected customer (if so there's no need to reset)
     */
    if (successId) {
      $('select.new-contributor.success').val('').trigger('change.select2');
    }

    /**
     * reset select.new-contributor if an existing contributor was previously selected
     * TODO: check if contributor belongs to selected customer (if so there's no need to reset)
     */
    if ( $('select.new-contributor.contributor').val() !== '0' ) {
      $('select.new-contributor.contributor').val('').trigger('change.select2');
    }

  }

  // update select options
  updateSuccessOptions(customerId);
}

function onCustWinChange () {
  $form = $form || $('#new-contributor-form');
  const $select = $(this);
  const customerVal = $('select.new-contributor.customer').val();
  const successId = isNaN($select.val()) ? null : $select.val();
  const success = $('#successes-table').DataTable().column(1).data().toArray()
    .find(success => success.id == successId);
  const customerId = (success && success.customerId) || (isNaN(customerVal) ? null : customerVal);

  // re-enable any contributor options that were disabled via previous customerWin selection
  $('select.new-contributor.contributor').find('option:disabled').prop('disabled', false);

  // existing customerWin
  if (successId) {
    // update hidden success_id
    $form.find('input[id*="contribution_success_id"]').val(successId);

    // this will include customer attributes
    $form.find('input[id*="success_attributes"]').each((index, input) => {
      $(input).prop('disabled', true);
    });

    $('select.new-contributor.customer').val(customerId).trigger('change.select2');

    // update select options
    disableExistingContributors(successId);

  // create success
  } else {
    // update hidden fields
    $form
      .find('input[id*="contribution_success_id"]').val('').end()
      .find('input[id*="success_attributes_id"]').val('').end()
      .find('input[id*="success_attributes_name"]').val(successVal).end()

      // let the 'change' handler for select.customer manage customer attributes
      .find('input[id*="success_attributes"]:not([id*="customer_attributes"]')
        .prop('disabled', false);
  }
}

function onContributorChange (e) {
  $form = $form || $('#new-contributor-form');
  console.log('onContributorChange form', $form)
  const $select = $(this);

  // create contributor
  if ($select.val() === '0') {
    $('.new-contributor.create-contributor').removeClass('hidden');
    setTimeout(() => (
      $('.create-contributor input[id*="first_name"]')[0].focus()
    ), 0);

    // validate contributor fields
    $('.create-contributor').find('input:not([type="hidden"])').each((index, input) => (
      $(input).prop('required', true)
    ));

    // update hidden fields
    // $form.find('#contribution_contributor_id').val('');
    $form.find('input[id*="contributor_attributes"]').each((index, input) => (
      $(input).prop('disabled', false)
    ));

  } else {
    $('.create-contributor').addClass('hidden');

    // don't validate contributor fields
    $('.create-contributor').find('input:not([type="hidden"])').each((index, input) => (
      $(input).prop('required', false)
    ));

    // update hidden fields
    // $form.find('#contribution_contributor_id').val($(this).val());
    $form.find('input[id*="contributor_attributes"]').each((index, input) => (
      $(input).prop('disabled', true)
    ));
  }
}

function onOpenContributor () {
  const $select = $(this);

  // with blank new contributor search field, show suggestions; else show all
  showContributorOptions($select, true); // true => show suggested options if customer selected

  // not sure why the timeout is necessary here!
  setTimeout(function () {
    $('input.select2-search__field').attr("placeholder", 'Search or Create New Contributor');
  }, 0);
  $('input.select2-search__field')
    .data('prev', '')
    .on('input', monitorNewContributorSearch);
}

function onCloseContributor () {
  $('input.select2-search__field').off('input', monitorNewContributorSearch);
  $('input.select2-search__field').attr("placeholder", null);
}

function onReferrerChange () {
  const $select = $(this);
  disableReferrerAttrs($select.val() === '0');
}

// if a new user is created, their password is their email address
function onEmailChange () {
  const $input = $(this);
  $input
    .closest('div[class*="create-"]')  // could be .create-contributor or .create-referrer
    .find('input[id*="password"]')
      .val($input.val());
}

function preSelectCustomerAndSuccess (customerId, successId) {
  $('select.new-contributor.customer').val(customerId).trigger('change');
  $('select.new-contributor.success').val(successId).trigger('change');
  if (dashboard.activeTab() == 'curate') {
    $('select.new-contributor.customer, select.new-contributor.success')
      .prop('disabled', true);
  }
}

function monitorNewContributorSearch (e, data) {
  const $input = $(e.target);
  const prev = $input.data('prev');
  const curr = $input.val();
  const customerId = $('select.new-contributor.customer').val();
  if (prev === '') {
    showContributorOptions($input.closest('select'), false); // show all company contributors
  } else if (curr === '') {
    showContributorOptions(true); // show suggested (customer) contributors
  }
  $input.data('prev', curr);
}

function showContributorOptions (showSuggested) {
  $('.select2-results').css('display', 'none'); // avoid flicker (see below)
  const customerVal = $('select.new-contributor.customer').val();
  const customerId = Number.isInteger(parseInt(customerVal, 10)) ? customerVal : null;
  const customerContributorIds = [];
  let contributorId;

  // get the contributors for selected customer (if there is one)
  if (customerId) {
    $('select.new-contributor.contributor option').each((index, option) => {
      if ($(option).attr('data-suggested')) customerContributorIds.push($(option).val());
    });
  }

  /**
   * go through options and hide/show as necessary
   * (timeout needed since options are still loading at this point)
   */
  setTimeout(() => {
    $('.select2-results__option').each((index, option) => {
      contributorId = $(option).attr('id').match(/-(\d+)$/)[1];
      if (
        showSuggested &&
        customerId &&
        index > 0 &&  // skip over first option (- Create New Contributor -)
        !customerContributorIds.includes(contributorId)
      ) {
        $(this).css('display', 'none');
      } else {
        $(this).css('display', 'block');
      }
      $('.select2-results').css('display', 'initial'); // avoid flicker (see above)
    });
  }, 0);
}

function tagSuggestedContributors (customerId) {
  const companyContributions = $('#prospect-contributors-table').DataTable().rows().data().toArray();
  const customerSuccessContributions = companyContributions.filter((contribution) => (
    contribution.invitation_template &&
    contribution.invitation_template.name === 'Customer Success'
  ));
  const salesContributions = companyContributions.filter((contribution) => (
    contribution.invitation_template &&
    contribution.invitation_template.name === 'Sales'
  ));
  const customerContributions = companyContributions.filter((contribution) => (
    contribution.success.customer_id == customerId
  ));
  const suggestedContributorIds = _uniq(
    customerContributions, 
    false,
    contribution => contribution.contributor.id
  )
    .concat(_uniq(
      customerSuccessContributions, 
      false,
      contribution => contribution.contributor.id
    ))
    .concat(_uniq(
      salesContributions, 
      false,
      contribution => contribution.contributor.id
    ))
    .map(contribution => contribution.contributor.id.toString());
  isSuggested = (contributorId) => suggestedContributorIds.includes(contributorId);
  $('select.new-contributor.contributor option').each((index, option) => {
    $(option).attr('data-suggested', isSuggested($(option).val()));
  });
}

function disableExistingContributors (successId) {
  const $select = $('select.new-contributor.contributor');
  const successContributorIds = $('#prospect-contributors-table').DataTable()
    .rows().data().toArray().filter(contribution => (
      contribution.success.id == successId
    ))
    .map(contribution => contribution.contributor.id.toString());

  // disable any contributors already added to this success
  $select.find('option').each((index, option) => {
    $(option).prop('disabled', successContributorIds.includes($(option).val()));
  });

  // reset the options now that some are disabled
  $select.select2('destroy').select2({
    theme: "bootstrap",
    placeholder: 'Select or Create'
  });
}

function disableReferrerAttrs (shouldDisable) {
  $form = $form || $('#new-contributor-form');
  if (shouldDisable) {
    $form.find('.create-referrer').addClass('hidden');

    // don't validate referrer fields
    $form.find('.create-referrer input:not([type="hidden"])').each((index, input) => (
      $(input).prop('required', false)
    ));
  } else {
    $form.find('.create-referrer').removeClass('hidden');

    // validate referrer fields
    $form.find('.create-referrer input:not([type="hidden"])').each((index, input) => (
      $(input).prop('required', true)
    ));
  }
  ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
    .forEach(attribute => (
      $form.find('[id*="referrer_attributes_' + attribute + '"]')
           .prop('disabled', shouldDisable)
    ));
  if (!shouldDisable) {
    setTimeout(() => (
      $form.find('.create-referrer input[id*="first_name"]')[0].focus()
    ), 0);
  }
}

// select2 needs a hack for search placeholder
function modifySearchPlaceholder () {
  const $select = $(this);
  let placeholder = '';
  if ($select.hasClass('customer')) {
    placeholder = 'Search or enter the name of a New Customer';
  } else if ($select.hasClass('success')) {
    placeholder = 'Search or enter the name of a New Customer Win';
  } else if ($select.hasClass('invitation-template')) {
    placeholder = 'Search';
  } else if ($select.hasClass('referrer')) {
    placeholder = 'Search or Create New Contact';
  } 
  $('.select2-search--dropdown .select2-search__field').attr('placeholder', placeholder);
}

function updateSuccessOptions (customerId) {
  const successOptionsData = [{ id: '', text: '' }]; // default options data
  if (customerId) {
    const customerSuccesses = $('#successes-table').DataTable().rows().data().toArray()
      .filter(success => success.customer.id == customerId);
    const successOptionsData = customerSuccesses
      .map(success => ({ id: success.id, text: success.name }));
    successOptionsData.unshift({ id: '', text: '' });
  }
  // ref: https://github.com/select2/select2/issues/2830#issuecomment-229710429
  $('select.new-contributor.success').select2('destroy').empty()
    .select2({
      theme: 'bootstrap',
      tags: true,
      selectOnClose: true,
      placeholder: 'Select or Create',
      data: successOptionsData
    });
    // .prop('disabled', false);
}
