import { Controller } from "@hotwired/stimulus";
import { tsBaseOptions } from '../tomselect.js';

export default class extends Controller {
  static values = { type: String }

  connect() {
    console.log('tomselect connect')
    this.currentSearchResults = [];
    this.ts = new TomSelect(this.element, Object.assign({}, tsBaseOptions, {
      // use arrow functions so 'this' refers to the controller
      onChange: (newVal) => {
        this.dispatch(`change-${this.typeValue}`, { detail: { newVal } });
      },
      onType: () => { if (this.isFilter()) this.onSearch(); },
      onDropdownOpen: (dropdown) => {
        // TODO: adjust size to fit viewport height
        if (this.isFilter()) {
          // if a search string exists, manually set the current results
          if (this.ts.getValue() === '0') this.ts.currentResults.items = this.currentSearchResults;
        }
      },
      onDropdownClose: (dropdown) => {
        if (this.isFilter()) {
          // default behavior is that text input is cleared when the dropdown closes, 
          // but we want to keep it since the search results are reflected in the table
          // => accomplished by adding and selecting an option to match the search text
          if (!this.ts.getValue() && this.ts.lastQuery) {
            this.ts.addOption({ value: 0, text: this.lastQuery }, true);   // true => option will be removed on clear
            this.ts.addItem(0, true);    // true => don't trigger change event
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