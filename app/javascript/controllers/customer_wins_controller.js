import { Controller } from "@hotwired/stimulus"
import customerWinsTable from '../views/customer_wins/table.js';
import { getJSON } from '../util.js';

export default class extends Controller {
  static values = { dataPath: String };

  initialize() {
  }

  connect() {
    // console.log('connect customer wins')
    getJSON(this.dataPathValue).then(successes => {
      console.log('successes: ', successes)
      customerWinsTable.init(successes);
      // this.dataDidLoad = true;
      this.dispatch('load', { detail: { panelId: 'prospect', resourceClassName: 'customer-wins' }});
    })
  }
  
  get dtData() {
    // return datatables data
  }
}