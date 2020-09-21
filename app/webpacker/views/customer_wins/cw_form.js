
import { formIsValid } from 'lib/forms';
import Rails from '@rails/ujs';

let $modal, $form, $submitBtn;
const importedCustomerWins = [];

export default {
  init() {
    initSelectInputs();
  },
  addListeners() {
    $(document)
      .on('show.bs.modal', '#new-success-modal', onShowModal)
      .on('hide.bs.modal', '#new-success-modal', onHideModal)
      .on('hidden.bs.modal', '#new-success-modal', onHiddenModal)
      .on('change', '#new-success-form [name="source"]', onToggleSource)
      .on('change.bs.fileinput', '#new-success-form .fileinput', onFileSelect)
      .on('clear.bs.fileinput', '#new-success-form .fileinput', function () {
        $(this).find('.fileinput-filename').addClass('placeholder');
      })

       // make sure the input is clicked when its span wrapper is clicked
      .on('click', '#new-success-form .form-group.csv-file .btn-file', function (e) {
        if ($(e.target).is('.btn-file')) {
          $(this).find('label[for="csv-file-input"]')[0].click();
        }
      })
      .on('change', 'select.new-success.customer', onChangeCustomer)
      .on(
        'change', 
        'select.new-success.referrer, select.new-success.contributor', 
        onChangeContributor
      )
      .on('select2:open', 'select.new-success', onSelectOpen)
      .on('select2:close', 'select.new-success', (e) => (
        $('.select2-search--dropdown .select2-search__field')
          .attr('placeholder', null)
      ))
      .on('change', '#new-success-form input[id*="email"]', function (e) {
        $(this).closest('.create-contact')
                 .find('input[id*="password"]')
                   .val( $(this).val() );
      })

// need to listen for the click on the submit button instead of 'submit' on 'new-success-form'
// => the button is outside the form, linked to it through form= attribute
// => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
      .on(
        'click', 
        'button[type="submit"][form="new-success-form"]', 
        onSubmitClick
      )
      .on(
        'click', 
        'button[type="button"][form="new-success-form"]', 
        () => $('#new-success-modal').modal('hide')
      )
      .on('submit', '#new-success-form', function () {
        // console.log( $(this).serializeArray() );
      });
  }
}

function initSelectInputs() {
  $("select.new-success.customer").select2({
    theme: 'bootstrap',
    tags: true,  // to allow custom input
    selectOnClose: true,
    placeholder: 'Select or Create',
  });
  $('select.new-success.curator').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });
  $('select.new-success.referrer').select2({
    theme: 'bootstrap',
    placeholder: 'Select or Create'
  });
  $('select.new-success.contributor').select2({
    theme: 'bootstrap',
    placeholder: 'Select or Create'
  });
}

function onSelectOpen (e) {
  const $select = $(this);
  let placeholder;
  if ($select.hasClass('customer')) {
    placeholder = 'Search or enter the name of a New Customer';
  } else if ($select.hasClass('curator')) {
    placeholder = 'Search';
  } else if ($select.hasClass('referrer') || $select.hasClass('contributor')) {
    placeholder = 'Search or Create New Contact';
  }
  $('.select2-search--dropdown .select2-search__field')
    .attr('placeholder', placeholder);
}

function onShowModal(e) {
  $modal = $modal || $('#new-success-modal');
  $form = $form || $('#new-success-form');
  $submitBtn = typeof $submitBtn == undefined ? 
    $('button[type="submit"][form="new-success-form"]') : 
    $submitBtn;
  const curatorId = $('.curator-select').val();
  const filterVal = $('#successes-filter').val();
  if (filterVal.match(/customer/)) {
    $('select.new-success.customer')
      .val( filterVal.match(/customer-(\d+)/)[1] )
      .trigger('change.select2');
  }
  if (curatorId) {
    $('select.new-success.curator')
      .val( $('.prospect.curator-select').val() )
      .trigger('change');
  } 
}

function onHideModal(e) {
  const $modal = $(this);
  // actions don't work once the modal is hidden, so use a timeout...
  setTimeout(
    () => $modal
            // .find('.fileinput').fileinput('clear').end()
            .find('#source_create').trigger('click'),
    200
  );
}

