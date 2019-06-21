
//= require ./contributor_invitation

function contributorActionsListeners () {

  var contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      removeContribution = function (id) {
        $.ajax({
          url: contributionPath(id),
          method: 'delete',
          dataType: 'json'
        })
          .done(function (contribution, status, xhr) {
            $('#prospect-contributors-table, #curate-contributors-table').each(function () {
              var $table = $(this);
              $table.DataTable()
                .row('[data-contribution-id="' + contribution.id + '"]')
                .remove()
                .draw();
              $table.find('tr.group').each(function () {
                if ($(this).next().hasClass('group')) {
                  $(this).remove();
                }
              });
            });
          });
      };

  $(document)


    // BEWARE this will also fire from Successes view
    .on('click', '.contributor-actions .view-contribution, td.status .view-contribution',
      function () {
        var contributionId = $(this).closest('tr').data('contribution-id'),
            formattedDate = function (date) {
                return moment(date).calendar(null, {
                  sameDay: '[today]',
                  lastDay: '[yesterday]',
                  lastWeek: '['+ moment(date).fromNow() +']',
                  sameElse: 'M/DD/YY'
                }).split('at')[0];
              };

        $.ajax({
          url: contributionPath(contributionId),
          method: 'get',
          data: {
            get_submission: true
          },
          dataType: 'json'
        })
          .done(function (contribution, status, xhr) {
            $.when(
              $('#contribution-content-modal .modal-content').empty().append(
                _.template( $('#contribution-content-template').html() )({
                  contributions: [contribution],
                  successId: null,
                  formattedDate: formattedDate
                })
              )
            )
              .done(function () {
                $('#contribution-content-modal').modal('show');
              });
          });

      }
    )
    .on('click', '.contributor-actions .view-success', function () {
      var successId = $(this).closest('tr').data('success-id');
      $('#successes-filter').val('success-' + successId).trigger('change');
      $('#successes-filter').select2('focus');
      $(document)
        .one('click', function () {
          $('#successes-filter').next().removeClass('select2-container--focus');
        })
        .one('shown.bs.tab', 'a[href="#successes"]', function () {
          $('html, body').animate({ scrollTop: 65 }, 200);
        });
      $('a[href="#successes"]').tab('show');
    })
    .on('click',
      '.contributor-actions .story-settings, .contributor-actions .story-content, .contributor-actions .story-contributors',
      function (e) {
        var href = $(this).find('a')[0].href, storyTab;
        e.preventDefault();
        if ($(this).hasClass('story-settings')) {
          storyTab = '#story-settings';
        } else if ($(this).hasClass('story-content')) {
          storyTab = '#story-content';
        } else {
          storyTab = '#story-contributors';
        }
        Cookies.set('csp-edit-story-tab', storyTab);
        window.location = href;
      }
    )
    .on('click', '.contributor-actions .completed', function () {
      var dt = $(this).closest('table').DataTable(),
          $row = $(this).closest('tr'),
          rowData = dt.row($row).data(),
          $tdStatus = $row.find('td.status'),
          contributionId = $row.data('contribution-id');
      $.ajax({
        url: contributionPath(contributionId),
        method: 'put',
        data: { completed: true },
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          rowData.status = data.status;
          rowData.display_status = data.display_status;
          dt.row($row).data(rowData);
          $tdStatus.find('i').toggle();
          setTimeout(function () {
            $tdStatus.find('i').toggle();
          }, 2000);
          setTimeout(function () {
            if ( $('#show-completed').length &&
                 $('#show-completed').prop('checked') === false ) {
              $('#show-completed').trigger('change');
            }
          }, 2200);
        });
    })
    .on('click', '.contributor-actions .remove', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');
      bootbox.confirm({
        size: 'small',
        className: 'confirm-remove-contributor',
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
          if (confirmRemove) { removeContribution(contributionId); }
        }
      });
    });

}