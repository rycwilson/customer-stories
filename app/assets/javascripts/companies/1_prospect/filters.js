
function prospectFiltersListeners () {

  // keep track of the last column search, so table can be reset on the next search
  var lastSuccessesSearchColumn = 'success', lastContributorsSearchColumn = 'contributor',

      tagCuratorOptions = function ($filter, curatorId) {
        var successId, customerId, contributorId,
            companySuccesses = $('#successes-table').DataTable().rows().data().toArray(),
            companyContributions = $('#prospect-contributors-table').DataTable().rows().data().toArray(),
            companyCustomers = _.uniq(
              $('#successes-table').DataTable().column(2).data().toArray(), false,
              function (customer) { return customer.id; }
            ),
            curatorSuccesses = companySuccesses.filter(function (success) {
              return success.curator.id.toString() === curatorId;
            }),
            curatorSuccessIds = curatorSuccesses.map(function (success) {
              return success.id.toString();
            }),
            curatorCustomerIds = curatorSuccesses.map(function (success) {
              return success.customer.id.toString();
            }),
            curatorContributions = companyContributions.filter(function (contribution) {
              return contribution.success.curator_id.toString() === curatorId;
            }),
            curatorContributorIds = _.uniq(
              curatorContributions, false,
              function (contribution, index) { return contribution.contributor.id; }
            )
              .map(function (contribution) {
                return contribution.contributor.id.toString();
              });
        $filter
          .find('optgroup[label="Customer Win"] option')
            .each(function () {
              successId = $(this).val().match(/-(\d+)$/)[1];
              if (curatorId !== '0' && curatorSuccessIds.includes(successId)) {
                $(this).data('curator', true);
              } else {
                $(this).data('curator', false);
              }
            })
            .end()
          .find('optgroup[label="Contributor"] option')
            .each(function () {
              contributorId = $(this).val().match(/-(\d+)$/)[1];
              if (curatorId !== '0' && curatorContributorIds.includes(contributorId)) {
                $(this).data('curator', true);
              } else {
                $(this).data('curator', false);
              }
            })
            .end()
          .find('optgroup[label="Customer"] option')
            .each(function () {
              customerId = $(this).val().match(/-(\d+)$/)[1];
              if (curatorId !== '0' && curatorCustomerIds.includes(customerId)) {
                $(this).data('curator', true);
              } else {
                $(this).data('curator', false);
              }
            });
      },
      // showCurator is boolean, true => show curator-specific options
      showCuratorOptions = function ($filter, showCurator) {
        var curatorSuccessIds = [], curatorCustomerIds = [], curatorContributorIds = [],
            successId, customerId, contributorId;
        $('.select2-results').css('display', 'none'); // avoid flicker (see below)

        // gather tagged ids for comparison to .select2-results__option data
        $filter
          .find('optgroup[label="Customer Win"] option')
            .each(function () {
              successId = $(this).val().match(/-(\d+)$/)[1];
              if ($(this).data('curator')) curatorSuccessIds.push(successId);
            })
            .end()
          .find('optgroup[label="Customer"] option')
            .each(function () {
              customerId = $(this).val().match(/-(\d+)$/)[1];
              if ($(this).data('curator')) curatorCustomerIds.push(customerId);
            })
            .end()
          .find('optgroup[label="Contributor"] option')
            .each(function () {
              contributorId = $(this).val().match(/-(\d+)$/)[1];
              if ($(this).data('curator')) curatorContributorIds.push(contributorId);
            });

        // (timeout needed since options are still loading at this point)
        setTimeout(function () {
          $('.select2-results__option[aria-label="Customer Win"]').find('.select2-results__option')
            .each(function (index) {
              successId = $(this).attr('id').match(/-(\d+)$/)[1];
              if (showCurator && !curatorSuccessIds.includes(successId)) {
                $(this).css('display', 'none');
              } else {
                $(this).css('display', 'block');
              }
            });
          $('.select2-results__option[aria-label="Customer"]').find('.select2-results__option')
            .each(function (index) {
              customerId = $(this).attr('id').match(/-(\d+)$/)[1];
              if (showCurator && !curatorCustomerIds.includes(customerId)) {
                $(this).css('display', 'none');
              } else {
                $(this).css('display', 'block');
              }
            });
          $('.select2-results__option[aria-label="Contributor"]').find('.select2-results__option')
            .each(function (index) {
              contributorId = $(this).attr('id').match(/-(\d+)$/)[1];
              if (showCurator && !curatorContributorIds.includes(contributorId)) {
                $(this).css('display', 'none');
              } else {
                $(this).css('display', 'block');
              }
            });
          $('.select2-results').css('display', 'initial'); // avoid flicker (see above)
        }, 0);
      },
      monitorFilter = function (e, data) {
        var $input = $(e.target),
            $filter = $('a[href="#prospect-contributors"]').parent().hasClass('active') ?
                        $('#contributors-filter') : $('#successes-filter'),
            curatorId = $filter.closest('[id*="table_wrapper"').find('.curator-select').val(),
            prev = $input.data('prev'),
            curr = $input.val();
        if (prev === '' || curatorId === '0') {
          showCuratorOptions($filter, false); // show all items
        } else if (curr === '') {
          showCuratorOptions($filter, true); // show curator-specific items
        }
        $input.data('prev', curr);
      },
      setSearch = function ($table, useRegExSearch, searchStr) {
        var dt = $table.DataTable(),
            $tableWrapper = $table.closest('[id*="table_wrapper"]'),
            curatorId = $tableWrapper.find('.curator-select').val(),
            filterCol = $tableWrapper.find('.dt-filter option:selected').data('column'),
            filterVal = searchStr ? searchStr :
                          ( $tableWrapper.find('.dt-filter option:selected').val() === '0' ? '0' :
                            $tableWrapper.find('.dt-filter option:selected').text() ),
            // set curator
            dtSearch = dt.search('')
               .column('curator:name')
               .search(curatorId === '0' ? '' : '^' + curatorId + '$', true, false);

        if ($table.is($('#successes-table'))) {
          // clear last column search, and keep track of current search
          dtSearch = dtSearch.column(lastSuccessesSearchColumn + ':name').search('');
          lastSuccessesSearchColumn = filterCol;

          // incorporate checkbox filters
          dtSearch = dtSearch
            .column('story:name')
            .search($('#show-wins-with-story').prop('checked') ? '' :  '^false$', true, false);

        } else if ($table.is($('#prospect-contributors-table'))) {
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
      },
      toggleClear = function ($filter) {
        if ($filter.val() === '0') {
          $filter.prev().css('display', 'none');
        } else {
          $filter.prev().css('display', 'inline-block');
        }
      };

  $(document)

    .on('change', '.crowdsource.curator-select', function (e, data) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          $table = $tableWrapper.find('table'),
          $filter = $tableWrapper.find('.dt-filter'),
          curatorId = $(this).val();

      tagCuratorOptions($filter, curatorId);

      // TODO: should selecting a curator automatically filter all?
      $filter.val('0').trigger('change.select2');
      setSearch($table).draw();

      // update the other curator select (if auto, halt the chain)
      if (!(data && data.auto)) {
        var $other = $('.crowdsource.curator-select').not($(this));
        $other.val($(this).val()).trigger('change', { auto: true });
      }
    })

    .on('change', '#successes-filter, #contributors-filter', function () {
      var $table = $(this).closest('[id*="table_wrapper"]').find('table');
      toggleClear($(this)); // toggle the X icon
      setSearch($table, true).draw();
    })

    .on('keyup', '.select2-search', function (e) {
      var searchVal = $(this).find('input').val();
      // #successes-filter
      if ( $(this).next().find('#select2-successes-filter-results').length ) {
        setSearch($('#successes-table'), false, searchVal ).draw();
      // #contributors-filter
      } else if ( $(this).next().find('#select2-contributors-filter-results').length ) {
        setSearch($('#prospect-contributors-table'), false, searchVal ).draw();
      // something else
      } else {
        return false;
      }
    })

    // if a curator is selected, show curator-specific items
    .on('select2:open', '.dt-filter', function() {
      var curatorId = $(this).closest('[id*="table_wrapper"]').find('.curator-select').val();
      showCuratorOptions($(this), curatorId === '0' ? false : true);

      // keep track of previous value; this allows for toggling of curator-specific options
      $('input.select2-search__field').data('prev', '');
      $('input.select2-search__field').on('input', monitorFilter);
      $('.select2-search--dropdown .select2-search__field').attr('placeholder', 'Search');
    })
    .on('select2:close','.dt-filter', function() {
      $('input.select2-search__field').off('input', monitorFilter);
      $('.select2-search--dropdown .select2-search__field').attr('placeholder', null);
    })

    .on('change', '#show-wins-with-story', function () {
      setSearch($('#successes-table'), true).draw();
    })

    .on('change', '#show-published, #show-completed', function () {
      setSearch($('#prospect-contributors-table'), true).draw();
    })

    // search reset (prospect and curate sections)
    .on('click', '.search .search-all', function () {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          $table = $tableWrapper.find('table'),
          dt = $table.DataTable();
      $(this).next().val('0').trigger('change');

      // close any open child rows
      $table.find('tr').each(function () {
          if (dt.row($(this)).child.isShown()) {
            dt.row($(this)).child.hide();
          }
          $(this).removeClass('active');
        });
    });

}