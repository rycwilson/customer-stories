
function newContributorListeners() {

  var isCurateView = function () {
        return $('#workflow-tabs li.active a').attr('href') === '#curate';
      },
      noCustomerContributors = function () {
        // length of 2 accounts for empty option and - Create New Contributor -
        return $('select.new-contributor.contributor').find('option').length === 2;
      },
      // returns true if all contributor options are disabled
      noAvailableContributors = function () {
        return $('select.new-contributor.contributor').find('option').toArray()
          .slice(2, $('select.new-contributor.contributor').find('option').length)
          .every(function (option) {
            return option.disabled;
          });
      },
      // ref: https://stackoverflow.com/questions/8597595
      validateForm = function () {
        var $form = $('#new-contributor-form'), formIsValid = true;
        $form.find('select[required], input[required]').each(function (index, input) {
          if (!input.checkValidity()) formIsValid = false;
        });
        return formIsValid;
      },
      preSelectCustomerAndSuccess = function (customerId, successId) {
        $('select.new-contributor.customer').val(customerId).trigger('change');
        $('select.new-contributor.success').val(successId).trigger('change');
        if (isCurateView()) {
          $('select.new-contributor.customer, select.new-contributor.success')
            .prop('disabled', true);
        }
      },
      updateSuccessOptions = function (customerId) {
        var customerSuccesses,
            successOptionsData = [{ id: '', text: '' }]; // default options data
        if (customerId) {
          customerSuccesses = $('#successes-table').DataTable().rows().data().toArray()
            .filter(function (success) {
              return success.customer.id == customerId;
            });
          successOptionsData = customerSuccesses
            .map(function (success) {
              return { id: success.id, text: success.name };
            });
          successOptionsData.unshift({ id: '', text: '' });
        }
        // ref: https://github.com/select2/select2/issues/2830#issuecomment-229710429
        $('select.new-contributor.success').select2('destroy').empty()
          .select2({
            theme: "bootstrap",
            tags: true,
            selectOnClose: true,
            placeholder: 'Select or Create',
            data: successOptionsData
          });
          // .prop('disabled', false);
      },
      disableExistingContributors = function (successId) {
        var successContributorIds = $('#prospect-contributors-table').DataTable()
              .rows().data().toArray().filter(function (contribution) {
                return contribution.success.id == successId;
              })
              .map(function (contribution) {
                return contribution.contributor.id.toString();
              });

        // disable any contributors already added to this success
        $('select.new-contributor.contributor').find('option')
          .each(function () {
            var $option = $(this);
            if (successContributorIds.includes($option.val())) {
              $option.prop('disabled', true);
            }
          });

        // reset the options now that some are disabled
        $('select.new-contributor.contributor').select2('destroy')
          .select2({
            theme: "bootstrap",
            placeholder: 'Select or Create'
          });
      },
      disableReferrerAttrs = function (disabled) {
        var $form = $('#new-contributor-form');
        if (disabled) {
          $form.find('.create-referrer').addClass('hidden');

          // don't validate referrer fields
          $form.find('.create-referrer input:not([type="hidden"])').each(function () {
            $(this).prop('required', false);
          });
        } else {
          $form.find('.create-referrer').removeClass('hidden');

          // validate referrer fields
          $form.find('.create-referrer input:not([type="hidden"])')
            .each(function () {
              $(this).prop('required', true);
            });
        }
        ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
          .forEach(function (attribute) {
            $('#new-contributor-form [id*="referrer_attributes_' + attribute + '"]')
              .prop('disabled', disabled);
          });
        if (!disabled) {
          setTimeout(function () {
            $form.find('.create-referrer input[id*="first_name"]')[0].focus();
          }, 0);
        }
      },
      tagSuggestedContributors = function (customerId) {
        var companyContributions = $('#prospect-contributors-table').DataTable().rows().data().toArray(),
            customerSuccessContributions = companyContributions.filter(function (contribution) {
                return contribution.crowdsourcing_template &&
                       contribution.crowdsourcing_template.name === 'Customer Success';
              }),
            salesContributions = companyContributions.filter(function (contribution) {
                return contribution.crowdsourcing_template &&
                       contribution.crowdsourcing_template.name === 'Sales';
              }),
            customerContributions = companyContributions.filter(function (contribution) {
                return contribution.success.customer_id == customerId;
              }),
            suggestedContributorIds = _.uniq(
                customerContributions, false,
                function (contribution, index) { return contribution.contributor.id; }
              )
              .concat(
                _.uniq(
                  customerSuccessContributions, false,
                  function (contribution, index) { return contribution.contributor.id; }
                )
              )
              .concat(
                _.uniq(
                  salesContributions, false,
                  function (contribution, index) { return contribution.contributor.id; }
                )
              )
              .map(function (contribution) {
                return contribution.contributor.id.toString();
              });
        $('select.new-contributor.contributor option').each(function () {
          if (suggestedContributorIds.includes($(this).val())) {
            $(this).data('suggested', true);
          } else {
            $(this).data('suggested', false);
          }
        });
      },
      showContributorOptions = function (showSuggested) {
        $('.select2-results').css('display', 'none'); // avoid flicker (see below)
        var customerVal = $('select.new-contributor.customer').val(),
            customerId = Number.isInteger(parseInt(customerVal, 10)) ? customerVal : null,
            contributorId, customerContributorIds = [];

        // get the contributors for selected customer (if there is one)
        if (customerId) {
          $('select.new-contributor.contributor option').each(function () {
            if ($(this).data('suggested')) customerContributorIds.push($(this).val());
          });
        }
        /**
         * go through options and hide/show as necessary
         * (timeout needed since options are still loading at this point)
         */
        setTimeout(function () {
          $('.select2-results__option').each(function (index) {
            contributorId = $(this).attr('id').match(/-(\d+)$/)[1];
            if (showSuggested &&
                customerId &&
                index > 0 && // skip over first option (- Create New Contributor -)
                !customerContributorIds.includes(contributorId)) {
              $(this).css('display', 'none');
            } else {
              $(this).css('display', 'block');
            }
            $('.select2-results').css('display', 'initial'); // avoid flicker (see above)
          });
        }, 0);
      },
      monitorNewContributorSearch = function (e, data) {
        var $input = $(e.target),
            prev = $input.data('prev'),
            curr = $input.val(),
            customerId = $('select.new-contributor.customer').val();
        if (prev === '') {
          showContributorOptions(false); // show all company contributors
        } else if (curr === '') {
          showContributorOptions(true); // show suggested (customer) contributors
        }
        $input.data('prev', curr);
      };

  $(document)

    /**
     * pre-select fields if adding contributors from the curate view,
     * or if adding contributors while a filter is applied (success or customer)
     */
    .on('show.bs.modal', '#new-contributor-modal', function () {
      var $form = $('#new-contributor-form'),
          customerId, successId,
          dtSuccesses = $('#successes-table').DataTable();
      if (isCurateView()) {
        customerId = $('#curate-story-layout').data('customer-id');
        successId = $('#curate-story-layout').data('success-id');
        preSelectCustomerAndSuccess(customerId, successId);
      } else if ($('#contributors-filter').val().match(/customer/)) {
        customerId = $('#contributors-filter').val().match(/-(\d+)/)[1];
        preSelectCustomerAndSuccess(customerId, null);
      } else if ($('#contributors-filter').val().match(/success/)) {
        successId = $('#contributors-filter').val().match(/-(\d+)/)[1];
        customerId = dtSuccesses.row('[data-success-id="' + successId + '"]').data().customer.id;
        successId = preSelectCustomerAndSuccess(customerId, successId);
      }
    })

    // with blank new contributor search field, show suggestions; else show all
    .on('select2:open', 'select.new-contributor.contributor', function () {
      showContributorOptions(true); // true => show suggested options if customer selected

      // not sure why the timeout is necessary here!
      setTimeout(function () {
        $('input.select2-search__field').attr("placeholder", 'Search or Create New Contributor');
      }, 0);
      $('input.select2-search__field').data('prev', '');
      $('input.select2-search__field').on('input', monitorNewContributorSearch);
    })
    .on('select2:close','select.new-contributor.contributor', function() {
      $('input.select2-search__field').off('input', monitorNewContributorSearch);
      $('input.select2-search__field').attr("placeholder", null);
    })

    // select or create customer
    .on('change', 'select.new-contributor.customer', function (e) {
      var $form = $('#new-contributor-form'),
          customerVal = $(this).val(),
          customerId = isNaN(customerVal) ? null : customerVal,
          successVal = $('select.new-contributor.success').val(),
          successId = isNaN(successVal) ? null : successVal;

      // re-enable any contributor options that were disabled via success selection
      $('select.new-contributor.contributor').find('option:disabled').prop('disabled', false);

      // update hidden customer_id
      $form.find('input[id*="success_attributes_customer_id"]').val(customerId);

      if (customerId) {
        // turn off customer attributes
        $form.find('input[id*="customer_attributes"]').each(function () {
            $(this).prop('disabled', true);
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

    })

    .on('change', 'select.new-contributor.success', function () {
      var $form = $('#new-contributor-form'),
          successVal = $(this).val(),
          customerVal = $('select.new-contributor.customer').val(),
          successId = isNaN(successVal) ? null : successVal,
          success = $('#successes-table').DataTable()
            .column(1).data().toArray().find(function (success) {
              return success.id == successId;
            }),
          customerId = (success && success.customerId) || (isNaN(customerVal) ? null : customerVal);

      // re-enable any contributor options that were disabled via previous success selection
      $('select.new-contributor.contributor').find('option:disabled').prop('disabled', false);

      // existing success
      if (successId) {
        // update hidden success_id
        $form.find('input[id*="contribution_success_id"]').val(successId);

        // this will include customer attributes
        $form.find('input[id*="success_attributes"]').each(function () {
            $(this).prop('disabled', true);
          });

        // change select.customer
        // (change.select2 as we don't want the event to propagate - ?)
        $('select.new-contributor.customer').val(customerId).trigger('change.select2');

        // update select options
        disableExistingContributors(successId);

      // create success
      } else {
        // update hidden fields
        $form.find('input[id*="contribution_success_id"]').val('');
        $form.find('input[id*="success_attributes_id"]').val('');
        $form.find('input[id*="success_attributes_name"]').val(successVal);

        // let the 'change' handler for select.customer manage customer attributes
        $form.find('input[id*="success_attributes"]')
             .not('input[id*="customer_attributes"]')
             .prop('disabled', false);
      }

    })

    .on('change', 'select.new-contributor.contributor', function (e) {
      var $form = $('#new-contributor-form');

      // create contributor
      if ($(this).val() === '0') {
        $('.create-contributor').removeClass('hidden');
        setTimeout(function () {
          $('.create-contributor input[id*="first_name"]')[0].focus();
        }, 0);

        // validate contributor fields
        $('.create-contributor').find('input:not([type="hidden"])').each(function () {
          $(this).prop('required', true);
        });

        // update hidden fields
        // $form.find('#contribution_user_id').val('');
        $form.find('input[id*="contributor_attributes"]').each(function () {
          $(this).prop('disabled', false);
        });
      } else {
        $('.create-contributor').addClass('hidden');

        // don't validate contributor fields
        $('.create-contributor').find('input:not([type="hidden"])').each(function () {
          $(this).prop('required', false);
        });

        // update hidden fields
        // $form.find('#contribution_user_id').val($(this).val());
        $form.find('input[id*="contributor_attributes"]').each(function () {
            $(this).prop('disabled', true);
          });
      }

    })

    .on('change', 'select.new-contributor.referrer', function () {
      if ($(this).val() === '0') {
        disableReferrerAttrs(false);
      } else {
        disableReferrerAttrs(true);
      }
    })

    // if a new user is created, their password is their email address
    .on('change', '#new-contributor-form input[id*="email"]', function () {
      // could be .create-contributor or .create-referrer
      $(this).closest('div[class*="create-"]')
             .find('input[id*="password"]').val( $(this).val() );
    })

    // select2 needs a hack for search placeholder
    .on("select2:open", "select.new-contributor", function() {
      var placeholder;
      if ($(this).hasClass('customer')) {
        placeholder = "Search or enter the name of a New Customer";
      } else if ( $(this).hasClass('success') ) {
        placeholder = "Search or enter the name of a New Customer Win";
      } else if ($(this).hasClass('invitation-template')) {
        placeholder = "Search";
      } else if ($(this).hasClass('referrer')) {
        placeholder = 'Search or Create New Contact';
      } else {
        placeholder = "";
      }
      $(".select2-search--dropdown .select2-search__field").attr("placeholder", placeholder);
    })
    .on("select2:close", "select.new-contributor", function() {
        $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
    })

    // reset modal
    .on('hidden.bs.modal', '#new-contributor-modal', function () {
      $(this).find('form')[0].reset();
      $(this).find('.create-contributor, .create-referrer').addClass('hidden');
      $(this).find('select').val('').trigger('change.select2');
      $(this).find('select, select option').prop('disabled', false);
      $(this).find('.form-group').removeClass('has-error');
      $(this).find('.create-contributor input, .create-referrer input').prop('required', false);
      $('button[type="submit"][form="new-contributor-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-contributor-form"] i').css('display', 'none');
    })

    // need to listen for the click on the submit button instead of 'submit' on 'new-contributor-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-contributor-form"]', function (e) {
      var $form = $('#new-contributor-form'),
          $button = $(this);
      e.preventDefault();
      if (!$form.data('submitted') && validateForm()) {
        toggleFormWorking($form);
        $form.submit();
      } else {

      }
    });

}