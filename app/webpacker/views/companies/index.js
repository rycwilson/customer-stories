
import prospect from './dashboard/prospect';
import curate from './dashboard/curate';
import promote from './dashboard/promote';
import measure from './dashboard/measure';

export default {
  dashboard: {
    init() {
      [prospect, curate, promote, measure].forEach((section) => section.init());
    },
    addListeners() {
      [prospect, curate, promote, measure].forEach((section) => section.addListeners());
    }
  },
  settings: {
    init() {
      console.log('companies.edit.init()');
    },
    addListeners() {
      console.log('companies.edit.addListeners()');
    }
  },
  addListeners() {
    this.dashboard.addListeners();
    this.settings.addListeners();
  }
}