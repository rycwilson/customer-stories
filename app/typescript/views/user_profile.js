export default {
  
  edit: {
    init() {
      console.log('init user profile')
    },
    addListeners() {
      // console.log('user profile listeners')
    }
  },

  addListeners() {
    this.edit.addListeners();
  }
  
}