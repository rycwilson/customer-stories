import gallery from './gallery';
import newStoryForm from './new_story';
import show from './show';
import edit from './edit';
import dataTable from './data_table';

export default {
  gallery,
  newStoryForm,
  show,
  edit,
  table: {
    init(deferred) {
      dataTable.init(deferred);
    }
  },
  addListeners() {
    gallery.addListeners();
    newStoryForm.addListeners();
    show.addListeners();
    edit.addListeners();
  }
}