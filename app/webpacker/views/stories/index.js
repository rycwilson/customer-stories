
import gallery from './gallery';
import show from './show';
import edit from './edit';

export default {
  gallery,
  show,
  edit,
  addListeners() {
    gallery.addListeners();
    show.addListeners();
    edit.addListeners();
  }
};