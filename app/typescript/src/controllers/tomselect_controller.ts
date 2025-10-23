import { Controller } from "@hotwired/stimulus";
import type InvitationTemplateController from "./invitation_template_controller";
import TomSelect, { tsBaseOptions, addDynamicPlaceholder } from '../tomselect';
import type { TomOption, TomItem } from 'tom-select/dist/types/types/core.d.ts';
import { type CBOptions } from 'tom-select/dist/types/plugins/clear_button/types';
import { kebabize, capitalize } from "../utils";

export default class TomselectController extends Controller<TomSelectInput> {
  static outlets = ['invitation-template']
  declare readonly invitationTemplateOutlet: InvitationTemplateController;
  declare readonly hasInvitationTemplateOutlet: boolean;

  static values = { 
    kind: String,
    source: String,
    customOptions: { type: Object, default: {} },
    preventFocus: { type: Boolean, default: false },
    sortable: { type: Boolean, default: false },
    reset: { type: Boolean, default: false }
  };
  declare readonly kindValue: SelectInputKind | undefined;
  declare readonly sourceValue: string | undefined;
  declare readonly customOptionsValue: { [key: string]: any };
  declare readonly preventFocusValue: boolean;
  declare readonly sortableValue: boolean;
  declare readonly resetValue: boolean;

  declare ts: TomSelect;
  declare currentSearchResults: any[];

  connect() {
    // invitation templates from contributions table
    if (this.ts) {
      // console.log('ts already initialized ', this.element.closest('tr').id)
      return;    
    }
    this.init();

  }

  isFilter() { return this.kindValue === 'filter'; }

  get readableKind() {
    return !this.kindValue ? '' : this.kindValue.split(/(?=[A-Z])/).map(word => capitalize(word)).join(' ');
  }

  get kebabKind() { 
    return !this.kindValue ? '' : kebabize(this.kindValue as string); 
  }

  init() {
    this.ts = new TomSelect(this.element, {...tsBaseOptions, ...this.options, ...this.customOptionsValue });
  }

  resetValueChanged(shouldReset: boolean) {
    if (shouldReset) {
      this.ts.destroy();
      this.init();
    }
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

  get isMultiSelect() { return this.element.multiple;  }

  get isTagsInput() { return this.element.tagName === 'INPUT'; }

  get options() {
    const ctrl = this;  // `this` will be the TomSelect instance in the context of the options object
    return {
      render: {
        item(data: TomOption, escape: (str: string) => string) {
          return `
            <div class="${ctrl.isMultiSelect ? ctrl.kebabKind : ''}" data-source="${ctrl.sourceValue}">
              ${escape(data.text)}
            </div>
          `;
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
        if (ctrl.isMultiSelect || ctrl.isTagsInput) {
          _plugins['remove_button'] = { title: 'Clear selection' }
        } else {
          const tooltipOptions = {
            title: 'Clear selection',
            template: `
              <div class="tooltip ${ctrl.kebabKind}" role="tooltip">
                <div class="tooltip-arrow"></div>
                <div class="tooltip-inner"></div>
              </div>
            `
          };
          _plugins['clear_button'] = {
            title: 'Clear selection',
            html: (config: CBOptions) => `
              <button 
                type="button"
                class="btn ${config.className}"
                data-action="tomselect#onManualClear"
                data-controller="tooltip"
                data-tooltip-options-value='${ JSON.stringify(tooltipOptions) }'>
                &times;
              </button>
            `
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
        if (ctrl.isMultiSelect || ctrl.isTagsInput) addDynamicPlaceholder(this);
        // if (ctrl.sortableValue) $(this.control).sortable();

        if (this.preventFocusValue) this.ts.control_input.setAttribute('tabindex', '-1');

        if (ctrl.kindValue === 'invitationTemplate') {
          this.control_input.setAttribute('readonly', 'true');

          if (ctrl.hasInvitationTemplateOutlet) {
            const formCtrl = ctrl.invitationTemplateOutlet;
            const shouldConfirmClose = () => formCtrl.hasFormFieldsTarget && formCtrl.isDirty;
            const confirmClose = () => (
              window.confirm('Close this template? Unsaved changes will be lost.')
            );

            // Intercept a changed selection if the form is dirty
            const originalAddItem = this.addItem;
            this.addItem = function (value: string, silent?: boolean) {
              if (shouldConfirmClose() && !confirmClose()) {
                this.control_input.blur();
                return false;
              } else {
                return originalAddItem.call(this, value, silent);
              }
            }

            // Intercepting a clear...
            // Overriding `clear` is not reliable since it executes on both clearing and changing
            // Overriding `removeItem` is not reliable since it doesn't prevent `onChange`
            // => intercept clear button clicks
            const clearButton = this.wrapper.querySelector('.clear-button');
            if (clearButton) {
              clearButton.addEventListener('click', (e) => {
                if (shouldConfirmClose() && !confirmClose()) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  return false;
                }
              }, { capture: true });
            }
          }
        }
      },

      onItemRemove() {},
      
      onChange(newVal: string | number) {
        ctrl.dispatch(`change-${ctrl.kebabKind || 'unknown'}`, { detail: { kind: ctrl.kindValue, id: newVal } });
      },

      // According to docs, this callback executes when `.clear()` is called on the instance.
      // The native plugin code appears to trigger the callback when changing selections,
      // as if the existing selection must be cleared before the new selection is made. 
      // This is unexpected and must be worked around, since we need to know when the element 
      // is actually being cleared. 
      // Within the callback, the value will always be blank. By using a timeout, we can get 
      // the updated value after the change. If the value is still blank, then we know the
      // element was actually cleared.
      onClear() {
        setTimeout(() => {
          if (ctrl.ts.getValue() === '') {
            ctrl.dispatch('clear');
          }
        });
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
        // console.log(`onItemAdd(${value}, ${item})`);
      },

      // the following two callbacks apply to the company tags inputs
      onOptionAdd(this: TomSelect, value: string, option: TomOption) {
        if (this.control_input.id.includes('tags')) {
          // wait for the option element to render else getItem() will return null
          setTimeout(() => {
            const item = <HTMLElement>this.getItem(value);
            item.classList.toggle('to-be-added');
            ctrl.dispatch('add-tag', { detail: { tagName: value, source: item.dataset.source } });
          });
        }
      },

      onDelete(values: string[], e: PointerEvent) {
        // console.log('onDelete')
        if (e.target instanceof HTMLElement && e.target.closest('#company-tags-form')) {
          const [tagName] = values;
          const item = <HTMLElement>(<HTMLAnchorElement>e.target).closest('.item');
          if (item.classList.contains('to-be-added')) {
            ctrl.dispatch('add-tag', { detail: { tagName, source: item.dataset.source, cancel: true } });
            return true;  // allow the default behavior of removing the item
          } else {
            item.classList.toggle('to-be-removed');
            ctrl.dispatch('remove-tag', { detail: { tagName, source: item.dataset.source, cancel: !item.classList.contains('to-be-removed') } });
            return false;   // prevent the default behavior of removing the item
          }
        }
      }
    }
  }
}