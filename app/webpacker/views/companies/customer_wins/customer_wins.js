
import { setSearch, toggleChildRow } from '../tables';
import cwTable from './cw_table';
import cwForm from './cw_form';
import customerFormTemplate from './customer_form';
import childRowTemplate from './cw_child_row';
import winStory from './win_story';
import { addListeners as addActionsDropdownListeners } from './cw_actions';

export default {
  addListeners() {
    addActionsDropdownListeners();
    winStory.addListeners();
    cwForm.addListeners();
    $(document)
      .on(
        'click', 
        '#successes-table td.toggle-child-row', 
        toggleChildRow(childRowTemplate, winStory.load)
      )
      .on('change', '#show-wins-with-story', (e) => {
        setSearch($('#successes-table'), true).draw();
      })
      .on('click', 'button[data-target="#edit-customer-modal"]', showCustomerForm)
      .on('click', '.customer-logo__upload', uploadCustomerLogo)
      .on('change', 'input[name*="show_name_with_logo"]', toggleCustomerNameWithLogo)
  },
  initForm() {
    cwForm.init();
  },
  table: {
    init(deferred) {
      cwTable.init(deferred);
    },
    renderHeader(curators, successes, customers) {
      $('#successes-table').closest('[id*="table_wrapper"]').prepend(
        cwTable.headerTemplate(curators, successes, customers)
      );
    }
  }
}

function showCustomerForm(e) {
  e.stopImmediatePropagation();   // stop row group from sorting alphabetically
  const $btn = $(this);
  // TODO how to init the s3 
  const s3 = {
    fields: '',
    url: '',
    host: ''
  }
  $.ajax({
    url: `/customers/${ $btn.data('customer-id') }`,
    method: 'get',
    dataType: 'json'
  })
    .done((customer, status, xhr) => {
      // TODO initS3Upload($('#customer-form')) 
      $('#edit-customer-modal .modal-body').empty().append( 
        customerFormTemplate(customer, s3) 
      );
    })
}

function uploadCustomerLogo(e) {
  const $btn = $(this);
  const $previewImg = $(this).closest('.fileinput').find('.fileinput-preview img');
  if ($previewImg.attr('src')) {
    // click on the existing image
    $(this).closest('.fileinput').find('.thumbnail')[1].click();
  } else {
    // click on the placeholder
    $(this).closest('.fileinput').find('.thumbnail')[0].click();
  }
}

function toggleCustomerNameWithLogo(e) {
  const $input = $(this);
  $input.closest('.customer-logo').find('.customer-name').toggle();
}











