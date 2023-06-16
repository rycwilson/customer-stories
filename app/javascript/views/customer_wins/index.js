import table from './table.js';
import { showContributions, confirmDelete as deleteCustomerWin } from './actions.js';

export default {

  init(successes) {
    console.log('init customer wins', successes)
    table.init(successes);
  },

  addListeners() {
    // console.log('customer wins listeners')
    document.addEventListener('click', (e) => { 
      const isAction = e.target.closest('.actions.dropdown > ul') && e.target.role !== 'separator';
      if (isAction) handleAction(e); 
    });
  }

}

function handleAction({ target }) {
  const dt = table.dataTable();
  const tr = target.closest('tr');
  const row = dt.row(tr);
  const isViewContributions = target.closest('.view-contributions');
  const isDelete = target.closest('.delete-row');
  if (isViewContributions) {

    // can't search on successId given current setup of the table data
    // const contributionIds = $('#prospect-contributors-table').DataTable().rows().data().toArray()
    //   .filter(contribution => (
    //     contribution.success.id == successId &&
    //     (contribution.status && contribution.status.match(/(contribution|feedback)/))
    //   ))
    //   .map(contribution => contribution.id);
    // showContributions(e)
  } else if (isDelete) {
    deleteCustomerWin(row);
  }
}