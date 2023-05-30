import table from './table.js';

export default {
  init(contributions) {
    console.log('init contributors', contributions)
    table.init();
  },
  addListeners() {
    console.log('contributors listeners')
  }
}