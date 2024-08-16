//= require ./contributor_child_row
//= require ./contributor_actions/contributor_actions

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
  successActionsListeners();
  contributorChildRowListeners();
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

    // the close event happens shortly after blur; to ensure smooth transition...
    .on('blur', 'td.invitation-template', function () {
      var $td = $(this), editor;
      if ( $td.closest('table').is('#prospect-contributors-table') ) {
        editor = prospectContributorsEditor;
      } else {
        editor = curateContributorsEditor;
      }
      editor.one('close', function () {
        $td.removeClass('editor-is-open');
      });
    })

    .on('click', 'td.invitation-template', function (e) {
      var $row = $(this).parent(),
          workflowStage = $(this).closest('table').attr('id').match(/^(\w+)\-/)[1];
      // don't allow template change if request already sent (or re-sent)
      // (see createdRow property of datatables config)
      if ( $(this).hasClass('disabled') ) { return false; }
      $(this).addClass('editor-is-open');  // styling adjustment
      if (workflowStage === 'prospect') {
        openContributorsEditor(prospectContributorsEditor, $row);
      } else {
        openContributorsEditor(curateContributorsEditor, $row);
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
    // .on('click', 'div.success-child-row button[type="reset"], ' +
    //              'div.contributor-child-row button[type="reset"]', function () {
    //     $(this).closest('tr').prev().find('#successes-table td.toggle-child, [id*="contributors-table"] td.toggle-contributor-child').trigger('click');
    //   })

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
      $tableWrapper.find('.curator-select').val('').trigger('change');
      $tableWrapper.find('.dt-filter').val(filterVal).trigger('change');
    })
    .on('click', 'td.invitation-template .DTE_Form_Buttons :first-child', function () {
      $(this).find('span, .fa-spin').toggle();
    });

}

/**
 * presently, this is only called after a new success, contributor, or story is submitted
 * (meant to update options to include any new success or contributor)
 * => expand to new stories?
 */
function updateSelectOptions (company, successes) {
  var emptyOptions = function (modalIsOpen, $modal) {
        if (modalIsOpen) {
          $('.dt-filter').find('optgroup').empty();
          $('#curate-filters').find('select.customer option:not([value=""])').remove();
          $('.modal:not(.in) #new-success-form select:not(.curator), ' +
            '.modal:not(.in) #new-contributor-form select:not(.invitation-template), ' +
            '.modal:not(.in) #new-story-form select:not(.story-tags)' )
            .find('option:not([value=""]):not([value="0"])').remove();

        } else {
          $modal
            .find('select:not(.curator):not(.invitation-template):not(.story-tags) option:not([value=""]):not([value="0"])')
            .remove();
        }
      },
      resetSelect2 = function (modalIsOpen, $modal) {
        if (modalIsOpen) {
          $('select:not(.modal.in select)').each(function () {
            if ($(this).data('select2')) $(this).select2('destroy');
          });
          initSelect2();  // will ignore select boxes in an open modal
        } else {
          $modal.find('select.customer, select.success').select2({
            theme: "bootstrap",
            tags: true,  // to allow custom input
            // selectOnClose: true,
            placeholder: 'Select or Create',
          });
          $modal.find('select.referrer, select.contributor').select2({
            theme: 'bootstrap',
            placeholder: 'Select or Create'
          });
        }
      },
      updateSuccessOptions = function (modalIsOpen, $modal) {
        if (modalIsOpen) {
          successes.forEach(function (success) {
            $('.dt-filter optgroup[label="Customer Win"]')
              .append('<option value="success-' + success.id + '" data-column="success">' + success.name + '</option>');
            $('select.success:not(.modal.in select)')
              .append('<option value="' + success.id + '">' + success.name + '</option>');
          });
        } else {
          var $select = $modal.find('select.success');
          successes.forEach(function (success) {
            $select.append('<option value="' + success.id + '">' + success.name + '</option>');
          });
        }
      },
      updateCustomerOptions = function (modalIsOpen, $modal) {
        if (modalIsOpen) {
          company.customers.forEach(function (customer) {
            $('.dt-filter optgroup[label="Customer"]')
              .append('<option value="customer-' + customer.id + '" data-column="customer">' + customer.name + '</option>');
            $('select.customer:not(.modal.in select)')
              .append('<option value="' + customer.id + '">' + customer.name + '</option>');
          });
        } else {
          var $select = $modal.find('select.customer');
          company.customers.forEach(function (customer) {
            $select.append('<option value="' + customer.id + '">' + customer.name + '</option>');
          });
        }
      },
      updateReferrerOptions = function (modalIsOpen, $modal) {
        if (modalIsOpen) {
          company.referrers.forEach(function (referrer) {
            $('select.referrer:not(.modal.in select)')
              .append('<option value="' + referrer.id + '">' + referrer.full_name + '</option>');
          });
        } else {
          var $select = $modal.find('select.referrer');
          company.referrers.forEach(function (referrer) {
            $select.append('<option value="' + referrer.id + '">' + referrer.full_name + '</option>');
          });
        }
      };
      updateContributorOptions = function (modalIsOpen, $modal) {
        var contributors = _.filter(company.contributors, function (contributor) {
            return !_.findWhere(company.referrers, contributor) && !_.findWhere(company.curators, contributor);
          });
        if (modalIsOpen) {
          contributors.forEach(function (contributor, index) {
            $('#contributors-filter optgroup[label="Contributor"]')
              .append('<option value="contributor-' + contributor.id + '" data-column="contributor">' + contributor.full_name + '</option>');
            $('select.contributor:not(.modal.in select)')
              .append('<option value="' + contributor.id + '">' + contributor.full_name + '</option>');
          });
        } else {
          var $select = $modal.find('select.contributor');
          contributors.forEach(function (contributor, index) {
            $select.append('<option value="' + contributor.id + '">' + contributor.full_name + '</option>');
          });
        }
      };

  if ($('.modal.in').length) {
    emptyOptions(true);
    updateSuccessOptions(true);
    updateCustomerOptions(true);
    updateReferrerOptions(true);
    updateContributorOptions(true);
    resetSelect2(true);
    $('.modal.in').one('hidden.bs.modal', function (e) {
      e.stopImmediatePropagation();  // halt the usual modal reset actions
      emptyOptions(false, $('.modal.in'));
      updateSuccessOptions(false, $('.modal.in'));
      updateCustomerOptions(false, $('.modal.in'));
      updateReferrerOptions(false, $('.modal.in'));
      updateContributorOptions(false, $('.modal.in'));
      resetSelect2(false, $('.modal.in'));
      $(this).trigger('hidden.bs.modal');  // trigger usual modal reset actions
    });
  } else {
    // should not get here, only a new success/contributor/story form submission will trigger updateSelectOptions()
  }
}