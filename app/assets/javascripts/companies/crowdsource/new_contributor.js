
function newContributorListeners() {

  $(document)

    // .on('shown.bs.modal', '#new-contributor-modal', function () {
    //   $(this).find('#contribution_customer_id').select2('open');
    // })

    .on('show.bs.modal', '#new-contributor-modal', function () {

      // $.ajax({
      //   url: '/companies/' + app.company.id + '/contributions',
      //   method: 'get',
      //   data: { customer: }
      // })
    })
    .on('reset', '#new-contributor-modal form', function () {
      $('.new-or-existing-contributor.new').css('display', 'block');
      $('.new-or-existing-contributor.existing').css('display', 'none');
      $(this).find('select').select2('val', '');
    })

    .on('change', 'select.new-contributor-customer', function (e) {
      var customerId = $(this).val(),
          successes = app.company.successes.filter(function (success) {
                return success.customer_id == customerId;
              })
              .map(function (success) {
                return { id: success.id, text: success.name || "Unknown Story Candidate" };
              });
          successes.unshift({ id: '', text: '' });
          contributors = app.contributions.filter(function (contribution) {
              return successes.some(function (success) {
                return contribution.success_id === success.id;
              });
            })
            .map(function (contribution) {
              return { id: contribution.contributor.id,
                       text: contribution.contributor.full_name };
            });
          contributors.unshift({ id: '', text: '' });
      // ref: https://github.com/select2/select2/issues/2830#issuecomment-229710429
      $('select.new-contributor-success')
        .select2('destroy').empty()
        .select2({
          theme: "bootstrap",
          placeholder: 'Select',
          data: successes
        });
      $('select.new-contributor-existing')
        .select2('destroy').empty()
        .select2({
          theme: "bootstrap",
          placeholder: 'Select',
          data: contributors
        });

      // if no contributors for this customer, disable the radio button and engage the tooltip
      if (contributors.length === 1) {  // empty (1 because placeholder)
        if ($('input[name="contribution[existing_contributor]"]').val() === 'yes') {
          $('input[name="contribution[existing_contributor]"][value="no"]')
            .trigger('click');
        }
        $('input[name="contribution[existing_contributor]"][value="yes"]')
          .prop('disabled', true);
        $('.new-or-existing-contributor').find('[data-toggle="tooltip"]')
          .tooltip({
            placement: 'top',
            title: 'To select an existing Contributor, first select a Customer for which Contributors exist'
          });

      } else {
        $('input[name="contribution[existing_contributor]"][value="yes"]')
          .prop('disabled', false);
        // setting the title to empty string will effectively kill the tooltip
        $('.new-or-existing-contributor').find('[data-toggle="tooltip"]')
          .tooltip('destroy');
      }

    })

    .on('change', '.new-or-existing-contributor.buttons input:radio',
      function (e) {
        // if came from modal close / form reset, check values
        $('.new-or-existing-contributor:not(.buttons)').toggle();
      })

    .on('submit', '#contributor-form', function () {
      $(this).find('span').toggle();
      $(this).find('.fa-spinner').toggle();
    });
}