import TomSelect from 'tom-select';
import clearButton from 'tom-select/dist/js/plugins/clear_button';
import removeButton from 'tom-select/dist/js/plugins/remove_button';
import dragDrop from 'tom-select/dist/js/plugins/drag_drop';

// do not change the 'clear_button' name, else styles won't work
TomSelect.define('clear_button', clearButton);
TomSelect.define('remove_button', removeButton);
TomSelect.define('drag_drop', dragDrop);

export default TomSelect;

export const addMultiSelectPlaceholder = (ts: TomSelect) => {
  if (ts.input.dataset.dynamicPlaceholder) {
    // set placeholder via css => allows for removing when selections are present
    ts.control.setAttribute('data-placeholder', ts.input.dataset.dynamicPlaceholder);
  }
}

export const tsBaseOptions = {
  maxOptions: 1000,
  closeAfterSelect: true,
  onInitialize(this: TomSelect) {
  },
  onFocus(this: TomSelect) {
    const listbox = <HTMLElement>this.dropdown.firstElementChild;
    const dropdownMaxHeight = document.documentElement.clientHeight - this.wrapper.getBoundingClientRect().bottom;
    listbox.style.maxHeight = `${dropdownMaxHeight - 15}px`;
  },
};