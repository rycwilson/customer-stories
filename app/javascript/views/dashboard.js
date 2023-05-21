import prospect from './prospect';

export default {
  addListeners() {
    [prospect].forEach(panel => panel.addListeners())
  }
}