function onHiddenModal() {
  const $modal = $(this);
  const $submitBtn = $('button[form="new-success-form"]');
  $form.show();
  $form[0].reset();
  $modal.find('.new-records').hide();
  disableContributionAttrs(true, 'referrer');
  disableContactAttrs(true, 'referrer');
  disableContributionAttrs(true, 'contributor');
  disableContactAttrs(true, 'contributor');
  $form
    .find('.create-contact').addClass('hidden').end()
    .find('select').val(null).trigger('change').end()
    .find('.form-group').removeClass('has-error').end()
    .find('.create-contact input').prop('required', false);
  $submitBtn
    .attr('type', 'submit')
    .find('span')
      .text('Create')
      .css('display', 'inline')
      .prop('disabled', false)
      .end()
    .find('i').hide();
}

function onSubmitClick(e) {
  e.preventDefault();
  const source = $form.find('[name="source"]:checked').val();
  const importedFileIsValid = source === 'import' && 
    importedCustomerWins.some(success => success.status === 'valid');
  if (!$form.data('submitted')) {
    if (importedFileIsValid) {
      toggleFormWorking($form);
      $.ajax({
        url: `/companies/${ APP.company.id }/successes/import`,
        method: 'post',
        data: {
          imported_successes: (
            importedCustomerWins
              .filter((success) => success.status === 'valid')
              .map((success) => { 
                const { status, ...statusRemoved  } = success;
                return statusRemoved; 
              })
          )
        },
        dataType: 'script'
      })
    } else if (formIsValid($form)) {
      disableBlankFields();
      Rails.fire($form[0], 'submit');
      $submitBtn.find('span, .fa-spin').toggle();
      $form.attr('data-submitted', 'true');
    } 
  }
}

function disableBlankFields() {
  if ($('select.new-success.referrer').val() === '') {
    disableContributionAttrs(true, 'referrer');
  }
  if ($('select.new-success.contributor').val() === '') {
    disableContributionAttrs(true, 'contributor');
  }
}

function onToggleSource(e) {
  const $btn = $(this);
  $form.find('.form-group:not(.source)')
         .add('.form-group.csv-file')
           .toggle();
  if ($btn.val() === 'import') {
    $form.find('.form-group').removeClass('has-error');
    $submitBtn.find('span').text('Import');
  } else {
    // TODO: switch from jasny to jquery fileupload
    // $form.find('.fileinput').fileinput('clear');
    $form.find('.fileinput-filename').addClass('placeholder').text('Upload');
    $('.form-group.csv-file')
      .removeClass('has-error has-warning has-success')
      .find('.help-block')
        .text('');
    $submitBtn.prop('disabled', false).find('span').text('Create');
  }
}

// ref https://stackoverflow.com/questions/30223361
function onFileSelect(e) {
  if (fileApiSupported) {
    const files = $(e.target).find('input[type="file"]')[0].files; // FileList object
    const file = files[0];
    $(e.target).find('.fileinput-filename').removeClass('placeholder');
    // read the file metadata
    // var output = ''
    //     output += '<span style="font-weight:bold;">' + escape(file.name) + '</span><br />\n';
    //     output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
    //     output += ' - FileSize: ' + file.size + ' bytes<br />\n';
    //     output += ' - LastModified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';
    // read the file contents
    readFile(file);
  } else {
    console.log('File API not supported in this browser')
  }
}

function importedFileIsValid(source, importedSuccesses) {
  return source === 'import' && 
    importedSuccesses.some(success => success.status === 'valid');
}

function onChangeCustomer(e) {
  const customerVal = $(this).val();
  const customerId = isNaN(customerVal) ? null : customerVal;

  // update hidden customer_id
  $form.find('#success_customer_id').val(customerId);

  if (customerId) {
    // turn off customer attributes
    $form.find('input[id*="customer_attributes"]')
           .each((index, input) => $(input).prop('disabled', true));
  } else {
    // update and enable customer attributes
    $form.find('input[id*="customer_attributes_id"]').val('').end()
         .find('input[id*="customer_attributes_name"]').val(customerVal).end()
         .find('input[id*="customer_attributes"]').prop('disabled', false);
  }
}

function onChangeContributor (e) {
  const $input = $(this);
  const contactType = $input.hasClass('referrer') ? 'referrer' : 'contributor';

  // if no contact provided, disable all contribution and referrer/contributor attributes
  // TODO: allow selection of NO referrer after one is selected
  if ($input.val() === '') {
    disableContributionAttrs(true, contactType);
    disableContactAttrs(true, contactType);

  // if creating a new contact with this success, enable contribution and referrer/contributor attributes
  } else if ($input.val() === '0') {
    disableContributionAttrs(false, contactType);
    disableContactAttrs(false, contactType);

  // if existing contact, disable referrer/contributor attributes
  } else {
    disableContributionAttrs(false, contactType);
    disableContactAttrs(true, contactType);

    // the referrer will be both contributor and referrer for this contribution
    $form.find(`[id*="${ contactType }_id"]`).val( $input.val() );
  }
}

