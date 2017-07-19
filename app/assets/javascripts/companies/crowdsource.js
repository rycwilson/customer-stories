
function crowdsource () {
}

// lots of this will also apply to curate contributors
function crowdsourceListeners () {

  $(document)

    .on('click', 'a[href="#crowdsource-panel"]',
      function () {
        // if ($('#successes-tab-pane').children().length === 0) {
        //   $.get('/companies/' + app.company.id + '/successes',
        //     function (html, status, xhr) {
        //       $('#successes-tab-pane').append(html)
        //         .fadeIn({ duration: 150, easing: 'linear' });
        //       initSuccessesTable();
        //       $('#loading-successes').toggle();
        //       $('#crowdsource-panel .layout-main').css({
        //         opacity: 1,
        //         'pointer-events': 'auto'
        //       });
        //       // now get the contributors table...
        //       $.get('/companies/' + app.company.id + '/crowdsource-contributors',
        //         function (html, status, xhr) {
        //           $('#crowdsource-contributors-tab-pane').append(html)
        //             .fadeIn({
        //               duration: 300, easing: 'linear',
        //               complete: function () {
        //                 initContributorsTable('crowdsource');
        //                 $('.crowdsource.curator-select').each(function () {
        //                   $(this).val(
        //                     $(this).children('[value="' + app.current_user.id.toString() + '"]').val()
        //                   ).trigger('change', { auto: true });
        //                 });
        //                 $('#loading-successes').toggle();
        //                 $('#crowdsource-panel .layout-main').css({
        //                   opacity: 1,
        //                   'pointer-events': 'auto'
        //                 });
        //               }
        //             });
        //         });
        //     });
        // }
      })

    .on('keyup', '.select2-search',
      function (e) {
        var $table, curatorId, $input = $(this).find('input');
        if ($(this).next().find('#select2-successes-filter-results').length) {
          $table = $('#successes-table');
        } else if ($(this).next().find('#select2-contributors-filter-results').length) {
          $table = $('#crowdsource-contributors-table');
        } else {
          e.preventDefault();
        }
        curatorId = $table.closest('[id*="table_wrapper"]').find('.crowdsource.curator-select').val();
        // console.log('table: ', $table);
        // console.log('filter: ', $input.val());
        // console.log('curatorCol: ', curatorCol);
        // console.log('curatorId: ', curatorId);
        $table.DataTable()
          .search('')
          .search($input.val())
          .column('curator:name').search(curatorId === '0' ? '' : curatorId)
          .draw();
      })

    .on('change', '.crowdsource.curator-select, #successes-filter, #contributors-filter',
      function (e, data) {
        var $tableWrapper = $(this).closest('div[id*="table_wrapper"]'),
            $table = $tableWrapper.find('table'), dt = $table.DataTable(),
            curatorId;

        if ($(this).hasClass('curator-select')) {
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
                '<option value="' + contributor.id + '" data-column="contributor">' + contributor.full_name + '</option>'
              );
            });
          }

      // remove and replace optgroups in this table's filter>
          $customersOptgroup.empty();
          _.each(customers, function (customer) {
            $customersOptgroup.append(
              '<option value="' + customer.id + '" data-column="customer">' + customer.name + '</option>'
            );
          });

          $successesOptgroup.empty();
          _.each(successes, function (success) {
            $successesOptgroup.append(
              '<option value="' + success.id + '" data-column="success">' + success.name + '</option>'
            );
          });

          // when changing curators, start with all candidates/contributors
          $filter.val('0').trigger('change.select2');  // change select input without triggering change event

          // find entries owned by curator
          dt.search('')
            // .columns().search('')
            .column('curator:name').search(curatorId === '0' ? '' : curatorId).draw();
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
              filterVal = $(this).val();
          // curator && all candidates/contributors
          if (filterVal === '0') {
            dt.search('')
              .columns().search('')
              .column('curator:name').search(curatorId === '0' ? '' : curatorId)
              .draw();

          // curator && filter column
          } else {
            console.log('curatorId: ', curatorId)
            console.log('filterCol: ', filterCol)
            console.log('filterVal: ', filterVal)
            // heads up: 'customer-18' matches 'customer-180' => solved by treating as RegEx
            dt.search('')
              // .columns().search('')
              .column('curator:name').search(curatorId === '0' ? '' : curatorId)
              .column(filterCol + ':name').search('^' + filterVal + '(,|$)', true)
              .draw();
          }
        }
      })

    .on('click', '.success-actions-dropdown a.contributors',
      function (e) {
        // // if (no contributions) { e.preventDefault(); }
        var successId = $(this).closest('tr').data('success-id');
        $('a[href="#crowdsource-contributors-tab-pane"]').tab('show');
        $('#contributors-filter').val('s' + successId).trigger('change');
      })

    .on('click', '#crowdsource-contributors-table a.success-name',
      function (e) {
        var successId = $(this).closest('tr').next().data('success-id');
        $('a[href="#successes-tab-pane"]').tab('show');
        $('#successes-filter').val('s' + successId).trigger('change');
      })

    .on('click', '#crowdsource-contributors-table td.email-template', function (e) {
      console.log(contributorsEditor)
      contributorsEditor.inline(this);
    })

    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on('change', '#toggle-group-by-success, #toggle-group-by-customer',
      function () {
        if ($(this).attr('id') === 'toggle-group-by-success') {
          toggleStriped($('#crowdsource-contributors-table'));
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
    .on('click', '#crowdsource-contributors-table tr.group',
      function (e) {
        var dt = $('#crowdsource-contributors-table').DataTable(),
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
    .on('click', 'td.contributor-details', function () {
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