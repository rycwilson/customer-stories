import TomSelect from 'tom-select';

// do not change the 'clear_button' name, else styles won't work
import clearButton from 'tom-select/dist/js/plugins/clear_button';

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
  plugins: {
    'clear_button': {
      title: 'Clear selection',
      // html: (config: object) => (`<button type="button" class="btn ${config.className}" title="${config.title}">&times;</button>`)
    }
  }
};