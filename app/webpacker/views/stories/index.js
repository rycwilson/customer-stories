
import gallery from './gallery';
import show from './show';
import edit from './edit';

export default {
  gallery: gallery,
  show: show,
  edit: edit,
  addListeners: () => {
    gallery.addListeners();
    show.addListeners();
    edit.addListeners();
  }
};