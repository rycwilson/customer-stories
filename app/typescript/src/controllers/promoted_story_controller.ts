import { Controller } from '@hotwired/stimulus';
import type ResourceController from './resource_controller.js';
import type ModalController from './modal_controller.js';

export default class PromotedStoryController extends Controller<HTMLTableRowElement> {
  static outlets = ['resource', 'modal'];
  declare readonly resourceOutlet: ResourceController;
  declare readonly modalOutlet: ModalController;

  static targets = ['actionsDropdown', 'switch'];
  declare readonly actionsDropdownTarget: HTMLTableCellElement;
  declare switchTarget: HTMLInputElement;

  static values = { 
    rowData: Object 
  };
  declare readonly rowDataValue: { [key: string]: any };

  id: number | undefined = undefined;
  title: string | undefined = undefined;

  connect() {
    // console.log('connect promoted story')
    Object.keys(this.rowDataValue).forEach((key): void => {
      const field: keyof this['rowDataValue'] = key;
      this[field] = this.rowDataValue[key];
    });
    this.actionsDropdownTarget.insertAdjacentHTML('afterbegin', this.actionsDropdownTemplate());

    $(this.switchTarget).bootstrapSwitch({
      size: 'small',
      disabled: false,
      animate: false,
      onInit: function (e: Event) {}
    });
  }

  actionsDropdownTemplate() {
    return `
      <a id="promoted-story-actions-dropdown-${this.id}" 
        href="#" 
        class="dropdown-toggle" 
        data-toggle="dropdown"
        aria-haspopup="true" 
        aria-expanded="false">
        <i class="fa fa-caret-down"></i>
      </a>
      <ul class="dropdown-menu dropdown-menu-right aria-labelledby="promoted-story-actions-dropdown-${this.id}"">
      <li>
        <a role="button">
          <i class="fa fa-fw fa-image action"></i>&nbsp;&nbsp;
          <span>Assign Images</span>
        </a>
      </li>
      <li>
        <a href="/promote/preview/${this.id}" target="_blank">
          <i class="fa fa-fw fa-external-link action"></i>&nbsp;&nbsp;
          <span>Preview</span>
        </a>
      </li>
    `
  }
}