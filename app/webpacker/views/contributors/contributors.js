
import Cookies from 'js-cookie';
import { setSearch, toggleChildRow } from '../dashboard/tables';
import conTable from './con_table';
import conForm from './con_form';
import childRowTemplate from './con_child_row';
import { badgeObserver } from 'lib/linkedin';
import { addListeners as addActionsDropdownListeners } from './con_actions';

export default {
  addListeners() {
    addActionsDropdownListeners();
    conForm.addListeners();
    $(document)
      .on('click', '#contributors-table .dtrg-group', sortTable)
      .on('click', '#contributors-table .dtrg-group a', linkToCustomerWinOrStory)
      .on('change', '#show-published, #show-completed', (e) => {
        setSearch($('#contributors-table'), true).draw();
      })
      .on(
        'click', 
        '#contributors-table td.toggle-child-row', 
        toggleChildRow(childRowTemplate, addBadgeObserver)
      )
  },  
  initForm() {
    conForm.init();
  },
  table: {
    init(deferred) {
      conTable.init(deferred);
    },
    renderHeader(curators, successes, customers, contributors) {
      $('#contributors-table').closest('[id*="table_wrapper"]').prepend(
        conTable.headerTemplate(curators, successes, customers, contributors)
      );
    },
  },
}

function addBadgeObserver(contribution) {

  badgeObserver(
    $(`tr[data-contribution-id="${ contribution.id }"]`)
      .next()
      .find('.LI-profile-badge')
  );
}

function linkToCustomerWinOrStory (e) {
  const $link = $(this);
  e.stopPropagation();  // don't sort by row group
  if ($link.hasClass('success')) {
    const successId = $link.closest('tr').next().data('success-id');
    $('a[href="#successes"]').tab('show');
    $('#successes-filter').val(`success-${ successId }`).trigger('change');
  } else {
    Cookies.set('cs-edit-story-tab', '#story-contributors');
  }
}

// TODO remove dependence on lastContributorsSortDirection variable
function sortTable(e) {
  console.log(columnIndices.customer)
  // const $table = $('#contributors-table');
  // const dt = $table.DataTable();    
  // const currentSortColumn = dt.order()[0][0];
  // const currentSortDirection = dt.order()[0][1];
  // let direction;
  // if (currentSortColumn === tableIndices.customer) {
  //   direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
  // } else if (currentSortColumn === tableIndices.invitationTemplate) {
  //   direction = lastContributorsSortDirection;
  //   $table.find('th[aria-label*="Invitation"]').removeClass('sorting_asc sorting_desc').addClass('sorting');
  // } else if (currentSortColumn === statusIndex) {
  //   direction = lastContributorsSortDirection;
  //   $table.find('th[aria-label*="Status"]').removeClass('sorting_asc sorting_desc').addClass('sorting');
  // }
  // dt.order([
  //     [tableIndices.customer, direction], 
  //     [tableIndices.success, 'asc'], 
  //     [contributorIndex, 'desc']
  //   ])
  //   .draw();
  // lastContributorsSortDirection = direction;
}