import { Controller } from "@hotwired/stimulus"
import customerWinsTable from '../views/customer_wins/table.js';
import { getJSON } from '../util.js';

export default class extends Controller {
  static targets = ['curatorSelect', 'filterSelect'];
  static values = { dataPath: String };

  initialize() {
  }

  connect() {
    // console.log('connect customer wins')
    console.log('curatorSelect', this.curatorSelectTarget)
    console.log('filterSelect', this.filterSelectTarget)
    getJSON(this.dataPathValue).then(successes => {
      console.log('successes: ', successes)
      // customerWinsTable.init(successes);
      const panel = this.element.closest('[data-dashboard-target="tabPanel"]');
      this.dispatch('load', { detail: { panel, resourceClassName: 'customer-wins' }});
    })
  }

  searchTable(e) {
    console.log('searchTable', e.detail)
  }

  get dtData() {
    // return datatables data
  }
}