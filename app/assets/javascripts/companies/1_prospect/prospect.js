
//= require ./filters
//= require ./new_success
//= require ./new_contributor
//= require ./success_details
//= require ./success_actions
//= require ./contributor_details
//= require ./contributor_actions/contributor_actions
//= require ./linkedin_util

function prospect () {

  /**
   * since the 'invalid' event doesn't bubble up, validation listeners can't be delegated
   * and must be attached directly to the inputs (or form if calling formEl.checkValidity())
   */
  var formValidationListeners = function () {
    $('#new-success-form, #new-contributor-form').each(function () {
      var $form = $(this);
      $form.find('select, input').on('invalid', function (e) {
        $(this).closest('.form-group').addClass('has-error');

        /**
         * the only form input(s) that can have a validation error other than 'required'
         * is the contributor (or referrer) email, which can be missing, improperly formatted or a duplicate;
         * first two handled by client, duplicate handled by server
         */
        if ($(this).is('[id*="contributor_attributes_email"]') ||
            $(this).is('[id*="referrer_attributes_email"]')) {
          if ($(this)[0].validity.typeMismatch) {
            $(this).next().text('Invalid email format');
          } else {
            $(this).next().text('Required');
          }
        }
      });
    });
  };

  formValidationListeners();

}

function prospectListeners () {

  prospectFiltersListeners();
  newSuccessListeners();
  newContributorListeners();
  successDetailsListeners();
  successActionsListeners();
  contributorDetailsListeners();
  contributorActionsListeners();
  contributorInvitationListeners();

  // new success and new contributor forms
  var validateInput = function ($input) {
    if ($input[0].checkValidity()) {
      $input.closest('.form-group').removeClass('has-error');

      /**
       * email field(s) are the only ones that have more than one potential validation failure mode,
       * thus requiring that the .help-block be cleared
       */
      if ($input.is('[id*="email"]')) $input.next().text('');
    }
  };
  var lastSuccessesSortDirection = 'asc',
      lastContributorsSortDirection = 'asc';

  $(document)

    .on('click', '#prospect .layout-sidebar a', function () {
      Cookies.set('prospect-tab', $(this).attr('href'));
    })

    .on('click', '#prospect-contributors-table tr.group a.story', function () {
      Cookies.set('csp-curate-story', 'contributors');
    })

    // the close event happens shortly after blur; to ensure smooth transition...
    .on('blur', 'td.crowdsourcing-template', function () {
      var $td = $(this), editor;
      if ( $td.closest('table').is('#prospect-contributors-table') ) {
        editor = prospectContributorsEditor;
      } else {
        editor = curateContributorsEditor;
      }
      editor.one('close', function () {
        $td.removeClass('editor-open');
      });
    })

    .on('click', 'td.crowdsourcing-template', function (e) {
      var $row = $(this).parent(),
          workflowStage = $(this).closest('table').attr('id').match(/^(\w+)\-/)[1];
      // don't allow template change if request already sent (or re-sent)
      // (see createdRow property of datatables config)
      if ( $(this).hasClass('disabled') ) { return false; }
      $(this).addClass('editor-open');  // styling adjustment
      if (workflowStage === 'prospect') {
        openContributorsEditor(prospectContributorsEditor, $row);
      } else {
        openContributorsEditor(curateContributorsEditor, $row);
      }
    })

    .on('click', '#prospect-contributors-table a.success', function (e) {
      var successId = $(this).closest('tr').next().data('success-id');
      $('a[href="#successes"]').tab('show');
      $('#successes-filter').val('success-' + successId).trigger('change');
    })

    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on('change', '#toggle-group-by-customer, #toggle-group-by-success',
      function () {
        if ($(this).is('#toggle-group-by-success')) {
          toggleStriped($('#prospect-contributors-table'));
        } else {
          toggleStriped($('#successes-table'));
        }
      })

    // successes - order by customer grouping, secondarily by timestamp
    .on('click', '#successes-table tr.group', function () {
        var $table = $('#successes-table'),
            dt = $table.DataTable(),
            successIndex = 1, customerIndex = 2, statusIndex = 4,
            currentSortColumn = dt.order()[0][0],
            currentSortDirection = dt.order()[0][1],
            direction;
        if (currentSortColumn === customerIndex) {
          direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
        }
        else if (currentSortColumn === statusIndex) {
          direction = lastSuccessesSortDirection;
          $table.find('th[aria-label*="Status"]').removeClass('sorting_asc sorting_desc').addClass('sorting');
        }
        dt.order([[customerIndex, direction], [successIndex, 'desc']]).draw();
        lastSuccessesSortDirection = direction;
      })

    // contributors - order by customer, then success name, then contributor timestamp
    .on('click', '#prospect-contributors-table tr.group', function (e) {
        var $table = $('#prospect-contributors-table'),
            dt = $table.DataTable(),
            contributorIndex = 1, successIndex = 2, invitationTemplateIndex = 3,
            customerIndex = 5, statusIndex = 6,
            currentSortColumn = dt.order()[0][0],
            currentSortDirection = dt.order()[0][1],
            direction;
        if (currentSortColumn === customerIndex) {
          direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else if (currentSortColumn === invitationTemplateIndex) {
          direction = lastContributorsSortDirection;
          $table.find('th[aria-label*="Invitation"]').removeClass('sorting_asc sorting_desc').addClass('sorting');
        } else if (currentSortColumn === statusIndex) {
          direction = lastContributorsSortDirection;
          $table.find('th[aria-label*="Status"]').removeClass('sorting_asc sorting_desc').addClass('sorting');
        }
        dt.order([[customerIndex, direction], [successIndex, 'asc'], [contributorIndex, 'desc']]).draw();
        lastContributorsSortDirection = direction;
      })

    // https://www.gyrocode.com/articles/jquery-datatables-column-width-issues-with-bootstrap-tabs/
    .on('shown.bs.tab', '#prospect a[data-toggle="tab"]', function(e) {
         $($.fn.dataTable.tables(true)).DataTable()
            .columns.adjust();
      })

    // close a child row
    .on('click', 'div.success-details button[type="reset"], ' +
                 'div.contributor-details button[type="reset"]', function () {
        $(this).closest('tr').prev().find('td[class*="details"]').trigger('click');
      })

    // validate form inputs
    .on('change',
      '#new-success-form select, #new-success-form input, #new-contributor-form select, #new-contributor-form input',
      function () {
        validateInput($(this));
      }
    )
    .on('click', 'a.all-curators', function () {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          filterVal = $tableWrapper.find('.dt-filter').val();
      $tableWrapper.find('.curator-select').val('0').trigger('change');
      $tableWrapper.find('.dt-filter').val(filterVal).trigger('change');
    })
    .on('click', 'td.crowdsourcing-template .DTE_Form_Buttons :first-child', function () {
      $(this).find('span, .fa-spin').toggle();
    });

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