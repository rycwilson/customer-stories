
// keep track of search columns so they can be cleared on each new search
let cwSearchColumn, conSearchColumn;

export function addListeners(e) {
  $(document)
    .on(
      'shown.bs.tab', 
      'a[href="#successes"], a[href*="contributors"], a[href="promoted-stories"]', 
      () => {
        // https://github.com/DataTables/Responsive/issues/40
        $( $.fn.dataTable.tables(true) ).css('width', '100%');
        $( $.fn.dataTable.tables(true) ).DataTable().columns.adjust().draw();
      }
    )
    .on('shown.bs.dropdown', '.actions.dropdown', onOpenActionsDropdown)
    .on('hidden.bs.dropdown', '.actions.dropdown', onClosedActionsDropdown)

    // transition the Add button with the respective tab pane
    .on(
      'hide.bs.tab shown.bs.tab', 
      'a[href="#successes"], a[href="#prospect-contributors"], a[href="#story-contributors"]', 
      (e) => $(e.target).find('.btn-add').toggleClass('shown')
    )

    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on(
      'change', 
      '#toggle-group-by-customer, #toggle-group-by-success', 
      toggleGroupedTableDisplay
    )
}

// TODO - how to chain a global search on top of a column (e.g. curator) search 
// https://datatables.net/forums/discussion/40164/search-in-multiple-columns
export function autoSearch(e) {
  const $input = $(this);
  const $table = $('.select2-selection[aria-activedescendant]')
                    .closest('.dataTables_wrapper')
                      .find('table');
  setSearch($table, false, $input.val()).draw();
}

export function setSearch($table, useRegExSearch, searchStr) {
  const dt = $table.DataTable();
  const $tableWrapper = $table.closest('.dataTables_wrapper');
  const curatorId = $tableWrapper.find('.curator-select').val();
  const filterCol = $tableWrapper.find('.dt-filter option:selected').data('column');
  const filterVal = searchStr ? 
    searchStr :
    ( $tableWrapper.find('.dt-filter option:selected').val() === '' ? 
        '' :
        $tableWrapper.find('.dt-filter option:selected').text().trim() );

  // set curator
  let dtSearch = dt.search('')
                   .column('curator:name')
                   .search(!curatorId ? '' : '^' + curatorId + '$', true, false);

  if ($table.is($('#successes-table'))) {

    // clear last column search, and keep track of current search
    dtSearch = dtSearch.column(`${ cwSearchColumn }:name`).search('');
    cwSearchColumn = filterCol;
    
    // incorporate checkbox filters
    dtSearch = dtSearch
      .column('story:name')
      .search($('#show-wins-with-story').prop('checked') ? '' :  '^false$', true, false);

  } else if ($table.is($('#contributors-table'))) {

    // clear last column search, and keep track of current search
    dtSearch = dtSearch.column(`${ conSearchColumn }:name`).search('');
    conSearchColumn = filterCol;

    // incorporate checkbox filters
    dtSearch = dtSearch
      .column('status:name')
      .search($('#show-completed').prop('checked') ? '' : '^((?!completed).)*$', true, false)
      .column('storyPublished:name')
      .search($('#show-published').prop('checked') ? '' : 'false');
  }

  // search a column
  if (filterVal !== '') {
    if (useRegExSearch) {
      dtSearch = dtSearch.column(filterCol + ':name').search('^' + filterVal + '$', true, false);
    } else {
      dtSearch = dtSearch.column(filterCol ? `${ filterCol }:name` : '').search(filterVal);
    }
  }
  return dtSearch;
}

export function displayResults(e) {
  const $table = $(this);
  const $tableWrapper = $table.closest('.dataTables_wrapper');
  const curatorId = $tableWrapper.find('.curator-select').val();
  const mesg = $table.find('td.dataTables_empty').text();
  let timer;
  
  // need a timer as there are multiple draw events that occur in quick succession
  clearTimeout(timer);
  timer = setTimeout(function () {
    if ($tableWrapper.find('td.dataTables_empty').length &&  // no records
        curatorId !== '' &&               // curator is selected
        $tableWrapper.find('td.dataTables_empty a').length === 0) {
      $tableWrapper.find('td.dataTables_empty').html(
        '<span style="line-height:25px">' + mesg + '</span><br>' +
        '<span style="line-height:25px">Try searching <a href="javascript:;" class="all-curators">All Curators</a></span>'
      );
    }
    $tableWrapper
      .find('.select-filters')
        .find('.dataTables_info')
          .remove()
          .end()
        .append(
          $tableWrapper.children('.dataTables_info')
                          .clone()
                          .addClass('help-block text-right')
                          .text(function () {
                            return $(this).text().replace(/\sentries/g, '');
                          })
        );
  }, 1);
}

