
function crowdsourceFiltersListeners () {

  // keep track of the last column search, so table can be reset on the next search;
  // the value will be the name of the column
  var lastSuccessesSearchColumn = null, lastContributorsSearchColumn = null;

  var loadSelectOptions = function (curatorId, $filter) {

    var companySuccesses, companyCustomers, companyContributors,
        successes, customers, contributors,
        $customerOptgroup = $filter.find('optgroup[label="Customer"]'),
        $successOptgroup = $filter.find('optgroup[label="Customer Win"]'),
        $contributorOptgroup = $filter.find('optgroup[label="Contributor"]');
        // $successContactOptgroup = $filter.find('optgroup[label="Customer Success Contact"]');

    companySuccesses = $('#successes-table').DataTable().column(1).data().toArray();
    successes = (curatorId === '0') ? companySuccesses :
      companySuccesses.filter(function (success) {
        return success.curatorId == curatorId;
      });
    companyCustomers = _.uniq(
      $('#successes-table').DataTable().column(2).data().toArray(), true,
      function (customer, index) { return customer.id; }
    );
    customers = (curatorId === '0') ? companyCustomers :
      companyCustomers.filter(function (customer) {
        return successes.some(function (success) {
          return success.curatorId == curatorId &&
                 success.customerId == customer.id;
        });
      });
    // the source data is contributions; pull unique values for contributor.id
    companyContributors = _.uniq(
      $('#crowdsource-contributors-table').DataTable().column(1).data().toArray(), true,
      function (contributor, index) { return contributor.id; }
    );
    contributors = (curatorId === '0') ? companyContributors :
      companyContributors.filter(function (contributor) {
        return contributor.curatorId == curatorId;
      });

    // populate <select> options (both tables)
    $contributorOptgroup.empty();
    _.each(contributors, function (contributor) {
      $contributorOptgroup.append(
        '<option value="contributor-' + contributor.id +
        '" data-column="contributor">' + contributor.fullName + '</option>'
      );
    });
    $customerOptgroup.empty();
    _.each(customers, function (customer) {
      $customerOptgroup.append(
        '<option value="customer-' + customer.id + '" data-column="customer">' + customer.name + '</option>'
      );
    });

    if ( $filter.is('#crowdsource-contributors-filter') ) {

      // populate <select> options (unique to contributors table)
      $successOptgroup.empty();
      _.each(successes, function (success) {
        $successOptgroup.append(
          '<option value="success-' + success.id + '" data-column="success">' + success.name + '</option>'
        );
      });

    }
  };

  $(document)
    .on('change', '.crowdsource.curator-select, ' +
                  '#successes-filter, #contributors-filter', function (e, data) {

      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          $table = $tableWrapper.find('table'), dt = $table.DataTable(),
          $filter = $tableWrapper.find('.dt-filter'),
          curatorId;

      if ( $(this).hasClass('curator-select') ) {
        curatorId = $(this).val();
        loadSelectOptions( curatorId, $filter );
        // when changing curators, set filter to All
        $filter.val('0').trigger('change.select2');  // change select input without triggering change event
        // search
        dt.search('')
          .column('curator:name')
          .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
          .draw();
        // update the other curator select (if auto, halt the chain)
        if (!(data && data.auto)) {
          var $other = $('.crowdsource.curator-select').not($(this));
          $other.val($(this).val()).trigger('change', { auto: true });
        }
      }

      // successes-filter or contributors-filter
      else {
        curatorId = $tableWrapper.find('.curator-select').val();
        // filterCol matches a table column name (see initContributorsTable)
        var filterCol = $(this).find('option:selected').data('column'),
            filterVal = $(this).find('option:selected').val() === '0' ? '0' :
                        $(this).find('option:selected').text(),
            // incorporate checkbox filters
            dtSearch = dt.search('')
              .column('status:name')
              .search($('#show-completed').prop('checked') ? '' : '^((?!complete).)*$', true, false)
              .column('storyPublished:name')
              .search($('#show-published').prop('checked') ? '' : 'false');

        // curator && all successes/contributors
        if (filterVal === '0') {
          if ($table.is('#successes-table') && lastSuccessesSearchColumn) {
            // TODO: is this really necessary?
            dtSearch = dtSearch.column(lastSuccessesSearchColumn + ':name').search('');
            lastSuccessesSearchColumn = null;
          } else if ($table.is('#crowdsource-contributors-table') && lastContributorsSearchColumn) {
            dtSearch = dtSearch.column(lastContributorsSearchColumn + ':name').search('');
            lastContributorsSearchColumn = null;
          }
          dtSearch
            .column('curator:name')
            .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
            .draw();

        // curator && filter column
        } else {
          dtSearch
            .column('curator:name')
            .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
            .column(filterCol + ':name').search('^' + filterVal + '$', true, false)
            .draw();
          if ($table.is('#successes-table')) {
            lastSuccessesSearchColumn = filterCol;
          } else {
            lastContributorsSearchColumn = filterCol;
          }
        }

      }
    })

    .on('keyup', '.select2-search', function (e) {
      var curatorId, $input = $(this).find('input'), dtSearch;

      // is this #successes-filter or #contributors-filter ?
      if ($(this).next().find('#select2-successes-filter-results').length) {
        $table = $('#successes-table');
      } else if ($(this).next().find('#select2-contributors-filter-results').length) {
        $table = $('#crowdsource-contributors-table');
        // incorporate checkbox filters
        dtSearch = $table.DataTable().search('')
          .column('status:name')
          .search($('#show-completed').prop('checked') ? '' : '^((?!complete).)*$', true, false)
          .column('storyPublished:name')
          .search($('#show-published').prop('checked') ? '' : 'false');
      } else {
        return false;
      }

      // curator is search by id, filter is search by text value
      curatorId = $table.closest('[id*="table_wrapper"]')
                        .find('.crowdsource.curator-select').val();
      // the table search needs to be reset depending on whether a prior column
      // search was performed
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
      dtSearch
        .search('^' + $input.val() + '$', true, false)
        .column('curator:name').search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false)
        .draw();

    })

    .on("select2:open", ".dt-filter", function() {
        $(".select2-search--dropdown .select2-search__field").attr("placeholder", "search");
    })
    .on("select2:close",".dt-filter", function() {
        $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
    })

    .on('change', '#show-completed, #show-published', function () {

      var dt = $('#crowdsource-contributors-table').DataTable(),
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

      if ( $(this).is('#show-completed') ) {
        var showCompleted = $(this).prop('checked');
        if ( showCompleted ) {
          dtSearch.column('status:name').search('').draw();
        } else {
          dtSearch.column('status:name').search('^((?!complete).)*$', true, false).draw();
        }

      } else if ( $(this).is('#show-published')) {
        var showPublished = $(this).prop('checked');
        if ( showPublished ) {
          dtSearch.column('storyPublished:name').search('').draw();

        } else {
          dtSearch.column('storyPublished:name').search('false').draw();
        }
      }

    });

}