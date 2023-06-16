import tomSelect from 'tom-select/dist/js/tom-select.base.js';
window.TomSelect = tomSelect;

export const tsBaseOptions = {
  create: true,
  persist: false,
  maxOptions: null,
  closeAfterSelect: true,
  onInitialize() {
  },
  plugins: {
    'clear_button': {
      title: 'Clear selection',
      html: (config) => (`<button type="button" class="btn ${config.className}" title="${config.title}">&times;</button>`)
    }
  }
};