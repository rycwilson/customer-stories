
function crowdsource() {}

// lots of this will also apply to curate contributors
function crowdsourceListeners () {

  $(document)

    .on('keyup', '.select2-search',
      function (e) {
        var $table, searchCols, curatorCol, curatorId,
            $input = $(this).find('input');

        if ($(this).next().find('#select2-successes-filter-results').length) {
          $table = $('#successes-table');
        } else if ($(this).next().find('#select2-contributors-filter-results').length) {
          $table = $('#contributors-table');
        } else {
          e.preventDefault();
        }
        curatorCol = $table.data('curator-col');
        curatorId = $table.closest('[id*="table_wrapper"]').find('.crowdsource-curator-select').val();
        $table.DataTable()
              .search('')
              .columns().search('')
              .columns(curatorCol).search(curatorId === '0' ? '' : curatorId)
              .columns(1,2,4,5).search($input.val()).draw();
      })

    .on('change', '.crowdsource-curator-select, #successes-filter, #contributors-filter',
      function (e, data) {
        var $tableWrapper = $(this).closest('div[id*="table_wrapper"]'),
            $table = $tableWrapper.find('table'), dt = $table.DataTable(),
            $filter = $tableWrapper.find('.dt-filter'),
            curatorId = $tableWrapper.find('.crowdsource-curator-select').val(),
            curatorCol = $table.data('curator-col'),
            filterData = $filter.select2('data'),
            filterVal = filterData[0].id,
            filterText = filterData[0].text,
            filterCol = $(filterData[0].element).data('col');

        if ($(this).hasClass('crowdsource-curator-select')) {
          // only include options for items owned by the curator
          var successes = curatorId === '0' ? app.company.successes :
                          app.company.successes.filter(function (success) {
                            return (success.curator_id == curatorId);
                          }),
              customers = curatorId === '0' ? app.company.customers :
                          app.company.customers.filter(function (customer) {
                            return successes.some(function (success) {
                              return success.customer_id === customer.id;
                            });
                          }),
              $customersOptgroup = $filter.find('optgroup[label="Customer"]'),
              $successesOptgroup = $filter.find('optgroup[label="Story Candidate"]');

          // remove and replace optgroups in this table's filter>
          $customersOptgroup.empty();
          _.each(customers, function (customer) {
            $customersOptgroup.append(
              '<option value="c' + customer.id + '" ' + 'data-col="' + $table.data('customer-col') + '">' + customer.name + '</option>'
            );
          });
          $successesOptgroup.empty();
          _.each(successes, function (success) {
            $successesOptgroup.append(
              '<option value="s' + success.id + '" ' + 'data-col="' + $table.data('success-col') + '">' + success.name + '</option>'
            );
          });
          // when changing curators, start with all candidates/contributors
          $filter.val('0').trigger('change.select2');  // change select input without triggering change event
          // find entries owned by curator
          dt.search('')
            .columns().search('')
            .columns([curatorCol]).search(curatorId === '0' ? '' : curatorId).draw();
          // update the other curator select (only once)
          if (!(data && data.auto)) {
            var $other = $('.crowdsource-curator-select').not($(this));
            $other.val($(this).val()).trigger('change', { auto: true });
          }
        }

        // successes-filter or contributors-filter
        else {
          // curator && all candidates/contributors
          if (filterVal === '0') {
            dt.search('')
              .columns().search('')
              .columns([curatorCol]).search(curatorId === '0' ? '' : curatorId)
              .draw();

          // curator && filter column
          } else {
            // heads up: 'c18' matches 'c180' => solved by treating as RegEx
            dt.search('')
              .columns().search('')
              .columns([curatorCol]).search(curatorId === '0' ? '' : curatorId)
              .columns([filterCol]).search('^' + filterVal + '(,|$)', true)
              .draw();
          }
        }
      })

    // .on('select2:open', function (e) {
    //   var $input = $('.select2-container--open input.select2-search__field');
    //   if ($(e.target).attr('id') === 'successes-filter') {
    //     console.log($(e.target).select2('data'))
    //     // $input.on('keyup', { $table: $('#successes-table').DataTable(), $input: $input },
    //     //   liveSearch
    //     // );

    //   } else if ($(e.target).attr('id') === 'contributors-filter') {
    //     $input.on('keydown', { $table: $('#contributors-table').DataTable(), $input: $input },
    //       liveSearch
    //     );
    //   }
    // })
    // .on('select2:close', function () {
    //   $(document).off('input', liveSearch);
    // })

    .on('click', '.success-actions-dropdown a.contributors',
      function (e) {
        // // if (no contributions) { e.preventDefault(); }
        var successId = $(this).closest('tr').data('success-id');
        $('a[href="#contributors-tab-pane"]').tab('show');
        $('#contributors-filter').val('s' + successId).trigger('change');
      })

    .on('click', '#contributors-table a.success-name',
      function (e) {
        var successId = $(this).closest('tr').next().data('success-id');
        $('a[href="#successes-tab-pane"]').tab('show');
        $('#successes-filter').val('s' + successId).trigger('change');
      })

    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on('change', '#toggle-group-by-success, #toggle-group-by-customer',
      function () {
        if ($(this).attr('id') === 'toggle-group-by-success') {
          toggleStriped($('#contributors-table'));
        } else {
          toggleStriped($('#successes-table'));
        }
      })

    // successes - order by customer grouping
    .on('click', '#successes-table tr.group',
      function () {
        var dt = $('#successes-table').DataTable(),
            currentOrder = dt.order()[0];
        if (currentOrder[0] === 1 && currentOrder[1] === 'asc') {
          dt.order([ 1, 'desc' ]).draw();
        }
        else {
          dt.order([ 1, 'asc' ]).draw();
        }
      })

    // contributors - order by success
    .on('click', '#contributors-table tr.group',
      function (e) {
        var dt = $('#contributors-table').DataTable(),
            successIndex = 2,
            currentOrder = dt.order()[0];
        if (! $(e.target).is('a') ) {
          if (currentOrder[0] === successIndex && currentOrder[1] === 'asc') {
            dt.order([ successIndex, 'desc' ]).draw();
          }
          else {
            dt.order([ successIndex, 'asc' ]).draw();
          }
        }
      })

    // contributors child rows
    .on('click', '#contributors-table td.contributor-details',
      function () {
        var dt = $(this).closest('table').DataTable(),
            $tr = $(this).closest('tr'),
            dtRow = dt.row($tr),
            template = _.template($('#contributor-template').html()),
            contributionId = $tr.data('contribution-id'),
            contribution = app.contributions.find(function (c) {
              return c.id === contributionId;
            });

        if (dtRow.child.isShown()) {
          dtRow.child.hide();
          $tr.children().last().css('color', '#666');
          $tr.find('td.contributor-name > span').removeClass('shown');
          $tr.removeClass('shown active');
        }
        else {
          dtRow.child( template({ contribution: contribution }) ).show();
          $tr.children().last().css('color', 'white');
          $tr.find('td.contributor-name > span').addClass('shown');
          if (contribution.contributor.linkedin_url) {
            loadCspOrPlaceholderWidget($tr.next(), contribution);
            loadLinkedinWidget($tr.next(), contribution);
          }
          $tr.addClass('shown active');
        }
        $(this).children().toggle();  // toggle caret icons
      })

    .on('click', 'td.success-details',
      function () {
        var dt = $(this).closest('table').DataTable(),
            $tr = $(this).closest('tr'),
            dtRow = dt.row($tr),
            template = _.template($('#success-details-template').html());

        if (dtRow.child.isShown()) {
          dtRow.child.hide();
          $tr.children().last().css('color', '#666');
          $tr.removeClass('shown active');
        }
        else {
          dtRow.child( template({}) ).show();
          $tr.children().last().css('color', 'white');
          $tr.addClass('shown active');
        }
        $(this).children().toggle();  // toggle caret icons
      })

    .on('shown.bs.dropdown', '.actions-dropdown',
      function () {
        $(this).closest('tr').addClass('active');
      })

    .on('hidden.bs.dropdown', '.actions-dropdown',
      function () {
        $(this).closest('tr').removeClass('active');
        // $(this).children().last().css('color', '#666');
      });

}

