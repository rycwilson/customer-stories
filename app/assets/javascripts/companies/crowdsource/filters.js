
function crowdsourceFiltersListeners () {

  // keep track of the last column search, so table can be reset on the next search;
  // the value will be the name of the column
  var lastSuccessesSearchColumn = null, lastSuccessesSearchValue = null,
      lastContributorsSearchColumn = null, lastContributorsSearchValue = null;

  $(document)
    .on('change', '.crowdsource.curator-select, ' +
                  '#successes-filter, #contributors-filter', function (e, data) {

      var $tableWrapper = $(this).closest('div[id*="table_wrapper"]'),
          $table = $tableWrapper.find('table'), dt = $table.DataTable(),
          curatorId;

      if ( $(this).hasClass('curator-select') ) {
        curatorId = $(this).val();
        // modify filter options to reflect curator's associations
        var $filter = $tableWrapper.find('.dt-filter'),
            successes = (curatorId === '0') ? app.company.successes :
                        app.company.successes.filter(function (success) {
                          return success.curator_id == curatorId;
                        }),
            customers = (curatorId === '0') ? app.company.customers :
                        app.company.customers.filter(function (customer) {
                          // customer has >= 1 success
                          return successes.some(function (success) {
                            return success.customer_id === customer.id;
                          });
                        }),
            $successesOptgroup = $filter.find('optgroup[label="Story Candidate"]');
            $customersOptgroup = $filter.find('optgroup[label="Customer"]');

        if ($table.is('#crowdsource-contributors-table')) {
          var contributors =
                app.contributions.filter(function (contribution) {
                  return successes.some(function (success) {
                    return (success.id === contribution.success_id) &&
                      (curatorId === '0' ? true : success.curator_id == curatorId);
                  });
                })
                .map(function (contribution) { return contribution.contributor; }),

              // >= 1 contributor
              successesWithC = successes.filter(function (success) {
                        app.contributions.some(function (contribution) {
                          return contribution.success_id === success.id;
                        });
                      }),

              customersWithC = customers.filter(function (customer) {
                        return successes.some(function (success) {
                          return success.customer_id === customer.id &&
                            app.contributions.some(function (contribution) {
                              return contribution.success_id === success.id;
                            });
                        });
                      }),
              $contributorsOptgroup = $filter.find('optgroup[label="Contributor"]');

          $contributorsOptgroup.empty();
          _.each(contributors, function (contributor) {
            $contributorsOptgroup.append(
              '<option value="contributor-' + contributor.id + '" data-column="contributor">' + contributor.full_name + '</option>'
            );
          });
        }

        // remove and replace optgroups in this table's filter
        $customersOptgroup.empty();
        _.each(customers, function (customer) {
          $customersOptgroup.append(
            '<option value="customer-' + customer.id + '" data-column="customer">' + customer.name + '</option>'
          );
        });

        $successesOptgroup.empty();
        _.each(successes, function (success) {
          $successesOptgroup.append(
            '<option value="success-' + success.id + '" data-column="success">' + success.name + '</option>'
          );
        });

        // when changing curators, start with all candidates/contributors
        $filter.val('0').trigger('change.select2');  // change select input without triggering change event

        dt.search('').column('curator:name')
          .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
          .draw();

        // update the other curator select (only once)
        if (!(data && data.auto)) {
          var $other = $('.crowdsource.curator-select').not($(this));
          $other.val($(this).val()).trigger('change', { auto: true });
        }
      }

      // successes-filter or contributors-filter
      else {
        curatorId = $tableWrapper.find('.crowdsource.curator-select').val();
        // filterCol matches a table column name (see initContributorsTable)
        var filterCol = $(this).find('option:selected').data('column'),
            filterVal = $(this).find('option:selected').val() === '0' ? '0' :
                        $(this).find('option:selected').text(),
            dtSearch;

        // curator && all candidates/contributors
        if (filterVal === '0') {
          if ($table.is('#successes-table') && lastSuccessesSearchColumn) {
            dtSearch = $table.DataTable().search('')
                          .column(lastSuccessesSearchColumn + ':name').search('');
            lastSuccessesSearchColumn = null;
          } else if ($table.is('#crowdsource-contributors-table') && lastContributorsSearchColumn) {
            dtSearch = $table.DataTable().search('')
                          .column(lastContributorsSearchColumn + ':name').search('');
            lastContributorsSearchColumn = null;
          } else {
            dtSearch = $table.DataTable().search('');
          }
          dtSearch.column('curator:name')
            .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
            .draw();

        // curator && filter column
        } else {
          dt.search('')
            .column('curator:name').search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
            .column(filterCol + ':name').search('^' + filterVal + '$', true, false)
            .draw();
          if ($table.is('#successes-table')) {
            lastSuccessesSearchColumn = filterCol;
            lastSuccessesSearchValue = filterVal;
          } else {
            lastContributorsSearchColumn = filterCol;
            lastContributorsSearchValue = filterVal;
          }
        }

      }
    })

    .on('keyup', '.select2-search', function (e) {
      var $table, curatorId, $input = $(this).find('input'), dtSearch;

      // is this #successes-filter or #contributors-filter ?
      if ($(this).next().find('#select2-successes-filter-results').length) {
        $table = $('#successes-table');
      } else if ($(this).next().find('#select2-contributors-filter-results').length) {
        $table = $('#crowdsource-contributors-table');
      } else {
        return false;
      }

      // curator is search by id, filter is search by text value
      curatorId = $table.closest('[id*="table_wrapper"]')
                        .find('.crowdsource.curator-select').val();
      // the table search needs to be reset depending on whether a prior column
      // search was performed
      if ($table.is('#successes-table') && lastSuccessesColumnSearch) {
        dtSearch = $table.DataTable().search('')
                      .column(lastSuccessesColumnSearch + ':name').search('');
        lastSuccessesColumnSearch = null;
      } else if ($table.is('#crowdsource-contributors-table') && lastContributorsColumnSearch) {
        dtSearch = $table.DataTable().search('')
                      .column(lastContributorsColumnSearch + ':name').search('');
        lastContributorsColumnSearch = null;
      } else {
        dtSearch = $table.DataTable().search('');
      }
      dtSearch
        .search('^' + $input.val() + '$', true, false)
        .column('curator:name').search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
        .draw();

    })

    .on('change', '#show-completed', function () {

      var showCompleted = $(this).prop('checked'),
          dt = $('#crowdsource-contributors-table').DataTable(),
          curatorId = $('.crowdsource.curator-select').val(), dtSearch,
          filterCol = $('#contributors-filter').find('option:selected').data('column'),
          filterVal = $('#contributors-filter').find('option:selected').val() === '0' ? '0' :
                        $('#contributors-filter').find('option:selected').text();

      if (filterVal === '0') {
        dtSearch = dt.search('')
                     .column('curator:name')
                     .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false);

      } else {
        dtSearch = dt.search('')
                     .column('curator:name')
                     .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
                     .column(filterCol + ':name')
                     .search(filterVal);
      }

      if (showCompleted) {
        dtSearch.column('status:name').search('').draw();

      } else {
        dtSearch.column('status:name').search('^((?!complete).)*$', true, false).draw();
      }

    });
}