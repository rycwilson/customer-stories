
function successActionsListeners () {

  var successPath = function (successId) {
        return '/successes/' + successId;
      },
      contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      formattedDate = function (date) {
          return moment(date).calendar(null, {
            sameDay: '[today]',
            lastDay: '[yesterday]',
            lastWeek: '['+ moment(date).fromNow() +']',
            sameElse: 'M/DD/YY'
          }).split('at')[0];
        },
      renderSuccessContributions = function (successId, contributions) {
        // return function () {
        //   console.log('not here?')
          $('#contribution-content-modal .modal-content').empty().append(
            _.template( $('#contribution-content-template').html() )({
              contributions: contributions,
              successId: successId,
              formattedDate: formattedDate
            })
          );
        // };
      },
      showSuccessContributions = function (successId, contributions) {
        $.when( renderSuccessContributions(successId, contributions) )
          .done(function () {
            // console.log('but wait...')
            $('#contribution-content-modal').modal('show');
          });
      },

      removeSuccess = function (id) {
        $.ajax({
          url: successPath(id),
          method: 'delete',
          dataType: 'json'
        })
          .done(function (success, status, xhr) {
            $('#successes-table').DataTable()
              .row( $('[data-success-id="' + success.id + '"]') )
              .remove()
              .draw();

            // if this was the only success under a group, remove the group
            $('#successes-table').find('tr.group').each(function () {
                  if ($(this).next().hasClass('group')) {
                    $(this).remove();
                  }
                });
            // update app data
            // app.contributions = app.contributions.filter(function (c) {
            //   return c.id == contribution.id;
            // });
          });
      };

  $(document)

    .on('click', '.success-actions .manage-contributors', function (e) {
      var successId = $(this).closest('tr').data('success-id');
      $('a[href="#prospect-contributors"]').tab('show');
      $('#contributors-filter').val('success-' + successId).trigger('change');
      // for a filtered view, default to checkbox filters all applied (nothing hidden)
      $('.contributors.checkbox-filter input').prop('checked', true).trigger('change');
    })

    .on('click', '.success-actions .view-submissions', function () {

      var successId = $(this).closest('tr').data('success-id'),
          contributionIds = [], contributions = [];

      // can't search on successId given current setup of the table data
      contributionIds = $('#prospect-contributors-table').DataTable().rows().data().toArray()
        .filter(function (contribution) {
          return contribution.success.id == successId &&
                 contribution.status.match(/(contribution|feedback)/);
        })
        .map(function (contribution) { return contribution.id; });


      contributionIds.forEach(function (id) {

        $.ajax({
          url: contributionPath(id),
          method: 'get',
          data: {
            get_submission: true
          },
          dataType: 'json'
        })
          .done(function (contribution, status, xhr) {
            contributions.push(contribution);
            if (contributionIds.length === contributions.length) {
              showSuccessContributions(successId, contributions);
            }
          });

      });

    })

    .on('click', '.success-actions .remove', function () {
      var successId = $(this).closest('tr').data('success-id');
      bootbox.confirm({
        size: 'small',
        className: 'confirm-remove-success',
        closeButton: false,
        message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Are you sure?</span>",
        buttons: {
          confirm: {
            label: 'Remove',
            className: 'btn-danger'
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default'
          }
        },
        callback: function (confirmRemove) {
          if (confirmRemove) { removeSuccess(successId); }
        }
      });
    })

    .on('click', '.success-actions .start-curation', function () {
      // see stories/shared/new_story.js
    })

    .on('click', '.success-actions .add-contributor', function (e) {

      var $modal = $('#new-contributor-modal'),
          customerId = $(this).closest('tr').data('customer-id'),
          successId = $(this).closest('tr').data('success-id');

      $('a[href="#prospect-contributors"]').tab('show');
      $('#contributors-filter').val('success-' + successId).trigger('change');
      $modal.modal('show');
      $modal.find('#contribution_customer_id').val(customerId).trigger('change');
      $modal.find('#contribution_success_id').val(successId).trigger('change');

    });
}


