
function crowdsourceFiltersListeners () {

  // keep track of the last column search, so table can be reset on the next search
  var lastSuccessesSearchColumn = 'success', lastContributorsSearchColumn = 'contributor';

  var setSearch = function ($table, useRegExSearch, searchStr) {
    var dt = $table.DataTable(), $tableWrapper = $table.closest('[id*="table_wrapper"]'),
        curatorId = $tableWrapper.find('.curator-select').val(),
        filterCol = $tableWrapper.find('.dt-filter option:selected').data('column'),
        filterVal = searchStr ? searchStr :
                      ( $tableWrapper.find('.dt-filter option:selected').val() === '0' ? '0' :
                        $tableWrapper.find('.dt-filter option:selected').text() ),
        // set curator
        dtSearch = dt.search('')
           .column('curator:name')
           .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false);

    if ( $table.is($('#successes-table')) ) {
      // clear last column search, and keep track of current search
      dtSearch = dtSearch
        .column(lastSuccessesSearchColumn + ':name').search('');
      lastSuccessesSearchColumn = filterCol;
      // incorporate checkbox filters
      dtSearch = dtSearch
        .column('story:name')
        .search($('#show-wins-with-story').prop('checked') ? '' :  '^false$', true, false);

    } else if ( $table.is($('#prospect-contributors-table')) ) {
      // clear last column search, and keep track of current search
      dtSearch = dtSearch.column(lastContributorsSearchColumn + ':name').search('');
      lastContributorsSearchColumn = filterCol;
      // incorporate checkbox filters
      dtSearch = dtSearch
        .column('status:name')
        .search($('#show-completed').prop('checked') ? '' : '^((?!completed).)*$', true, false)
        .column('storyPublished:name')
        .search($('#show-published').prop('checked') ? '' : 'false');
    }

    // search a column
    if (filterVal !== '0') {
      if (useRegExSearch) {
        dtSearch = dtSearch.column(filterCol + ':name').search('^' + filterVal + '$', true, false);
      } else {
        dtSearch = dtSearch.column(filterCol + ':name').search(filterVal);
      }
    }

    return dtSearch;

  };

  var loadSelectOptions = function (curatorId, $filter) {

    var companySuccesses, companyCustomers, companyContributors,
        successes, customers, contributors,
        $customerOptgroup = $filter.find('optgroup[label="Customer"]'),
        $successOptgroup = $filter.find('optgroup[label="Customer Win"]'),
        $contributorOptgroup = $filter.find('optgroup[label="Contributor"]');
        // $successContactOptgroup = $filter.find('optgroup[label="Customer Win Contact"]');

    // <select> data (both tables)
    companySuccesses = $('#successes-table').DataTable().column(1).data().toArray();
    successes = (curatorId === '0') ? companySuccesses :
      companySuccesses.filter(function (success) {
        return success.curatorId == curatorId;
      });
    companyCustomers = _.uniq(
      $('#successes-table').DataTable().column(2).data().toArray(), false,
      function (customer, index) { return customer.id; }
    );
    customers = (curatorId === '0') ? companyCustomers :
      companyCustomers.filter(function (customer) {
        return successes.some(function (success) {
          return success.curatorId == curatorId &&
                 success.customerId == customer.id;
        });
      });

    // populate <select> options (both tables)
    $customerOptgroup.empty();
    _.each(customers, function (customer) {
      $customerOptgroup.append(
        '<option value="customer-' + customer.id + '" data-column="customer">' + customer.name + '</option>'
      );
    });
    $successOptgroup.empty();
    _.each(successes, function (success) {
      $successOptgroup.append(
        '<option value="success-' + success.id + '" data-column="success">' + success.name + '</option>'
      );
    });

    if ( $filter.is('#contributors-filter') ) {

      // the source data is contributions; pull unique values for contributor.id
      companyContributors = _.uniq(
        $('#prospect-contributors-table').DataTable().column(1).data().toArray(), false,
        function (contributor, index) { return contributor.id; }
      );
      contributors = (curatorId === '0') ? companyContributors :
        companyContributors.filter(function (contributor) {
          return contributor.curatorId == curatorId;
        });

      // populate <select> options (contributors only)
      $contributorOptgroup.empty();
      _.each(contributors, function (contributor) {
        $contributorOptgroup.append(
          '<option value="contributor-' + contributor.id +
          '" data-column="contributor">' + contributor.fullName + '</option>'
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
        loadSelectOptions(curatorId, $filter);
        // when changing curators, set search filter to All
        $filter.val('0').trigger('change.select2');  // change select input without triggering change event
        // search
        setSearch($table).draw();

        // update the other curator select (if auto, halt the chain)
        if (!(data && data.auto)) {
          var $other = $('.crowdsource.curator-select').not($(this));
          $other.val($(this).val()).trigger('change', { auto: true });
        }

      }

      // successes-filter or contributors-filter
      else {
        setSearch($table, true).draw();
      }

    })

    .on('keyup', '.select2-search', function (e) {
      var searchVal = $(this).find('input').val();
      // #successes-filter
      if ( $(this).next().find('#select2-successes-filter-results').length ) {
        setSearch( $('#successes-table'), false, searchVal ).draw();
      // #contributors-filter
      } else if ( $(this).next().find('#select2-contributors-filter-results').length ) {
        setSearch( $('#prospect-contributors-table'), false, searchVal ).draw();
      // something else
      } else {
        return false;
      }
    })

    // select2 needs a hack for search placeholder
    .on("select2:open", ".dt-filter", function() {
        $(".select2-search--dropdown .select2-search__field").attr("placeholder", "Select or Search");
    })
    .on("select2:close",".dt-filter", function() {
        $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
    })

    .on('change', '#show-wins-with-story', function () {
      setSearch( $('#successes-table'), true ).draw();
    })

    .on('change', '#show-published, #show-completed', function () {
      setSearch( $('#prospect-contributors-table'), true ).draw();
    })

    // search reset
    .on('click', '.search .search-all', function () {
      $(this).next().val('0').trigger('change');
    });

}