function disableContributionAttrs(shouldDisable, contactType) {
  const index = (contactType === 'referrer') ? '0' : '1';
  const $attrById = (index, attribute) => (
    $form.find(`#success_contributions_attributes_${ index }_${ attribute }`)
  );
  [`${ contactType }_id`, 'invitation_template_id', 'success_contact']
    .forEach((attribute) => {

      // don't disable referrer_id or contributor_id since they're visible, instead blank the [name]
      if (attribute === `${ contactType }_id`) {
        if (shouldDisable) {
          $attrById(index, attribute).attr('name', '');
        } else {
          $attrById(index, attribute).attr(
            'name', 
            `success[contributions_attributes][${ index }][${ attribute }]`
          );
        }

      // success contact field only applies to the contributor
      } else if (contactType === 'contributor' && attribute === 'success_contact') {
        $attrById(1, 'success_contact').prop('disabled', shouldDisable);

      // all others disabled (or enabled)
      } else {
        $attrById(index, attribute).prop('disabled', shouldDisable);
      }
    });
}

function disableContactAttrs(shouldDisable, contactType) {
  const index = (contactType === 'referrer') ? '0' : '1';
  if (shouldDisable) {
    $form
      .find(`.create-${ contactType }`)
        .addClass('hidden')
        .end()
      // don't validate contact fields
      .find(`create-${ contactType } input:not([type="hidden"])`)
        .each((index, input) => $(input).prop('required', false));
  } else {
    $form
      .find(`.create-${ contactType }`)
        .removeClass('hidden')
        .end()
      // validate contact fields
      .find('.create-' + contactType + ' input:not([type="hidden"])')
        .each((index, input) => $(input).prop('required', true));
  }
  ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
    .forEach((attribute) => {
      $(`#success_contributions_attributes_${ index }_${ contactType }_attributes_${ attribute }`)
        .prop('disabled', shouldDisable);
    });
  if (!shouldDisable) {
    setTimeout(
      () => $form.find('.create-' + contactType + ' input[id*="first_name"]')[0]
                   .focus(),
      0
    );
  }
}

// function parseCsvData() (data) {
//   var successes = [], logSuccesses = [],
//       contributions = $('#prospect-contributors-table').DataTable().rows().data().toArray(),
//       // here a 'contributor' is either a referrer or contact
//       getUserId = function (email) {
//         // need to separately identify the matching user so we know which to reference below (contributor or referrer)
//         var contributorIndex = contributions.findIndex(function (contribution) {
//               return contribution.contributor.email === email;
//             }),
//             referrerIndex = contributions.findIndex(function (contribution) {
//               return contribution.referrer && contribution.referrer.email === email;
//             });
//         if (contributorIndex !== -1) {
//           return contributions[contributorIndex].contributor.id.toString();
//         } else if (referrerIndex !== -1 ) {
//           return contributions[referrerIndex].referrer.id.toString();
//         } else {
//           return '';
//         }
//       },
//       getInvitationTemplateId = function (templateName) {
//         if (!templateName) return null;
//         var template = CSP.company.invitation_templates.find(function (template) {
//           return template.name === templateName;
//         });
//         if (template) {
//           console.log('assigning invitation template:', template.name);
//         } else {
//           console.log('could not find template:', templateName);
//         }
//         return template ? template.id : null;
//       },
//       curatorIsValid = function (email) {
//         return CSP.company.curators.find(function (curator) { return curator.email === email; });
//       },
//       contactIsValid = function (contactType, email, firstName, lastName) {
//         console.log('adding ' + (contactType === 'referrer' ? 'referrer' : 'customer contact'));
//         if (getUserId(email)) {
//           console.log('user exists:', email);
//           return true;
//         } else if (firstName && lastName && email) {
//           console.log('new user:', email);
//           return true;
//         } else {
//           console.log('contact details missing, ' + contactType + ' ignored');
//           return false;
//         }
//       },
//       rowIsValid = function (row) {
//         if (!row.opportunityName) {
//           console.log('row is invalid: success name is missing');
//           return false;
//         } else if (!row.customerName) {
//           console.log('row is invalid: customer name is missing');
//           return false;
//         } else if (!curatorIsValid(row.curatorEmail)) {
//           console.log('row is invalid: curator email does not exist');
//           return false;
//         } else {
//           console.log('row is valid');
//           return true;
//         }
//       },
//       contributionsAttrs = function (contactType, invitationTemplateName, email, firstName, lastName, title, phone) {
//         var userId = getUserId(email),
//             attrs = {
//               success_contact: contactType === 'contributor' ? true : false,
//               invitation_template_id: getInvitationTemplateId(invitationTemplateName),
//             };

