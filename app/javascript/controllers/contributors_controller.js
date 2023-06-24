import { Controller } from "@hotwired/stimulus"
import contributorsTable from '../views/contributors/table.js';
import { getJSON } from '../util.js';

export default class extends Controller {
  static values = { dataPath: String };

  initialize() {
  }

  connect() {
    // console.log('connect customer wins')
    getJSON(this.dataPathValue).then(contributions => {
      console.log('contributions: ', contributions)
      contributorsTable.init(contributions);
      this.dispatch('load', { detail: { panelId: 'prospect', resourceClassName: 'contributors' }})
    })
  }

  get dtData() {
    // return datatables data
  }
}