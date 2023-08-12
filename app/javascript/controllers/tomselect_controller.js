import { Controller } from "@hotwired/stimulus";
import { tsBaseOptions } from '../tomselect.js';

export default class extends Controller {
  static values = { type: String, customOptions: { type: Object, default: {} } };

  connect() {
    // console.log('tomselect connect')
    const ctrl = this;

    this.currentSearchResults = [];

    this.ts = new TomSelect(ctrl.element, Object.assign({}, tsBaseOptions, this.customOptionsValue, {
      render: {
        option(data, escape) {
          return data.value === '0' ?
            `<div class="create-contact">
              <i class="fa fa-plus"></i><span>${escape(data.text)}</span>
            </div>` :
            `<div>${escape(data.text)}</div>`
        },
        option_create(data, escape) {
          return `
            <div class="create">
              <i class="fa fa-plus"></i><span>New ${ctrl.typeValue}:</span>&nbsp;&nbsp;<span class="user-input">${escape(data.input)}</span>
            </div>
          `;
        } 
      },

      onInitialize() {
        ctrl.dispatch('did-initialize', { detail: ctrl.element })
      },

      onChange(newVal, oldVal) {
        ctrl.dispatch(`change-${ctrl.typeValue}`, { detail: { newVal } });
      },

      onType(userInput) { 
        console.log(`onType(${userInput})`)
        if (ctrl.isFilter()) ctrl.onSearch(); 
      },

      // 'this' refers to the TomSelect instance
      onFocus() {
        const dropdownMaxHeight = document.documentElement.clientHeight - this.wrapper.getBoundingClientRect().bottom;
        this.dropdown.children[0].style.maxHeight = `${dropdownMaxHeight - 15}px`;
      },

      onDropdownOpen(dropdown) {
        ctrl.dispatch('dropdown-did-open');
        if (ctrl.isFilter()) {
          // if a search string exists, manually set the current results
          if (this.getValue() === '0') this.currentResults.items = ctrl.currentSearchResults;
        }
      },

      onDropdownClose(dropdown) {
        if (ctrl.isFilter()) {
          // default behavior is that text input is cleared when the dropdown closes, 
          // but we want to keep it since the search results are reflected in the table
          // => accomplished by adding and selecting an option to match the search text
          if (!this.getValue() && this.lastQuery) {
            this.addOption({ value: 0, text: this.lastQuery }, true);   // true => option will be removed on clear
            this.addItem(0, true);    // true => don't trigger change event
          }
        }
      }
    }));
  }

  isFilter() { return this.typeValue === 'filter'; }

  onSearch() {
    this.currentSearchResults = this.ts.currentResults.items;
    const searchResults = this.ts.currentResults.items
      .map(item => item.id)
      .reduce((results, result) => {
        const column = result.slice(0, result.indexOf('-'));
        const id = result.slice(result.indexOf('-') + 1, result.length);
        if (!results[column]) results[column] = `${id}`
        else results[column] = `${results[column]}|${id}`;
        return results;
      }, {});
    console.log('searchResults', searchResults)
    this.dispatch('search', { detail: { searchResults }});
  }
}