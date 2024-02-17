
function newSuccessListeners () {

  var importedSuccesses = [];

  // ref: https://stackoverflow.com/questions/8597595
  var validateForm = function () {
        var $form = $('#new-success-form'), formIsValid = true;
        $form.find('select[required], input[required]').each(function (index, input) {
          if (!input.checkValidity()) formIsValid = false;
        });
        return formIsValid;
      },
     
      isAPIAvailable = function () {
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
          // Great success! All the File APIs are supported.
          return true;
        } else {
          // source: File API availability - http://caniuse.com/#feat=fileapi
          // source: <output> availability - http://html5doctor.com/the-output-element/
          // document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
          // // 6.0 File API & 13.0 <output>
          // document.writeln(' - Google Chrome: 13.0 or later<br />');
          // // 3.6 File API & 6.0 <output>
          // document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
          // // 10.0 File API & 10.0 <output>
          // document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
          // // ? File API & 5.1 <output>
          // document.writeln(' - Safari: Not supported<br />');
          // // ? File API & 9.2 <output>
          // document.writeln(' - Opera: Not supported');
          return false;
        }
      },
      importFileIsValid = function (source, importedSuccesses) {
        return source === 'import' && importedSuccesses.some(function (success) { return success.status === 'valid'; });
      },
      displayCsvStatus = function (successes) {
        var numValid = successes.filter(function (success) { return success.status === 'valid'; }).length,
            numInvalid = successes.length - numValid,
            status = function (numValid, numInvalid) {
              return numValid + ' ok, ' + numInvalid + ' errors';
            },
            disableForm = function (disable) {
              $('button[form="new-success-form"]').prop('disabled', disable);
            };
        if (numValid === 0) {
          $('.form-group.csv-file').addClass('has-error');
          disableForm(true);
        } else if (numValid < successes.length) {
          $('.form-group.csv-file').addClass('has-warning');
          disableForm(false);
        } else {
          $('.form-group.csv-file').addClass('has-success');
          disableForm(false);
        }
        $('.form-group.csv-file').find('.help-block').text(status(numValid, numInvalid));
      },

      parseCsvData = function (data) {
        var successes = [], logSuccesses = [],
            contributions = $('#prospect-contributors-table').DataTable().rows().data().toArray(),
            // here a 'contributor' is either a referrer or contact
            getUserId = function (email) {
              // need to separately identify the matching user so we know which to reference below (contributor or referrer)
              var contributorIndex = contributions.findIndex(function (contribution) {
                    return contribution.contributor.email === email;
                  }),
                  referrerIndex = contributions.findIndex(function (contribution) {
                    return contribution.referrer && contribution.referrer.email === email;
                  });
              if (contributorIndex !== -1) {
                return contributions[contributorIndex].contributor.id.toString();
              } else if (referrerIndex !== -1 ) {
                return contributions[referrerIndex].referrer.id.toString();
              } else {
                return '';
              }
            },
            getInvitationTemplateId = function (templateName) {
              if (!templateName) return null;
              var template = CSP.company.invitation_templates.find(function (template) {
                return template.name === templateName;
              });
              if (template) {
                console.log('assigning invitation template:', template.name);
              } else {
                console.log('could not find template:', templateName);
              }
              return template ? template.id : null;
            },
            curatorIsValid = function (email) {
              return CSP.company.curators.find(function (curator) { return curator.email === email; });
            },
            contactIsValid = function (contactType, email, firstName, lastName) {
              console.log('adding ' + (contactType === 'referrer' ? 'referrer' : 'customer contact'));
              if (getUserId(email)) {
                console.log('user exists:', email);
                return true;
              } else if (firstName && lastName && email) {
                console.log('new user:', email);
                return true;
              } else {
                console.log('contact details missing, ' + contactType + ' ignored');
                return false;
              }
            },
            rowIsValid = function (row) {
              if (!row.opportunityName) {
                console.log('row is invalid: success name is missing');
                return false;
              } else if (!row.customerName) {
                console.log('row is invalid: customer name is missing');
                return false;
              } else if (!curatorIsValid(row.curatorEmail)) {
                console.log('row is invalid: curator email does not exist');
                return false;
              } else {
                console.log('row is valid');
                return true;
              }
            },
            contributionsAttrs = function (contactType, invitationTemplateName, email, firstName, lastName, title, phone) {
              var userId = getUserId(email),
                  attrs = {
                    success_contact: contactType === 'contributor' ? true : false,
                    invitation_template_id: getInvitationTemplateId(invitationTemplateName),
                  };

              // existing user
              if (userId) attrs[contactType + '_id'] = userId;

              /**
               * include invitation template attributes if a template name was passed
               * but no such template exists
               */
              if (invitationTemplateName && !attrs.invitation_template_id) {
                Object.assign(attrs, {
                  invitation_template_attributes: {
                    name: invitationTemplateName,
                    company_id: CSP.company.id
                  }
                });
                delete attrs.invitation_template_id;
              }

              // new user
              if (!userId) {
                attrs[contactType + '_attributes'] = {
                  first_name: firstName,
                  last_name: lastName,
                  title: title,
                  email: email,
                  phone: phone,
                  password: email,
                  sign_up_code: 'csp_beta'
                };
              }
              return attrs;
            },
            parseRow = function (row) {
              console.log('parsing row...');
              var curator = CSP.company.curators.find(function (curator) {
                    return curator.email === row.curatorEmail;
                  }),
                  customer = CSP.company.customers.find(function (customer) {
                    return customer.name === row.customerName;
                  }),
                  success = {
                    name: row.opportunityName,
                    description: row.opportunityDescription,
                    curator_id: (curator && curator.id) || '',
                    customer_id: (customer && customer.id) || ''
                  },
                  referrerFirstName, referrerLastName, contactFirstName, contactLastName;

              if (row.referrerFirstName && row.referrerLastName) {
                referrerFirstName = row.referrerFirstName;
                referrerLastName = row.referrerLastName;
              } else if (row.referrerFullName) {
                referrerFirstName = row.referrerFullName.split(' ').slice(0, str.split(' ').length - 1).join(' ');
                referrerLastName = row.referrerFullName.split(' ').pop();
              }
              if (row.contactFirstName && row.contactLastName) {
                contactFirstName = row.contactFirstName;
                contactLastName = row.contactLastName;
              } else if (row.contactFullName) {
                contactFirstName = row.contactFullName &&
                  row.contactFullName.split(' ').slice(0, str.split(' ').length - 1).join(' ');
                contactLastName = row.contactFullName &&
                  row.contactFullName.split(' ').pop();
              }

              // new customer
              if (!success.customer_id) {
                success.customer_attributes = {
                  name: row.customerName,
                  company_id: CSP.company.id
                };
              }

              // referrer (if present)
              if (contactIsValid('referrer', row.referrerEmail, referrerFirstName, referrerLastName)) {
                success.contributions_attributes = success.contributions_attributes || [];
                success.contributions_attributes.push(
                  contributionsAttrs(
                    'referrer', row.referrerInvitationTemplateName, row.referrerEmail, referrerFirstName, referrerLastName, row.referrerTitle, row.referrerPhone
                  )
                );
              }

              // customer contact (if present)
              if (contactIsValid('contributor', row.contactEmail, contactFirstName, contactLastName)) {
                success.contributions_attributes = success.contributions_attributes || [];
                success.contributions_attributes.push(
                  contributionsAttrs(
                    'contributor', row.contactInvitationTemplateName, row.contactEmail, contactFirstName, contactLastName, row.contactTitle, row.contactPhone
                  )
                );
              }
              return success;
            };

        data.forEach(function (row, index) {
          console.log('importing row', index + 2 + '...');
          if (rowIsValid(row)) {
            successes.push(Object.assign(parseRow(row), { status: 'valid' }));
          } else {
            successes.push({ status: "error" });
          }
        });
        logSuccesses = successes.slice();  // deep copy
        logSuccesses.unshift('ignore', 'ignore');
        console.log(logSuccesses);
        displayCsvStatus(successes);
        importedSuccesses = successes;

      },

      readFile = function (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
          var csv = e.target.result, data = $.csv.toObjects(csv);
          console.log('csv data:');
          console.log(data);
          parseCsvData(data);
        };
        reader.onerror = function () { alert('Unable to read ' + file.fileName); };
      },
      // ref https://stackoverflow.com/questions/30223361
      handleFileSelect = function (e) {
        var files = $(e.target).find('input[type="file"]')[0].files, // FileList object
            file = files[0];

        $(e.target).find('.fileinput-filename').removeClass('placeholder');
        // read the file metadata
        // var output = ''
        //     output += '<span style="font-weight:bold;">' + escape(file.name) + '</span><br />\n';
        //     output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
        //     output += ' - FileSize: ' + file.size + ' bytes<br />\n';
        //     output += ' - LastModified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';
        // read the file contents
        readFile(file);
      };

  $(document)

    .on('change', '#new-success-form [name="source"]', function () {
      $('.form-group.csv-file, #new-success-form .form-group:not(.source)').toggle();
      if ($(this).val() === 'import') {
        $('#new-success-form .form-group').removeClass('has-error');
        $('button[type="submit"][form="new-success-form"] span').text('Import');
      } else {
        $('#new-success-form').find('.fileinput').fileinput('clear');
        $('#new-success-form').find('.fileinput-filename').addClass('placeholder').text('Upload');
        $('#new-success-form .form-group.csv-file')
          .removeClass('has-error has-warning has-success')
          .find('.help-block').text('');
        $('button[type="submit"][form="new-success-form"')
          .prop('disabled', false)
          .find('span').text('Create');
      }
    })

    .on('change.bs.fileinput', '#new-success-form .fileinput', handleFileSelect)

    .on('clear.bs.fileinput', '#new-success-form .fileinput', function () {
      $(this).find('.fileinput-filename').addClass('placeholder');
    })

    // make sure the input is click when its span wrapper is clicked
    .on('click', '#new-success-form .form-group.csv-file .btn-file', function (e) {
      if ($(e.target).is('.btn-file')) {
        $(this).find('label[for="csv-file-input"]')[0].click();
      }
    })

    .on('change', '#new-success-form input[id*="email"]', function () {
      $(this).closest('.create-contact').find('input[id*="password"]').val( $(this).val() );
    })

    // reset modal
    .on('hide.bs.modal', '#new-success-modal', function () {
      // actions don't work once the modal is hidden, so use a timeout...
      setTimeout(function () {
        $(this).find('.fileinput').fileinput('clear');
        $('#source_create').trigger('click');
      }, 200);
    })
    .on('hidden.bs.modal', '#new-success-modal', function () {
      $('#new-success-form').show();
      $(this).find('.new-records').hide();
      $(this).find('form')[0].reset();
      $(this).find('.create-contact').addClass('hidden');
      $(this).find('select').val(null).trigger('change');
      $(this).find('.form-group').removeClass('has-error');
      $(this).find('.create-contact input').prop('required', false);
      $('button[form="new-success-form"]').attr('type', 'submit');
      $('button[form="new-success-form"] span').text('Create').css('display', 'inline').prop('disabled', false);
      $('button[form="new-success-form"] i').css('display', 'none');
    })

    // need to listen for the click on the submit button instead of 'submit' on 'new-success-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-success-form"]', function (e) {
      var $button = $(this),
          $form = $('#new-success-form'),
          source = $form.find('[name="source"]:checked').val();
      e.preventDefault();
      if (!$form.data('submitted') && importFileIsValid(source, importedSuccesses)) {
        toggleFormWorking($form);
        $.ajax({
          url: '/companies/' + CSP.company.id + '/successes/import',
          method: 'post',
          data: {
            imported_successes: importedSuccesses
                                  .filter(function (success) { return success.status === 'valid'; })
                                  .map(function (success) { delete success.status; return success; })
          },
          dataType: 'script'
        });

      } else if (!$form.data('submitted') && validateForm()) {
        toggleFormWorking($form);
        $form.submit();
      } else {

      }

    })

    .on('click', 'button[type="button"][form="new-success-form"]', function () {
      $('#new-success-modal').modal('hide');
    })

    .on('submit', '#new-success-form', function () {
      // console.log( $(this).serializeArray() );
    });
}

