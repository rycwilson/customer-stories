
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
      disableContributionAttrs = function (disabled) {
        ['referrer_id', 'crowdsourcing_template_id']
          .forEach(function (attribute) {
            // don't disable referrer_id since it's visible, instead blank the [name]
            if (attribute === 'referrer_id') {
              if (disabled) {
                $('#new-success-form #success_contributions_attributes_0_referrer_id').attr('name', '');
              } else {
                $('#new-success-form #success_contributions_attributes_0_referrer_id').attr('name',
                  'success[contributions_attributes][0][referrer_id]');
              }
            // all others disabled
            } else {
              $('#new-success-form #success_contributions_attributes_0_' + attribute).prop('disabled', disabled);
            }
          });
      },
      disableReferrerAttrs = function (disabled) {
        var $form = $('#new-success-form');
        if (disabled) {
          $form.find('.create-referrer').addClass('hidden');

          // don't validate referrer fields
          $form.find('.create-referrer input:not([type="hidden"])').each(function () {
            $(this).prop('required', false);
          });
        } else {
          $form.find('.create-referrer').removeClass('hidden');

          // validate referrer fields
          $form.find('.create-referrer input:not([type="hidden"])').each(function () {
            $(this).prop('required', true);
          });
        }
        ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
          .forEach(function (attribute) {
            $('#success_contributions_attributes_0_referrer_attributes_' + attribute)
              .prop('disabled', disabled);
        });
        if (!disabled) {
          setTimeout(function () {
            $form.find('.create-referrer input[id*="first_name"]')[0].focus();
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
        var numRecords = successes.length,
            numErrors = successes.filter(function (success) { return success.status === 'error'; }).length;
        if (numErrors === numRecords) {
          $('.form-group.csv-file')
            .addClass('has-error')
            .find('.help-block').text(successes.length + ' errors');
        } else if (numErrors > 0) {
          $('.form-group.csv-file')
            .addClass('has-warning')
            .find('.help-block').text((numRecords - numErrors) + ' ok, ' + numErrors + ' error(s)');
        } else {
          $('.form-group.csv-file').addClass('has-success').find('.help-block').text('');
        }
      },

      parseCsvData = function (data) {
        var successes = [],
            curatorIsValid = function (email) {
              if (app.company.curators.findIndex(function (curator) { return curator.email === email; }) === -1) {
                return false;
              } else {
                return true;
              }
            },
            // here a 'contributor' is either a
            getContributorId = function (email) {
              var contributions = $('#prospect-contributors-table').DataTable().rows().data().toArray(),
                  contributorIndex = contributions.findIndex(function (contribution) {
                    return contribution.contributor.email === email;
                  });
              return (contributorIndex !== -1) ? contributions[contributorIndex].contributor.id.toString() : '';
            },
            contactIsValid = function (firstName, lastName, email) {
              console.log(getContributorId(email) || (firstName && lastName && email) || false)
              return getContributorId(email) || (firstName && lastName && email) || false;
            },
            rowIsValid = function (row) {
              return row.opportunityName !== '' && row.customerName !== '' && curatorIsValid(row.curatorEmail);
            },
            customerAttrs = function (customerName) {
              var customerIndex = app.company.customers.findIndex(function (customer) {
                return customer.name === customerName;
              });
              if (customerIndex === -1) {
                return { customer_attributes: { name: customerName, company_id: app.company.id } };
              } else {
                return { customer_id: app.company.customers[customerIndex].id };
              }
            },
            contributionAttrs = function (index, contributorType, email, firstName, lastName) {
              var attrs = {}, referrerId = contributorId = getContributorId(email);
              attrs[index] = {};

              // assign the id, whether integer or ''
              if (contributorType === 'referrer') {
                attrs[index].referrer_id = referrerId || '0';
              } else {
                attrs[index].contributor_id = contributorId || '0';
              }

              // create a new user (contributor or referrer)
              if (!(referrerId || contributorId)) {
                attrs[index][contributorType + '_attributes'] = {};
                attrs[index][contributorType + '_attributes'].email = email;
                attrs[index][contributorType + '_attributes'].first_name = firstName;
                attrs[index][contributorType + '_attributes'].last_name = lastName;
                attrs[index][contributorType + '_attributes'].password = email;
                attrs[index][contributorType + '_attributes'].sign_up_code = 'csp_beta';
              }
              return attrs;
            },
            parseRow = function (row) {
              var success = {},
                  curator = app.company.curators.find(function (curator) {
                    return curator.email === row.curatorEmail;
                  }),
                  referrerIsPresent = function () {
                    return contactIsValid(row.referrerFirstName, row.referrerLastName, row.referrerEmail);
                  };
              success.name = row.opportunityName;
              success.curator_id = curator.id || '';
              Object.assign(success, customerAttrs(row.customerName));
              if (referrerIsPresent()) {
                success.contributions_attributes = {};
                Object.assign(
                  success.contributions_attributes,
                  contributionAttrs('0', 'referrer', row.referrerEmail, row.referrerFirstName, row.referrerLastName)
                );
              }
              if (contactIsValid(row.contactFirstName, row.contactLastName, row.contactEmail)) {
                success.contributions_attributes = success.contributions_attributes || {};
                Object.assign(
                  success.contributions_attributes,
                  contributionAttrs(referrerIsPresent() ? '1' : '0', 'contributor', row.contactEmail, row.contactFirstName, row.contactLastName));
              }
              return Object.assign(success, { status: "valid" });
            };
        data.forEach(function (row) {
          if (rowIsValid(row)) {
            successes.push(parseRow(row));
          } else {
            successes.push({ status: "error" });
          }
        });
        console.log(successes);
        displayCsvStatus(successes);
        importedSuccesses = successes;
      },

      readFile = function (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
          var csv = e.target.result, data = $.csv.toObjects(csv);
          // console.log(data);
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
      $('.form-group.csv-file, .form-group:not(.source)').toggle();
      if ($(this).val() === 'import') {
        $('#new-success-form .form-group').removeClass('has-error');
        $('button[type="submit"][form="new-success-form"] span').text('Import CSV File');
      } else {
        $('#new-success-form').find('.fileinput').fileinput('clear');
        $('#new-success-form').find('.fileinput-filename').addClass('placeholder').text('Upload');
        $('#new-success-form .form-group.csv-file')
          .removeClass('has-error has-warning has-success')
          .find('.help-block').text('');
        $('button[type="submit"][form="new-success-form"] span').text('Create Customer Win');
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

    .on('change', 'select.new-success.referrer', function () {
      var $form = $('#new-success-form');

      // if no referrer provided, disable all contribution and referrer attributes
      // TODO: allow selection of NO referrer after one is selected
      if ($(this).val() === '') {
        disableContributionAttrs(true);
        disableReferrerAttrs(true);

      // if creating a new referrer with this success, enable contribution and referrer attributes
      } else if ($(this).val() === '0') {
        disableContributionAttrs(false);
        disableReferrerAttrs(false);

      // if existing referrer, disable contributor attributes
      } else {
        disableContributionAttrs(false);
        disableReferrerAttrs(true);
        // the referrer will be both contributor and referrer for this contribution
        $form.find('[id*="referrer_id"]').val($(this).val());
      }
    })

    // select2 hack for search placeholder
    .on("select2:open", "select.new-success", function() {
      var placeholder;
      if ($(this).hasClass('customer')) {
        placeholder = "Search or enter the name of a New Customer";
      } else if ($(this).hasClass('curator')) {
        placeholder = 'Search';
      } else if ($(this).hasClass('referrer')) {
        placeholder = 'Search or Create New Contact';
      }
      $(".select2-search--dropdown .select2-search__field").attr("placeholder", placeholder);
    })
    .on("select2:close","select.new-success", function() {
      $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
    })

    .on('change', '#new-success-form input[id*="email"]', function () {
      var $form = $('#new-contributor-form');
      $(this).closest('.create-referrer')
             .find('input[id*="password"]').val( $(this).val() );
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
      $(this).find('form')[0].reset();
      disableContributionAttrs(true);
      disableReferrerAttrs(true);
      $(this).find('.create-referrer').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      $(this).find('.form-group').removeClass('has-error');
      $(this).find('.create-referrer input').prop('required', false);
      $('button[type="submit"][form="new-success-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-success-form"] i').css('display', 'none');
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
            imported_successes: importedSuccesses.filter(function (success) { return success.status === 'valid'; })
          },
          dataType: 'script'
        });

      } else if (!$form.data('submitted') && validateForm()) {
        // if a referrer wasn't selected, hide the contribution attributes so a contribution isn't created
        if ($('select.new-success.referrer').val() === '') disableContributionAttrs(true);
        toggleFormWorking($form);
        $form.submit();
      } else {

      }

    })

    .on('submit', '#new-success-form', function () {
      console.log( $(this).serializeArray() );
    });
}