//         // existing user
//         if (userId) attrs[contactType + '_id'] = userId;

//         /**
//          * include invitation template attributes if a template name was passed
//          * but no such template exists
//          */
//         if (invitationTemplateName && !attrs.invitation_template_id) {
//           Object.assign(attrs, {
//             invitation_template_attributes: {
//               name: invitationTemplateName,
//               company_id: CSP.company.id
//             }
//           });
//           delete attrs.invitation_template_id;
//         }

//         // new user
//         if (!userId) {
//           attrs[contactType + '_attributes'] = {
//             first_name: firstName,
//             last_name: lastName,
//             title: title,
//             email: email,
//             phone: phone,
//             password: email,
//             sign_up_code: 'csp_beta'
//           };
//         }
//         return attrs;
//       },
//       parseRow = function (row) {
//         console.log('parsing row...');
//         var curator = CSP.company.curators.find(function (curator) {
//               return curator.email === row.curatorEmail;
//             }),
//             customer = CSP.company.customers.find(function (customer) {
//               return customer.name === row.customerName;
//             }),
//             success = {
//               name: row.opportunityName,
//               description: row.opportunityDescription,
//               curator_id: (curator && curator.id) || '',
//               customer_id: (customer && customer.id) || ''
//             },
//             referrerFirstName, referrerLastName, contactFirstName, contactLastName;

//         if (row.referrerFirstName && row.referrerLastName) {
//           referrerFirstName = row.referrerFirstName;
//           referrerLastName = row.referrerLastName;
//         } else if (row.referrerFullName) {
//           referrerFirstName = row.referrerFullName.split(' ').slice(0, str.split(' ').length - 1).join(' ');
//           referrerLastName = row.referrerFullName.split(' ').pop();
//         }
//         if (row.contactFirstName && row.contactLastName) {
//           contactFirstName = row.contactFirstName;
//           contactLastName = row.contactLastName;
//         } else if (row.contactFullName) {
//           contactFirstName = row.contactFullName &&
//             row.contactFullName.split(' ').slice(0, str.split(' ').length - 1).join(' ');
//           contactLastName = row.contactFullName &&
//             row.contactFullName.split(' ').pop();
//         }

//         // new customer
//         if (!success.customer_id) {
//           success.customer_attributes = {
//             name: row.customerName,
//             company_id: CSP.company.id
//           };
//         }

//         // referrer (if present)
//         if (contactIsValid('referrer', row.referrerEmail, referrerFirstName, referrerLastName)) {
//           success.contributions_attributes = success.contributions_attributes || [];
//           success.contributions_attributes.push(
//             contributionsAttrs(
//               'referrer', row.referrerInvitationTemplateName, row.referrerEmail, referrerFirstName, referrerLastName, row.referrerTitle, row.referrerPhone
//             )
//           );
//         }

//         // customer contact (if present)
//         if (contactIsValid('contributor', row.contactEmail, contactFirstName, contactLastName)) {
//           success.contributions_attributes = success.contributions_attributes || [];
//           success.contributions_attributes.push(
//             contributionsAttrs(
//               'contributor', row.contactInvitationTemplateName, row.contactEmail, contactFirstName, contactLastName, row.contactTitle, row.contactPhone
//             )
//           );
//         }
//         return success;
//       };

//   data.forEach(function (row, index) {
//     console.log('importing row', index + 2 + '...');
//     if (rowIsValid(row)) {
//       successes.push(Object.assign(parseRow(row), { status: 'valid' }));
//     } else {
//       successes.push({ status: "error" });
//     }
//   });
//   logSuccesses = successes.slice();  // deep copy
//   logSuccesses.unshift('ignore', 'ignore');
//   console.log(logSuccesses);
//   displayCsvStatus(successes);
//   importedSuccesses = successes;

// },

function readFile(file) {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (e) {
    const csv = e.target.result;
    const data = $.csv.toObjects(csv);
    console.log('csv data:');
    console.log(data);
    parseCsvData(data);
  };
  reader.onerror = function () { alert('Unable to read ' + file.fileName); };
}

// source: File API availability - http://caniuse.com/#feat=fileapi
// source: <output> availability - http://html5doctor.com/the-output-element/
function fileApiSupported() {
  return (
    window.File && window.FileReader && window.FileList && window.Blob
  );
}