function loadCspOrPlaceholderWidget ($tr, contribution) {
  var widgetWidth = 400,
      template = _.template($('#csp-linkedin-widget-template').html());

  // populate csp widgets and placeholder widgets;
  // the placeholders will be swapped out for linkedin widgets as they arrive
  $tr.find('.csp-widget-container')
    .append( template({ contributor: contribution.contributor,
                        widgetWidth: widgetWidth }) )
    .imagesLoaded(function () {
       $tr.find('.csp-linkedin-widget').removeClass('hidden');
     });

  $tr.find('.placeholder-widget-container')
    .append( template({ loading: true,
                        contributor: contribution.contributor,
                        widgetWidth: widgetWidth }) )
    .imagesLoaded(function () {
      // .csp-linkedin-widget may be a csp widget populated with data,
      // or (in this case) the placeholder widget
       $tr.find('.csp-linkedin-widget').removeClass('hidden');
     });
}

function loadLinkedinWidget ($tr, contribution) {
  var widgetWidth = 400,
      cspWidgetIsPresent = $tr.find('.widget-container > .csp-widget-container').length;
  if (cspWidgetIsPresent) { return false; }
  else {
    var $placeholderWidgetContainer = $tr.find('.placeholder-widget-container'),
        $linkedinWidgetContainer = $tr.find('.linkedin-widget-container'),
        $widget = $("<script type='IN/MemberProfile' " +
                      "data-id='" + contribution.contributor.linkedin_url + "' " +
                      "data-format='inline' data-related='false' " +
                      "data-width='" + widgetWidth.toString() + "'></script>"),
        widgetMarginTop = '-' + $placeholderWidgetContainer.css('height'),
        newWidgetPostMesgHandler = function (event) {
          // console.log(event);
          if ( $('body').hasClass('companies show') ) {
            // in Chrome, the origin property is in the event.originalEvent object
            var origin = event.origin || event.originalEvent.origin;
            if ( origin === "https://platform.linkedin.com" &&
                 event.data.includes('widgetReady') ) {
              var newWidgetId = $linkedinWidgetContainer.find('iframe').attr('id'),
                  widgetReadyId = event.data.match(/^(\w+)\s/)[1];
                  // console.log('newWidgetId: ', newWidgetId);
              if (newWidgetId &&
                  widgetReadyId === newWidgetId.match(/^\w+(li_gen\w+)_provider/)[1]) {
                $linkedinWidgetContainer
                  .css('margin-top', widgetMarginTop)  // height of the placeholder container (for overlay)
                  .removeClass('hidden');
                  // .closest('.widget-container')
                  // .data('linkedin-widget-loaded', true);
              }
            }  // widgetReady event
          }
        };  // var declarations

    $linkedinWidgetContainer.append($widget);
    window.addEventListener('message', newWidgetPostMesgHandler, false);
    IN.parse();
    setTimeout(function () {
      if ($tr.find('.widget-container').data('linkedin-widget-loaded')) {
        // success (just leave the placeholder; removing or emptying will affect layout)
      } else {
        // failure
        $placeholderWidgetContainer
          .find('.member-info > p')
          .css('color', 'red')
          .text('Profile data not available');
      }
    }, 7000);
    // remove the listener when navigating away from this page
    $(document).one('turbolinks:before-visit', function () {
      window.removeEventListener('message', newWidgetPostMesgHandler, false);
    });
  }
}

// manipulate table stripes when alternating between row grouping and no row grouping
function toggleStriped ($table) {

  $table.find('tr.group').toggle();
  $table.toggleClass('table-striped');

  if ( $table.hasClass('table-striped') ) {
    $table.find('tr:not(.group)')
      .each(function (index) {
        $(this).removeClass('even odd');
        $(this).addClass(index % 2 === 0 ? 'even' : 'odd');
        // reset the hover behavior, lest the new background color override bootstrap
        $(this).hover(
          function () { $(this).css('background-color', '#f5f5f5'); },
          function () {
            $(this).css('background-color', index % 2 === 0 ? '#fff' : '#f9f9f9');
          }
        );
      });
    $table.find('tr.even:not(.group)').css('background-color', '#fff');
    $table.find('tr.odd:not(.group)').css('background-color', '#f9f9f9');

  } else {
    $table.find('tr:not(.group)').css('background-color', '#fff');
    $table.find('tr:not(.group)')
      .each(function () {
        $(this).removeClass('even odd');
        // reset the hover behavior, lest the new background color override bootstrap
        $(this).hover(
          function () { $(this).css('background-color', '#f5f5f5'); },
          function () { $(this).css('background-color', '#fff'); }
        );
      });
  }
}