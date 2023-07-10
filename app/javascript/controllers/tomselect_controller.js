import { Controller } from "@hotwired/stimulus";
import { tsBaseOptions } from '../tomselect.js';

export default class extends Controller {
  static values = { type: String };

  connect() {
    // console.log('tomselect connect')
    const ctrl = this;

    this.currentSearchResults = [];

    this.ts = new TomSelect(ctrl.element, Object.assign({}, tsBaseOptions, {
      onInitialize() {
        if (ctrl.typeValue === 'Contributor') {
        }
      },
      onChange(newVal) {
        ctrl.dispatch(`change-${ctrl.typeValue}`, { detail: { newVal } });
      },
      onType() { 
        if (ctrl.isFilter()) ctrl.onSearch(); 
      },

      // 'this' refers to the TomSelect instance
      onFocus() {
        const dropdownMaxHeight = document.documentElement.clientHeight - this.wrapper.getBoundingClientRect().bottom;
        this.dropdown.children[0].style.maxHeight = `${dropdownMaxHeight - 15}px`;
      },
      onDropdownOpen(dropdown) {
        ctrl.dispatch('dropdown-open');
        if (ctrl.isFilter()) {
          // if a search string exists, manually set the current results
          if (ctrl.ts.getValue() === '0') ctrl.ts.currentResults.items = ctrl.currentSearchResults;
        }
      },
      onDropdownClose(dropdown) {
        if (ctrl.isFilter()) {
          // default behavior is that text input is cleared when the dropdown closes, 
          // but we want to keep it since the search results are reflected in the table
          // => accomplished by adding and selecting an option to match the search text
          if (!ctrl.ts.getValue() && ctrl.ts.lastQuery) {
            ctrl.ts.addOption({ value: 0, text: ctrl.ts.lastQuery }, true);   // true => option will be removed on clear
            ctrl.ts.addItem(0, true);    // true => don't trigger change event
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
    this.dispatch('search', { detail: { searchResults }});
  }
}