import table from './table.js';

export default {
  init(successes) {
    console.log('init customer wins', successes)
    table.init(successes);
  },
  addListeners() {
    console.log('customer wins listeners')
  }
}