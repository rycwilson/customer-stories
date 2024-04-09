import TomSelect from 'tom-select';

// do not change the 'clear_button' name, else styles won't work
import clearButton from 'tom-select/dist/js/plugins/clear_button';
import { type CBOptions } from 'tom-select/dist/types/plugins/clear_button/types';

TomSelect.define('clear_button', clearButton);

export default TomSelect;

export const tsBaseOptions = {
  maxOptions: 1000,
  closeAfterSelect: true,
  onInitialize() {
  },
  onFocus(this: TomSelect) {
    const listbox = <HTMLElement>this.dropdown.firstElementChild;
    const dropdownMaxHeight = document.documentElement.clientHeight - this.wrapper.getBoundingClientRect().bottom;
    listbox.style.maxHeight = `${dropdownMaxHeight - 15}px`;
  },
};