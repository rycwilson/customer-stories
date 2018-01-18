
function newSuccessListeners () {

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
          console.log('browser does not support csv import')
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
      printTable = function (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
          var csv = e.target.result;
          var data = $.csv.toArrays(csv);
          // var html = '';
          // for(var row in data) {
          //   html += '<tr>\r\n';
          //   for(var item in data[row]) {
          //     html += '<td>' + data[row][item] + '</td>\r\n';
          //   }
          //   html += '</tr>\r\n';
          // }
          // $('#contents').html(html);
          console.log(data)
        };
        reader.onerror = function() { alert('Unable to read ' + file.fileName); };
      },
      // ref https://stackoverflow.com/questions/30223361
      handleFileSelect = function (e) {
        console.log('handleFileSelect()');
        var files = $(e.target).find('input[type="file"]')[0].files; // FileList object
        var file = files[0];
        // read the file metadata
        // var output = ''
        //     output += '<span style="font-weight:bold;">' + escape(file.name) + '</span><br />\n';
        //     output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
        //     output += ' - FileSize: ' + file.size + ' bytes<br />\n';
        //     output += ' - LastModified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';

        // read the file contents
        printTable(file);
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


    // need to listen for the click on the submit button instead of 'submit' on 'new-success-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-success-form"]', function (e) {
      var $form = $('#new-success-form'), $button = $(this);
      e.preventDefault();
      if (!$form.data('submitted') && validateForm()) {
        // if a referrer wasn't selected, hide the contribution attributes so a contribution isn't created
        if ($('select.new-success.referrer').val() === '') disableContributionAttrs(true);
        toggleFormWorking($form);
        $form.submit();
      } else {

      }
    })

    .on('change', '#new-success-form [name="source"]', function () {
      $('#csv-file-container').toggle();
      if ($(this).val() === 'import') {
        // $('#csv-file-input').prop('disabled', false);
        $('#new-success-form .form-group:not(.source)').addClass('disabled');
        $('button[type="submit"][form="new-success-form"] span').text('Import CSV File');
      } else {
        // $('#csv-file-container').collapse('hide');
        // $('#csv-file-input').prop('disabled', true);
        $('#new-success-form .form-group:not(.source)').removeClass('disabled');
        $('button[type="submit"][form="new-success-form"] span').text('Create Customer Win');
      }
    })

    .on('change.bs.fileinput', '#csv-file-container .fileinput', handleFileSelect)

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
    });

    // .on('submit', '#new-success-form', function () {
    //   console.log( $(this).serializeArray() );
    // });
}








