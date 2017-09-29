
function newContributorListeners() {

  var $customerSelect = $('select.new-contributor.customer'),
      $successSelect = $('select.new-contributor.success'),
      $contributorSelect = $('select.new-contributor.contributor'),
      validForm = function () {
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
        return validForm() ? $('button[type="submit"]').prop('disabled', false) :
                             $('button[type="submit"]').prop('disabled', true);
      };

  $(document)

    .on('input', '#new-contributor-modal', function () {
      validateForm();

    })
    .on('change', '#new-contributor-modal', function () {
      validateForm();
    })

    .on('change', 'select.new-contributor.customer', function (e) {

      var customerId = $(this).val(),
          // $successSelect = $('select.new-contributor.success'),
          // $contributorSelect = $('select.new-contributor.contributor'),
          successes = app.company.successes.filter(function (success) {
                return success.customer_id == customerId;
              })
              .map(function (success) {
                return { id: success.id, text: success.name || "Unknown Story Candidate" };
              }),
          contributors = app.contributions.filter(function (contribution) {
                return successes.some(function (success) {
                  return contribution.success_id === success.id;
                });
              })
              .map(function (contribution) {
                return { id: contribution.contributor.id,
                         text: contribution.contributor.full_name };
              });

      // empty option for placeholder
      successes.unshift({ id: '', text: '' });
      contributors.unshift({ id: '', text: '' }, { id: 0, text: '- New Contributor -' });

      // ref: https://github.com/select2/select2/issues/2830#issuecomment-229710429
      $successSelect.select2('destroy').empty()
        .select2({
          theme: "bootstrap",
          placeholder: 'Select',
          data: successes
        })
        .prop('disabled', false);

      $contributorSelect.select2('destroy').empty()
        .select2({
          theme: "bootstrap",
          placeholder: 'Select',
          data: contributors
        })
        .prop('disabled', false);

      // if no contributors for this customer, select New Contributor
      // (length of 2 accounts for empty option and New Contributor option)
      if (contributors.length === 2) {
        $contributorSelect.val('0').trigger('change');
      } else {
        $contributorSelect.val('').trigger('change');
      }

    })

    // reset modal
    .on('hidden.bs.modal', '#new-contributor-modal', function () {
      $(this).find('.create-contributor').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      // for a select that has an option with val === 0, this approach is necessary:
      $('select.new-contributor.contributor').select2('val', '');
      $('select.new-contributor.success, select.new-contributor.contributor')
        .prop('disabled', true);
      $(this).find('form')[0].reset();
    })

    // toggle New Contributor fields
    .on('change', '.new-contributor.contributor', function (e) {
      if ($(this).val() === '0') {
        $('.create-contributor').removeClass('hidden');
      } else {
        $('.create-contributor').addClass('hidden');
      }
    })

    .on('submit', '#new-contributor-form', function (e) {
      e.preventDefault()
      // $(this).find('span').toggle();
      // $(this).find('.fa-spinner').toggle();
      if ($('.create-contributor').hasClass('hidden')) {
        $('.create-contributor input').each(function () {
          $(this).attr('name', '');
        });
      }
      $(this).submit();
    });
}