
function newContributorListeners() {

  var customerId, successId,
      customerSuccesses, successOptionsData,
      customerContributors, contributorOptionsData,
      contributor_attrs = ['first_name', 'last_name', 'email', 'sign_up_code', 'password'],
      noCustomerContributors = function ($contributorSelect) {
        return $contributorSelect.find('option').length === 2;
      },
      noAvailableContributors = function ($contributorSelect) {
        return $contributorSelect.find('option').toArray()
          .slice(2, $contributorSelect.find('option').length)
          .every(function (option) {
            return option.disabled;
          });
      },
      formIsValid = function () {
        var $customerSelect = $('select.new-contributor.customer'),
            $successSelect = $('select.new-contributor.success'),
            $contributorSelect = $('select.new-contributor.contributor');
        return $customerSelect.val() && $successSelect.val() &&
        (
          !['', '0'].includes($contributorSelect.val()) ||
          (
            $('#contribution_contributor_attributes_first_name').val() &&
            $('#contribution_contributor_attributes_last_name').val() &&
            $('#contribution_contributor_attributes_email').val()
          )
        );
      },
      validateForm = function () {
        return formIsValid() ? $('button[type="submit"]').prop('disabled', false) :
                             $('button[type="submit"]').prop('disabled', true);
      },
      isCurateView = function () {
        return $('#workflow-tabs li.active a').attr('href') === '#curate';
      },
      preSelectCustomerAndSuccess = function () {
        var $customerSelect = $('select.new-contributor.customer'),
            $successSelect = $('select.new-contributor.success');
        customerId = $('#curate-story-layout').data('customer-id');
        successId = $('#curate-story-layout').data('success-id');
        $customerSelect
          .val(customerId).trigger('change').prop('disabled', true);
        $successSelect
          .val(successId).trigger('change').prop('disabled', true);
      },
      setSuccessOptions = function (customerId) {
        if (customerId === 0) {
          successOptionsData = [];
        } else {
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
            placeholder: 'Select or Create',
            data: successOptionsData
          })
          .prop('disabled', false);
      },
      setContributorOptions = function (customerId) {

        if (customerId === 0) {
          contributorOptionsData = [];

        } else {
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
      };

  $(document)

    // pre-select fields if adding contributors from the curate view
    .on('show.bs.modal', '#new-contributor-modal', function () {
      if ( isCurateView() ) {
        preSelectCustomerAndSuccess();
      }
    })

    .on('input', '#new-contributor-modal', validateForm)
    .on('change', '#new-contributor-modal', validateForm)

    .on('change', 'select.new-contributor.customer', function (e) {

      var $successSelect = $('select.new-contributor.success'),
          $contributorSelect = $('select.new-contributor.contributor');

      // $contributorSelect.prop('disabled', true);
      // $('.create-contributor').addClass('hidden');

      /**
       * if an existing customer:
       * - change select.success options (ok)
       * - blank select.success if current selection is not a customer success
       * - blank select.contributor if no contribution to a customer success
       *
       * if a new customer:
       * - blank select.success unless it's a custom value
       * - blank select.contributor
       *
       */

      if ( isNaN($(this).val()) ) {
        // clear select.success if existing success is currently selected
        if ( Number.isInteger(parseInt($('select.new-contributor.success').val(), 10)) ) {
          $('select.new-contributor.success').val('').trigger('change.select2');
        }
        // same for contributor select
        if ( Number.isInteger(parseInt($('select.new-contributor.contributor').val(), 10)) ) {
          $('select.new-contributor.contributor').val('').trigger('change.select2');
        }
        setSuccessOptions(0);
        setContributorOptions(0);
      } else {
        customerId = $(this).val();
        setSuccessOptions(customerId);
        setContributorOptions(customerId);
      }


    })

    // disallow adding any contributors that have already been added to a success
    .on('change', '.new-contributor.success', function () {

      var $contributorSelect = $('select.new-contributor.contributor'),
          successId = $(this).val(),
          success = $('#successes-table').DataTable()
            .column(1).data().toArray().find(function (success) {
              return success.id == successId;
            }),
          customerId = success && success.customerId;

      // if success exists, update the customer
      if (customerId) {
        // this will also trigger a change to contributor select options
        $('select.new-contributor.customer')
          .val(customerId).trigger('change.select2');
        setContributorOptions(customerId);
        disableExistingContributors(successId);
      }



      // // refresh select2
      // $contributorSelect.select2({
      //   theme: 'bootstrap',
      //   placeholder: 'Select an existing Contributor, or create a new one'
      // })
      // .prop('disabled', false);

      // // conditionally expose New Contributor
      // if ( noCustomerContributors($contributorSelect) ||
      //      noAvailableContributors($contributorSelect) ) {
      //   $contributorSelect.val('0').trigger('change');
      // } else {
      //   $contributorSelect.val('').trigger('change');
      // }

    })

    // toggle New Contributor fields
    .on('change', '.new-contributor.contributor', function (e) {

      if ($(this).val() === '0') {
        $('.create-contributor').removeClass('hidden');
        contributor_attrs.forEach(function (attr) {
          $('#contribution_contributor_attributes_' + attr)
            .attr('name', 'contribution[contributor_attributes][' + attr + ']');
        });
      } else {
        $('.create-contributor').addClass('hidden');
        contributor_attrs.forEach(function (attr) {
          $('#contribution_contributor_attributes_' + attr)
            .attr('name', '');
        });
      }

    })

    // if a new user is created, their password is their email address
    .on('change', '#new-contributor-form input[id*="email"]', function () {
      // could be .create-contributor or .create-referrer
      $(this).closest('div[class*="create-"]')
             .find('input[id*="password"').val( $(this).val() );
    })

    // reset modal
    .on('hidden.bs.modal', '#new-contributor-modal', function () {

      var $successSelect = $('select.new-contributor.success'),
          $contributorSelect = $('select.new-contributor.contributor');

      $(this).find('.create-contributor').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      // for a select that has an option with val === 0, this approach is necessary:
      $contributorSelect.select2('val', '');
      $(this).find('form')[0].reset();
      $('button[type="submit"][form="new-contributor-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-contributor-form"] i').css('display', 'none');

    })

    .on('submit', '#new-contributor-form', function () {
      $('button[type="submit"][form="new-contributor-form"] span').toggle();
      $('button[type="submit"][form="new-contributor-form"] .fa-spinner').toggle();
    });

}