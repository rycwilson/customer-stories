
import gallery from './gallery';
import show from './show';
import edit from './edit';
import dataTable from './data_table';

export default {
  gallery,
  show,
  edit,
  table: {
    init(deferred) {
      dataTable.init(deferred);
    }
  },
  addListeners() {
    gallery.addListeners();
    show.addListeners();
    edit.addListeners();
  }
}