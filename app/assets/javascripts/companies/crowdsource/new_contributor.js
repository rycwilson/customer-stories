
function newContributorListeners() {

  var $customerSelect = $('select.new-contributor.customer'),
      $successSelect = $('select.new-contributor.success'),
      $contributorSelect = $('select.new-contributor.contributor'),
      customerId, successId, successContributorIds,
      customerSuccesses, customerSuccessesSelect2Options,
      customerContributors, customerContributorsSelect2Options,
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
        var customerId = $('#curate-story-layout').data('customer-id'),
            successId = $('#curate-story-layout').data('success-id');
        $customerSelect
          .val(customerId).trigger('change').prop('disabled', true);
        $successSelect
          .val(successId).trigger('change').prop('disabled', true);
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

      $contributorSelect.prop('disabled', true);
      $('.create-contributor').addClass('hidden');

      customerId = $(this).val();

      customerSuccesses = app.company.successes
        .filter(function (success) {
          return success.customer_id == customerId;
        });

      customerSuccessesSelect2Options = customerSuccesses
        .map(function (success) {
          return { id: success.id, text: success.name || "Unknown Story Candidate" };
        });
      customerSuccessesSelect2Options
        .unshift({ id: '', text: '' });

      customerContributors = app.contributions
        .filter(function (contribution) {
          return customerSuccesses.some(function (success) {
            return contribution.success_id === success.id;
          });
        });

      customerContributorsSelect2Options = _.uniq(
        customerContributors
          .map(function (contribution) {
            return { id: contribution.contributor.id,
                     text: contribution.contributor.full_name };
          }),
        function (contributor, key, id) { return contributor.id; }
      );
      customerContributorsSelect2Options
        .unshift({ id: '', text: '' }, { id: 0, text: '- New Contributor -' });

      // ref: https://github.com/select2/select2/issues/2830#issuecomment-229710429
      $successSelect.select2('destroy').empty()
        .select2({
          theme: "bootstrap",
          placeholder: 'Select',
          data: customerSuccessesSelect2Options
        })
        .prop('disabled', false);

      $contributorSelect.select2('destroy').empty()
        .select2({
          theme: "bootstrap",
          placeholder: 'Select',
          data: customerContributorsSelect2Options
        });


    })

    // disallow adding any contributors that have already been added to a success
    .on('change', '.new-contributor.success', function () {

      successId = $(this).val();

      successContributorIds = app.contributions
        .filter(function (contribution) {
          return contribution.success_id == successId;
        })
        .map(function (contribution) {
          return contribution.contributor.id.toString();
        });

      // disable any contributors already added to this success
      $contributorSelect.find('option').each(function () {
        var $option = $(this);
        if ( successContributorIds.includes( $option.val() ) ) {
          $option.prop('disabled', true);
        }
      });

      // refresh select2
      $contributorSelect.select2({
        theme: 'bootstrap',
        placeholder: 'Select or Add'
      })
      .prop('disabled', false);

      // conditionally expose New Contributor
      if ( noCustomerContributors($contributorSelect) ||
           noAvailableContributors($contributorSelect) ) {
        $contributorSelect.val('0').trigger('change');
      } else {
        $contributorSelect.val('').trigger('change');
      }

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

    // reset modal
    .on('hidden.bs.modal', '#new-contributor-modal', function () {
      $(this).find('.create-contributor').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      // for a select that has an option with val === 0, this approach is necessary:
      $contributorSelect.select2('val', '');
      $successSelect.prop('disabled', true);
      $contributorSelect.prop('disabled', true);
      $(this).find('form')[0].reset();
    });

}