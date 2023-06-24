import { Controller } from "@hotwired/stimulus"
import contributorsTable from '../views/contributors/table.js';
import { getJSON } from '../util.js';

export default class extends Controller {
  static values = { dataPath: String };

  initialize() {
  }

  connect() {
    console.log('curatorId', this.curatorIdValue)
    // console.log('connect customer wins')
    getJSON(this.dataPathValue).then(contributions => {
      console.log('contributions: ', contributions)
      // contributorsTable.init(contributions);
      const panel = this.element.closest('[data-dashboard-target="tabPanel"]');
      this.dispatch('load', { detail: { panel, resourceClassName: 'contributors' }})
    })
  }

  get dtData() {
    // return datatables data
  }
}