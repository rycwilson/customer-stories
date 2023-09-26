import TomSelect from 'tom-select/dist/esm/tom-select.js';

// do not change the 'clear_button' name, else styles won't work
import clearButton from 'tom-select/dist/js/plugins/clear_button';

TomSelect.define('clear_button', clearButton);

export default TomSelect;

export const tsBaseOptions = {
  maxOptions: null,
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