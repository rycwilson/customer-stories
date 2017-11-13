
function newContributorListeners() {

  var $form, customerVal, customerId, successVal, successId,
      customerSuccesses, successOptionsData,
      customerContributors, contributorOptionsData,

      isCurateView = function () {
        return $('#workflow-tabs li.active a').attr('href') === '#curate';
      },
      isFilteredView = function () {
        if ($('#contributors-filter').val() !== '0') {

          // return the filter applied, i.e. 'customer' or 'success'
          return $('#contributors-filter').val().match(/(\w+)-/)[1];
        } else {
          return false;
        }
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

      formIsValid = function () {
        var $customerSelect = $('select.new-contributor.customer'),
            $successSelect = $('select.new-contributor.success'),
            $contributorSelect = $('select.new-contributor.contributor');
        return $customerSelect.val() && $successSelect.val() && (
            !['0', ''].includes($contributorSelect.val()) || (
                $('#contribution_contributor_attributes_first_name').val() &&
                $('#contribution_contributor_attributes_last_name').val() &&
                $('#contribution_contributor_attributes_email').val()
              )
          ) && (
            $('select.new-contributor.referrer').val() !== '0' || (
                $('#contribution_referrer_attributes_first_name').val() &&
                $('#contribution_referrer_attributes_last_name').val() &&
                $('#contribution_referrer_attributes_email').val()
              )
          );
      },

      validateForm = function () {
        return formIsValid() ? $('button[type="submit"]').prop('disabled', false) :
                             $('button[type="submit"]').prop('disabled', true);
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
        // default options data
        successOptionsData = [{ id: '', text: '' }];
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
          })
          .prop('disabled', false);
      },

      updateContributorOptions = function (customerId) {
        // default options data
        contributorOptionsData = [
          { id: '', text: '' },
          { id: 0, text: '- Create New Contributor -' }
        ];
        if (customerId) {
          customerContributors = $('#prospect-contributors-table').DataTable().rows().data().toArray()
            .filter(function (contribution) {
              return contribution.success.customer_id == customerId;
            });
          contributorOptionsData = _.uniq(
              customerContributors, false,
              function (contribution, index) { return contribution.contributor.id; }
            )
            .map(function (contribution) {
              return {
                id: contribution.contributor.id,
                text: contribution.contributor.full_name
              };
            });
          contributorOptionsData.unshift(
            { id: '', text: '' },
            { id: 0, text: '- Create New Contributor -' }
          );
        }
        $('select.new-contributor.contributor').select2('destroy').empty()
          .select2({
            theme: "bootstrap",
            placeholder: 'Select or Create',
            data: contributorOptionsData
          });
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
            if ( successContributorIds.includes($option.val()) ) {
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
        if (disabled) {
          $('#new-contributor-form .create-referrer').addClass('hidden');
        } else {
          $('#new-contributor-form .create-referrer').removeClass('hidden');
        }
        ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
          .forEach(function (attribute) {
            $('#new-contributor-form [id*="referrer_attributes_' + attribute + '"]')
              .prop('disabled', disabled);
          });
      };

  $(document)

    /**
     * pre-select fields if adding contributors from the curate view,
     * or if adding contributors while a filter is applied (success or customer)
     */
    .on('show.bs.modal', '#new-contributor-modal', function () {
      var customerId, successId,
          dtSuccesses = $('#successes-table').DataTable();
      if (isCurateView()) {
        customerId = $('#curate-story-layout').data('customer-id');
        successId = $('#curate-story-layout').data('success-id');
        preSelectCustomerAndSuccess(customerId, successId);
      } else if (isFilteredView() === 'customer') {
        customerId = $('#contributors-filter').val().match(/-(\d+)/)[1];
        preSelectCustomerAndSuccess(customerId, null);
      } else if (isFilteredView() === 'success') {
        successId = $('#contributors-filter').val().match(/-(\d+)/)[1];
        customerId = dtSuccesses.row('[data-success-id="' + successId + '"]').data().customer.id;
        successId = preSelectCustomerAndSuccess(customerId, successId);
      }
    })

    .on('input', '#new-contributor-modal', validateForm)
    .on('change', '#new-contributor-modal', validateForm)

    // select or create customer
    .on('change', 'select.new-contributor.customer', function (e) {
      $form = $('#new-contributor-form');
      customerVal = $(this).val();
      customerId = isNaN(customerVal) ? null : customerVal;
      successVal = $('select.new-contributor.success').val();
      successId = isNaN(successVal) ? null : successVal;

      // update hidden customer_id
      $form.find('input[id*="success_attributes_customer_id"]').val(customerId);

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
      updateContributorOptions(customerId);

    })

    .on('change', 'select.new-contributor.success', function () {
      $form = $('#new-contributor-form');
      successVal = $(this).val();
      customerVal = $('select.new-contributor.customer').val();
      successId = isNaN(successVal) ? null : successVal;

      var success = $('#successes-table').DataTable()
        .column(1).data().toArray().find(function (success) {
          return success.id == successId;
        });

      customerId = (success && success.customerId) ||
        (isNaN(customerVal) ? null : customerVal);

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
      // update select options
      updateContributorOptions(customerId);
      disableExistingContributors(successId);

    })

    .on('change', 'select.new-contributor.contributor', function (e) {
      $form = $('#new-contributor-form');

      // create contributor
      if ($(this).val() === '0') {
        $('.create-contributor').removeClass('hidden');

        // update hidden fields
        // $form.find('#contribution_user_id').val('');
        $form.find('input[id*="contributor_attributes"]').each(function () {
            $(this).prop('disabled', false);
          });
      } else {
        $('.create-contributor').addClass('hidden');

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
      if ( $(this).hasClass('customer') ) {
        placeholder = "Select or enter the name of a new Customer";
      } else if ( $(this).hasClass('success') ) {
        placeholder = "Select or enter the name of a new Customer Win";
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
      $(this).find('.create-contributor').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      $(this).find('select').prop('disabled', false);
      // for a select that has an option with val === 0, this approach is necessary:
      $('select.new-contributor.contributor').select2('val', '');
      $('button[type="submit"][form="new-contributor-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-contributor-form"] i').css('display', 'none');
    })

    .on('click', 'button[type="submit"][form="new-contributor-form"]', function (e) {

      $('button[type="submit"][form="new-contributor-form"] span').toggle();
      $('button[type="submit"][form="new-contributor-form"] .fa-spinner').toggle();

    });

}