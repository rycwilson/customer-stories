import TomSelect from 'tom-select';

// do not change the 'clear_button' name, else styles won't work
import clearButton from 'tom-select/dist/js/plugins/clear_button';
import { type CBOptions } from 'tom-select/dist/types/plugins/clear_button/types';

TomSelect.define('clear_button', clearButton);

export default TomSelect;


export interface TomselectOption { 
  $id: string; 
  $option: HTMLOptionElement; 
  $order: number; 
  disabled: boolean; 
  optgroup: HTMLOptGroupElement | undefined;
  slug: string;
  text: string;
  value: string;
}

export interface TomselectOptions { 
  [key: string]: TomselectOption 
};

export const tsBaseOptions = {
  maxOptions: 1000,
  closeAfterSelect: true,
  onInitialize() {
  },
};