export function toggleChildRow(template, callback) {
  return function (e) {
    const $btn = $(this);
    const $tr = $btn.parent();
    const $table = $btn.closest('table');
    const dt = $table.DataTable();
    dt.row($tr).child.isShown() ? 
      confirmUnsavedChanges(dt, $tr) : 
      openChildRow($table, dt, $tr, template, callback);
  }
}

export function scrollToChildRow() {
  const $tr = $('tr.shown');
  const rowHeight = $tr.outerHeight() + $tr.next().outerHeight();
  window.scrollTo(
    0, 
    $tr.offset().top - (window.innerHeight / 2) + ((rowHeight) / 2)
  );
}

function onOpenActionsDropdown(e) {
  const $dropdownMenu = $(this).find('.dropdown-menu');
  const windowBottom = window.scrollY + window.innerHeight;
  const dropdownBottom = $dropdownMenu.offset().top + $dropdownMenu.outerHeight();
  $(this).closest('tr').addClass('active');
  $dropdownMenu.addClass(`shown ${ dropdownBottom > windowBottom ? 'flip' : '' }`);
}

function onClosedActionsDropdown(e) {
  const $dropdown = $(this);
  $dropdown.find('.dropdown-menu').removeClass('flip shown');
  
  // don't remove .active if the child row is open
  if (!$dropdown.closest('tr').hasClass('shown')) {
    $dropdown.closest('tr').removeClass('active');
  } 
}

function toggleGroupedTableDisplay(e) {
  const $table = $(this).closest('.dataTables_wrapper').find('table');
  $table.find('.dtrg-group').toggle();
  $table.toggleClass('table-striped');
  if ($table.hasClass('table-striped')) {
    $table
      .find('tr:not(.dtrg-group)')
        .each((index, tr) => {
          $(tr)
            .removeClass('even odd')
            .addClass(index % 2 === 0 ? 'even' : 'odd')
            
            // reset the hover behavior, lest the new background color override bootstrap
            .hover(
              (e) => $(tr).css('background-color', '#f5f5f5'),
              (e) => $(tr).css('background-color', index % 2 === 0 ? '#fff' : '#f9f9f9')
            );
        })
        .end()
      .find('tr.even:not(.dtrg-group)').css('background-color', '#fff').end()
      .find('tr.odd:not(.dtrg-group)').css('background-color', '#f9f9f9');
  } else {
    $table
      .find('tr:not(.dtrg-group)').css('background-color', '#fff').end()
      .find('tr:not(.dtrg-group)')
        .each((index, tr) => {
          $(tr)
            .removeClass('even odd')
            .hover(
              (e) => $(tr).css('background-color', '#f5f5f5'),
              (e) => $(tr).css('background-color', '#fff')
            );
        });
  }
}

function openChildRow($table, dt, $tr, template, callback) {
  let $trChild;
  const rowData = dt.row($tr).data();
  const enableSubmit = (e) => {
    e.data.$trChild.find('button[type="submit"]').prop('disabled', false);
  };
  closeOtherChildRows($table, dt, $tr);
  dt.row($tr).child( template(rowData) ).show();
  $trChild = $tr.next();
  $tr.addClass('shown active');
  scrollToChildRow();
  if (typeof callback === 'function') callback(rowData);

  // enable submit button on input
  // TODO move this code to the form
  $trChild.one('input', { $trChild: $trChild }, enableSubmit)
}

function closeChildRow(dt, $tr) {
  dt.row($tr).child.hide();
  $tr.removeClass('shown active');
}

function closeOtherChildRows($table, dt, $tr) {
  $table.find('tr[role="row"]').not($tr).each((index, tr) => {
    if (dt.row(tr).child.isShown()) {
      dt.row(tr).child.hide();
      $(tr).removeClass('shown active');
      $(tr).children('td.toggle-child-row').children().toggle();
    }
  });
}

// TODO confirmation dialogue
function confirmUnsavedChanges(dt, $tr) {
  // const unsavedChanges = typeof $('#win-story-editor').data('summernote') === 'object' && !$form.find('button[type="submit"]').prop('disabled');
  const unsavedChanges = false;  
  if (!unsavedChanges) {
    closeChildRow(dt, $tr);
  } else {
    // bootbox.confirm({
    //   size: 'small',
    //   className: 'confirm-unsaved-changes',
    //   closeButton: false,
    //   message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Unsaved changes will be lost</span>",
    //   buttons: {
    //     confirm: {
    //       label: 'Continue',
    //       className: 'btn-default'
    //     },
    //     cancel: {
    //       label: 'Cancel',
    //       className: 'btn-default'
    //     }
    //   },
    //   callback: function (continueWithoutSave) {
    //     if (continueWithoutSave) {
    //       closeNestedRow();
    //     }
    //   }
    // });
  }
}