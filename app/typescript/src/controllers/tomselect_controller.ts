import { Controller } from "@hotwired/stimulus";
import TomSelect, { tsBaseOptions, addMultiSelectPlaceholder } from '../tomselect';
import type { TomOption, TomItem } from 'tom-select/dist/types/types/core.d.ts';
import { type CBOptions } from 'tom-select/dist/types/plugins/clear_button/types';
import { kebabize, capitalize } from "../utils";

export default class extends Controller<TomSelectInput> {
  static values = { 
    kind: String, 
    customOptions: { type: Object, default: {} },
    preventFocus: { type: Boolean, default: false },
    sortable: { type: Boolean, default: false }
  };
  declare readonly kindValue: SelectInputKind | undefined;
  declare readonly customOptionsValue: { [key: string]: any };
  declare readonly preventFocusValue: boolean;
  declare readonly sortableValue: boolean;

  declare ts: TomSelect;
  declare currentSearchResults: any[];

  connect() {
    // invitation templates from contributors table
    if (this.ts) {
      // console.log('ts already initialized ', this.element.closest('tr').id)
      return;    
    }
    this.ts = new TomSelect(this.element, {...tsBaseOptions, ...this.options, ...this.customOptionsValue });
    if (this.preventFocusValue) this.ts.control_input.setAttribute('tabindex', '-1');
  }

  isFilter() { return this.kindValue === 'filter'; }

  get readableKind() {
    return !this.kindValue ? '' : this.kindValue.split(/(?=[A-Z])/).map(word => capitalize(word)).join(' ');
  }

  get kebabKind() { 
    return !this.kindValue ? '' : kebabize(this.kindValue as string); 
  }

  dispatchSearchResults() {
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

  get isMultiSelect() { return this.element.type === 'select-multiple'; }

  get options() {
    const ctrl = this;  // "this" will be the TomSelect instance in the context of the options object
    return {
      render: {
        item(data: TomOption, escape: (str: string) => string) {
          return `<div class="${ctrl.isMultiSelect ? ctrl.kebabKind : ''}">${escape(data.text)}</div>`;
          // return ctrl.isMultiSelect ? `
          //     <div>
          //       <div>
          //         <div>${escape(data.text)}</div>
          //       </div>
          //       <button type="button" class="btn clear-button" title="Clear selection">&times;</button>
          //     </div>
          //   ` :
          //   `<div>${escape(data.text)}</div>`;
        },
        option(data: TomOption, escape: (str: string) => string) {
          return data.value === '0' ?
            `<div class="create-contact">
              <i class="fa fa-plus"></i><span>${escape(data.text)}</span>
            </div>` :
            `<div>${escape(data.text)}</div>`
        },
        option_create(data: TomOption, escape: (str: string) => string) {
          return `
            <div class="create">
              <i class="fa fa-plus"></i><span>New ${ctrl.readableKind}:</span>&nbsp;&nbsp;<span class="user-input">${escape(data.input)}</span>
            </div>
          `;
        } 
      },
      
      plugins: (() => {
        const _plugins: { [key: string]: object } = {};
        if (ctrl.isMultiSelect) {
          _plugins['remove_button'] = { title: 'Clear selection' }
        } else {
          _plugins['clear_button'] = {
            title: 'Clear selection',
            html: (config: CBOptions) => (
              `<button type="button" class="btn ${config.className}" title="${config.title}">&times;</button>`
            ) 
          }
        }
        if (ctrl.sortableValue) _plugins['drag_drop'] = {};        
        return _plugins;
      })(),

      createFilter(input: string) {
        // don't add the new template name to the list
        window.setTimeout(() => delete ctrl.ts.options[`${input}`]);
        return true;
      },

      onInitialize(this: TomSelect) {
        ctrl.dispatch('did-initialize', { detail: ctrl.element });
        if (ctrl.isMultiSelect) addMultiSelectPlaceholder(this);
        // if (ctrl.sortableValue) $(this.control).sortable();

        // prevent the user from closing a template without confirmation
        if (ctrl.kindValue === 'invitationTemplate') {
          const originalDeleteSelection = this.deleteSelection;
          this.deleteSelection = (e) => {
            if (window.confirm('Close this template? Unsaved changes will be lost.')) {
              originalDeleteSelection.call(this, e);
              return true;
            } else {
              return false;
            }
          }
        }
      },
  
      onChange(newVal: string | number) {
        ctrl.dispatch(`change-${ctrl.kebabKind || 'unknown'}`, { detail: { kind: ctrl.kindValue, id: newVal } });
      },
  
      onType(this: TomSelect, userInput: string) { 
        if (ctrl.isFilter()) ctrl.dispatchSearchResults(); 
        if (this.settings.create && userInput) {
          const optionExists = Object.values(this.options).find(option => option.text === userInput);
          (this.dropdown_content.querySelector(':scope > .create') as HTMLDivElement)
            .style.display = optionExists ? 'none' : '';
        } 
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
        this.element
        if (ctrl.isFilter()) {
          // default behavior is that text input is cleared when the dropdown closes, 
          // but we want to keep it since the search results are reflected in the table
          // => accomplished by adding and selecting an option to match the search text
          if (!this.getValue() && this.lastQuery) {
            this.addOption({ value: 0, text: this.lastQuery }, true);   // true => option will be removed on clear
            this.addItem('0', true);    // true => don't trigger change event
          }
        }
      },

      onItemAdd(this: TomSelect, value: string, item: TomItem) {
      }
    }
  }
}