
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
      disableContributionAttrs = function (disabled, contactType) {
        var index = (contactType === 'referrer') ? '0' : '1';
        [contactType + '_id', 'crowdsourcing_template_id', 'success_contact']
          .forEach(function (attribute) {
            // don't disable referrer_id or contributor_id since they're visible, instead blank the [name]
            if (attribute === 'referrer_id' || attribute === 'contributor_id') {
              if (disabled) {
                $('#new-success-form #success_contributions_attributes_' + index + '_' + attribute)
                  .attr('name', '');
              } else {
                $('#new-success-form #success_contributions_attributes_' + index + '_' + attribute)
                  .attr('name', 'success[contributions_attributes][' + index + '][' + attribute + ']');
              }

            // success contact field only applies to the contributor
            } else if (attribute == 'success_contact') {
              $('#new-success-form #success_contributions_attributes_1_success_contact').prop('disabled', disabled);

            // all others disabled (or enabled)
            } else {
              $('#new-success-form #success_contributions_attributes_' + index + '_' + attribute).prop('disabled', disabled);
            }
          });
      },
      disableContactAttrs = function (disabled, contactType) {
        var $form = $('#new-success-form'), index = (contactType === 'referrer') ? '0' : '1';
        if (disabled) {
          $form.find('.create-' + contactType).addClass('hidden');

          // don't validate contact fields
          $form.find('.create-' + contactType + ' input:not([type="hidden"])').each(function () {
            $(this).prop('required', false);
          });
        } else {
          $form.find('.create-' + contactType).removeClass('hidden');

          // validate contact fields
          $form.find('.create-' + contactType + ' input:not([type="hidden"])').each(function () {
            $(this).prop('required', true);
          });
        }
        ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
          .forEach(function (attribute) {
            $('#success_contributions_attributes_' + index + '_' + contactType + '_attributes_' + attribute)
              .prop('disabled', disabled);
        });
        if (!disabled) {
          setTimeout(function () {
            $form.find('.create-' + contactType + ' input[id*="first_name"]')[0].focus();
          }, 0);
        }
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
            curatorIsValid = function (email) {
              return app.company.curators.find(function (curator) { return curator.email === email; });
            },
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
              var template = app.company.crowdsourcing_templates.find(function (template) {
                return template.name === templateName;
              });
              if (template) {
                console.log('assigning invitation template:', template.name);
              } else {
                console.log('could not find template:', templateName);
              }
              return template ? template.id : null;
            },
            contactStatus = function (contributorType, email, firstName, lastName) {
              if (getUserId(email)) {
                console.log('User exists:', email);
              } else if (firstName && lastName && email) {
                console.log('new User:', email);
              } else {
                console.log('contact details missing, ' + contributorType + ' ignored');
              }
            },
            rowIsValid = function (row) {
              if (!row.opportunityName) {
                console.log('Row is invalid: success name is missing');
                return false;
              } else if (!row.customerName) {
                console.log('Row is invalid: customer name is missing');
                return false;
              } else if (!curatorIsValid(row.curatorEmail)) {
                console.log('row is invalid: curator email does not exist');
                return false;
              } else {
                return true;
              }
            },
            customerAttrs = function (customerName) {
              var customer = app.company.customers.find(function (customer) {
                    return customer.name === customerName;
                  });
              return {
                id: customer ? customer.id : '',
                name: customerName,
                company_id: app.company.id,
              };
            },
            contributionsAttrs = function (contributorType, invitationTemplateName, email, firstName, lastName, title) {
              var user = { id: getUserId(email) },
                  attrs = {
                    crowdsourcing_template_id: getInvitationTemplateId(invitationTemplateName),
                    success_contact: contributorType === 'contributor' ? true : false
                  };
              if (user.id) {
                Object.assign(
                    user,
                    (contributions.find(function (c) { return c.contributor.id == user.id; }) &&
                    contributions.find(function (c) { return c.contributor.id == user.id; }).contributor) ||
                    (contributions.find(function (c) { return c.referrer.id == user.id; }) &&
                    contributions.find(function (c) { return c.referrer.id == user.id; }).referrer)
                  );
                delete user.full_name;
              }

              // create a new user (contributor or referrer)
              attrs[contributorType + '_attributes'] = {};
              attrs[contributorType + '_attributes'].id = user.id;
              attrs[contributorType + '_attributes'].email = user.email || email;
              attrs[contributorType + '_attributes'].first_name = user.first_name || firstName;
              attrs[contributorType + '_attributes'].last_name = user.last_name || lastName;
              attrs[contributorType + '_attributes'].title = user.title || title;

              // TODO: differing keys call for batched imports
              // keep these attributes separate to avoid overwriting passwords
              if (!user.id) {
                attrs[contributorType + '_attributes'].password = email;
                attrs[contributorType + '_attributes'].sign_up_code = 'csp_beta';
              }
              return attrs;
            },
            parseRow = function (row) {
              console.log('parsing row...');
              var curator = app.company.curators.find(function (curator) {
                    return curator.email === row.curatorEmail;
                  }),
                  success = {
                    name: row.opportunityName,
                    description: row.opportunityDescription,
                    curator_id: (curator && curator.id) || '',
                    customer_attributes: {},
                    contributions_attributes: []
                  };
              Object.assign(success.customer_attributes, customerAttrs(row.customerName));
              console.log('adding referrer (contributor #1)');
              contactStatus('referrer', row.referrerEmail, row.referrerFirstName, row.referrerLastName);
              success.contributions_attributes.push(
                contributionsAttrs('referrer', row.invitationTemplateNameReferrer, row.referrerEmail, row.referrerFirstName, row.referrerLastName, row.referrerTitle)
              );
              console.log('adding contact (contributor #2): ', row.contactEmail);
              contactStatus('contributor', row.contactEmail, row.contactFirstName, row.contactLastName);
              success.contributions_attributes.push(
                contributionsAttrs('contributor', row.invitationTemplateNameContact, row.contactEmail, row.contactFirstName, row.contactLastName, row.contactTitle)
              );
              return success;
            };
        data.forEach(function (row, index) {
          console.log('importing row', index + 2 + '...');
          if (rowIsValid(row)) {
            console.log('row is valid');
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

    .on('show.bs.modal', '#new-success-modal', function () {
      var curatorId = $('#successes-table').closest('[id*="table_wrapper"]').find('.curator-select').val();
      if ($('#successes-filter').val().match(/customer/)) {
        $('select.new-success.customer')
          .val($('#successes-filter').val().match(/customer-(\d+)/)[1])
          .trigger('change.select2');
      }
      if (curatorId !== '0') {
        $('select.new-success.curator')
          .val($('.crowdsource.curator-select').val())
          .trigger('change');
      }
    })

    .on('change', '#new-success-form [name="source"]', function () {
      $('.form-group.csv-file, #new-success-form .form-group:not(.source)').toggle();
      if ($(this).val() === 'import') {
        $('#new-success-form .form-group').removeClass('has-error');
        $('button[type="submit"][form="new-success-form"] span').text('Import CSV');
      } else {
        $('#new-success-form').find('.fileinput').fileinput('clear');
        $('#new-success-form').find('.fileinput-filename').addClass('placeholder').text('Upload');
        $('#new-success-form .form-group.csv-file')
          .removeClass('has-error has-warning has-success')
          .find('.help-block').text('');
        $('button[type="submit"][form="new-success-form"')
          .prop('disabled', false)
          .find('span').text('Create Win');
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

    .on('change', 'select.new-success.customer', function () {
      var $form = $('#new-success-form');
      customerVal = $(this).val();
      customerId = isNaN(customerVal) ? null : customerVal;

      // update hidden customer_id
      $form.find('#success_customer_id').val(customerId);

      if (customerId) {
        // turn off customer attributes
        $form.find('input[id*="customer_attributes"]').each(function () {
            $(this).prop('disabled', true);
          });
      } else {
        // update and enable customer attributes
        $form.find('input[id*="customer_attributes_id"]').val('');
        $form.find('input[id*="customer_attributes_name"]').val(customerVal);
        $form.find('input[id*="customer_attributes"]').prop('disabled', false);
      }
    })

    .on('change', 'select.new-success.referrer, select.new-success.contributor', function () {
      var $form = $('#new-success-form'),
          contactType = $(this).hasClass('referrer') ? 'referrer' : 'contributor';

      // if no contact provided, disable all contribution and referrer/contributor attributes
      // TODO: allow selection of NO referrer after one is selected
      if ($(this).val() === '') {
        disableContributionAttrs(true, contactType);
        disableContactAttrs(true, contactType);

      // if creating a new contact with this success, enable contribution and referrer/contributor attributes
      } else if ($(this).val() === '0') {
        disableContributionAttrs(false, contactType);
        disableContactAttrs(false, contactType);

      // if existing contact, disable referrer/contributor attributes
      } else {
        disableContributionAttrs(false, contactType);
        disableContactAttrs(true, contactType);
        // the referrer will be both contributor and referrer for this contribution
        $form.find('[id*="' + contactType + '_id"]').val($(this).val());
      }
    })

    // select2 hack for search placeholder
    .on("select2:open", "select.new-success", function() {
      var placeholder;
      if ($(this).hasClass('customer')) {
        placeholder = "Search or enter the name of a New Customer";
      } else if ($(this).hasClass('curator')) {
        placeholder = 'Search';
      } else if ($(this).hasClass('referrer') || $(this).hasClass('contributor')) {
        placeholder = 'Search or Create New Contact';
      }
      $(".select2-search--dropdown .select2-search__field").attr("placeholder", placeholder);
    })
    .on("select2:close","select.new-success", function() {
      $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
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
      disableContributionAttrs(true, 'referrer');
      disableContactAttrs(true, 'referrer');
      disableContributionAttrs(true, 'contributor');
      disableContactAttrs(true, 'contributor');
      $(this).find('.create-contact').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      $(this).find('.form-group').removeClass('has-error');
      $(this).find('.create-contact input').prop('required', false);
      $('button[form="new-success-form"]').attr('type', 'submit');
      $('button[form="new-success-form"] span').text('Create Win').css('display', 'inline').prop('disabled', false);
      $('button[form="new-success-form"] i').css('display', 'none');
    })

    // need to listen for the click on the submit button instead of 'submit' on 'new-success-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-success-form"]', function (e) {
      var $button = $(this), $form = $('#new-success-form'), source = $form.find('[name="source"]:checked').val();
      e.preventDefault();
      if (!$form.data('submitted') && importFileIsValid(source, importedSuccesses)) {
        toggleFormWorking($form);
        $.ajax({
          url: '/companies/' + app.company.id + '/successes',
          method: 'post',
          data: {
            imported_successes: importedSuccesses
                                  .filter(function (success) { return success.status === 'valid'; })
                                  .map(function (success) { delete success.status; return success; })
          },
          dataType: 'script'
        });

      } else if (!$form.data('submitted') && validateForm()) {

        // if a referrer wasn't selected, hide the contribution attributes so a contribution isn't created
        if ($('select.new-success.referrer').val() === '') disableContributionAttrs(true, 'referrer');
        if ($('select.new-success.contributor').val() === '') disableContributionAttrs(true, 'contributor');
        toggleFormWorking($form);
        $form.submit();
      } else {

      }

    })

    .on('click', 'button[type="button"][form="new-success-form"]', function () {
      $('#new-success-modal').modal('hide');
    })

    .on('submit', '#new-success-form', function () {
      console.log( $(this).serializeArray() );
    });
}








