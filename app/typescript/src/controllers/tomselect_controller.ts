import { Controller } from "@hotwired/stimulus";
import TomSelect, { tsBaseOptions, type TomselectOptions } from '../tomselect';
import type { TomInput, TomOption } from 'tom-select/dist/types/types/core.d.ts';
// import type { TomSettings } from 'tom-select/dist/types/types/settings.d.ts'

export default class extends Controller<TomInput> {
  static values = { type: String, customOptions: { type: Object, default: {} } };
  declare readonly typeValue: 'filter' | 'curator' | 'status' | 'customer' | 'category' | 'product';
  declare readonly customOptionsValue: { [key: string]: any };

  declare ts: TomSelect;
  declare currentSearchResults: any[];

  connect() {
    // console.log('tomselect connect')
    const ctrl = this;

    const options = {
      render: {
        option(data: TomOption, escape: (str : string) => string) {
          return data.value === '0' ?
            `<div class="create-contact">
              <i class="fa fa-plus"></i><span>${escape(data.text)}</span>
            </div>` :
            `<div>${escape(data.text)}</div>`
        },
        option_create(data: TomOption, escape: (str : string) => string) {
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
  
      onChange(newVal: string | number) {
        ctrl.dispatch(`change-${ctrl.typeValue}`, { detail: { type: ctrl.typeValue, id: newVal } });
      },
  
      onType(userInput: string) { 
        if (ctrl.isFilter()) ctrl.onSearch(); 
      },
  
      onFocus(this: TomSelect) {
        const listbox = this.dropdown.firstElementChild as HTMLDivElement;
        const dropdownMaxHeight = document.documentElement.clientHeight - this.wrapper.getBoundingClientRect().bottom;
        listbox.style.maxHeight = `${dropdownMaxHeight - 15}px`;
      },
  
      onDropdownOpen(this: TomSelect, dropdown: HTMLDivElement) {
        ctrl.dispatch('dropdown-did-open');
        if (ctrl.isFilter()) {
          // if a search string exists, manually set the current results
          if (this.getValue() === '0') {
            if (ctrl.currentSearchResults) {
              this.currentResults!.items = ctrl.currentSearchResults;
            }
          }
        }
      },
  
      onDropdownClose(this: TomSelect, dropdown: HTMLDivElement) {
        if (ctrl.isFilter()) {
          // default behavior is that text input is cleared when the dropdown closes, 
          // but we want to keep it since the search results are reflected in the table
          // => accomplished by adding and selecting an option to match the search text
          if (!this.getValue() && this.lastQuery) {
            this.addOption({ value: 0, text: this.lastQuery }, true);   // true => option will be removed on clear
            this.addItem('0', true);    // true => don't trigger change event
          }
        }
      }
    }

    this.ts = new TomSelect(ctrl.element, {...tsBaseOptions, ...this.customOptionsValue, ...options });
  }

  isFilter() { return this.typeValue === 'filter'; }

  onSearch() {
    this.currentSearchResults = this.ts.currentResults!.items;
    interface SearchResults { [key: string]: string };
    const searchResults = this.ts.currentResults!.items
      .map(item => item.id)
      .reduce((results: SearchResults, _result) => {
        const result = _result as string;
        const column = result.slice(0, result.indexOf('-'));
        const id = result.slice(result.indexOf('-') + 1, result.length);
        if (!results[column]) results[column] = `${id}`
        else results[column] = `${results[column]}|${id}`;
        return results;
      }, {});
    this.dispatch('search', { detail: { searchResults }});
  }
}