import { Controller } from '@hotwired/stimulus';
import type CustomerWinController from './customer_win_controller';

export default class DatatableRowController<T> extends Controller<HTMLTableRowElement> implements StringIndexable {
  static targets = ['actionsDropdown'];

  static values = { 
    childRowTurboFrameAttrs: { type: Object, default: {} }, 
    rowData: Object 
  };
  // declare readonly childRowTurboFrameAttrsValue: { id: string, src: string };
  // declare readonly rowDataValue: T;

  connect(this: CustomerWinController) {
    // console.log('connect datatable row')
    //  Object.keys(this.rowDataValue).forEach(key => {
    //   // const field = key as keyof T;
    //   this[key]:  = this.rowDataValue[key];
    // });
    // this.actionsDropdownTarget.insertAdjacentHTML('afterbegin', this.actionsDropdownTemplate());
    // this.element.id = `${this.identifier}-${this.id}`;  // will be needed for win story outlet

  }


  // toggleChildRow(this: CustomerWinController) {
  //   if (!this.hasChildRowContent) return false;
  // }

  // get hasChildRowContent(this: CustomerWinController) {
  //   return this.childRowTurboFrameAttrsValue.id && this.childRowTurboFrameAttrsValue.src;
  // }

  deleteRow() {
  }
}