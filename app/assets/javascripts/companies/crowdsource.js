
function crowdsource () {
}

function crowdsourceListeners () {

  // keep track of the last column search, so table can be reset on the next search
  var lastSuccessesColumnSearch = null, lastContributorsColumnSearch = null;

  $(document)

    .on('reset', '#new-contributor-modal form', function () {
      $('.new-or-existing-contributor.new').css('display', 'block');
      $('.new-or-existing-contributor.existing').css('display', 'none');
    })

    .on('change', '.new-or-existing-contributor.buttons input[type="radio"]',
      function (e) {
        // if came from modal close / form reset, check values
        $('.new-or-existing-contributor:not(.buttons)').toggle();
      })

    .on('change', 'select.new-contributor-customer',
      function (e) {
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
        if (contributors.length === 1) {  // empty (1 because placeholder)
          if ($('.new-or-existing-contributor.buttons input:radio:checked')
                  .val() === 'exists') {
            $('.new-or-existing-contributor.buttons input[value="new"]')
              .trigger('click');
          }
          $('.new-or-existing-contributor.buttons input[value="exists"]')
            .prop('disabled', true);
        } else {
          $('.new-or-existing-contributor.buttons input[value="exists"]')
            .prop('disabled', false);
        }

      })

    .on('keyup', '.select2-search',
      function (e) {
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
                '<option value="contributor-' + contributor.id + '" data-column="contributor">' + contributor.full_name + '</option>'
              );
            });
          }

      // remove and replace optgroups in this table's filter>
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

          // find entries owned by curator
          dt.search('')
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
              filterVal = $(this).find('option:selected').val() === '0' ? '0' :
                          $(this).find('option:selected').text(),
              dtSearch;

          // curator && all candidates/contributors
          if (filterVal === '0') {
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
              .column('curator:name').search(curatorId === '0' ? '' : curatorId)
              .draw();

          // curator && filter column
          } else {
            // heads up: '18' matches '180' => solved by treating as RegEx
            // (disregard this as we're now searching on the option text value)
            dt.search('')
              .column('curator:name').search(curatorId === '0' ? '' : curatorId)
              .column(filterCol + ':name').search(filterVal)
              .draw();
            if ($table.is('#successes-table')) {
              lastSuccessesColumnSearch = filterCol;
            } else {
              lastContributorsColumnSearch = filterCol;
            }
          }

        }
      })

    .on('click', '.success-actions-dropdown a.contributors',
      function (e) {
        // // if (no contributions) { e.preventDefault(); }
        var successId = $(this).closest('tr').data('success-id');
        $('a[href="#crowdsource-contributors-tab-pane"]').tab('show');
        $('#contributors-filter').val('success-' + successId).trigger('change');
      })

    .on('click', '#crowdsource-contributors-table a.success',
      function (e) {
        var successId = $(this).closest('tr').next().data('success-id');
        $('a[href="#successes-tab-pane"]').tab('show');
        $('#successes-filter').val('success-' + successId).trigger('change');
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