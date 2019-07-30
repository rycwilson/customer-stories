
import show from './show';
import edit from './edit';

export default {
  show: show,
  edit: edit,
  addListeners: () => {
    show.addListeners();
    edit.addListeners();
  }
}