import { Controller } from "@hotwired/stimulus";
import type ModalController from './modal_controller'
import bootoast from 'bootoast';

const baseOptions = {
  timeout: 4,
  animationDuration: 150,
  dismissable: true
};

export default class ToastController extends Controller {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;
  declare readonly hasModalOutlet: boolean;

  static values = { 
    flash: { type: Object, default: {} },
    errors: { type: Array, default: [] }
  };
  declare flashValue: FlashHash;
  declare errorsValue: string[];

  get container() {
    return document.body.querySelector(':scope > .bootoast-container')
  }
  
  get isShown() {
    return this.container ? this.container.children.length > 0 : false;
  }

  connect() {
    if (this.hasModalOutlet) {
      $(this.modalOutlet.element).on('show.bs.modal', () => this.remove());
    }
  }

  flashValueChanged(flash: FlashHash) {
    // console.log('flash:', flash)
    let type: string | undefined, message: string | undefined;    // these are bootoast option names and should not be changed
    
    // note that Object.keys will return an array of strings despite FlashHash declaration
    // https://github.com/Microsoft/TypeScript/issues/12870
    const flashType = (Object.keys(flash) as (keyof FlashHash)[])[0];
    if (flashType) {
      type = (() => {
        if (flashType === 'notice') {
          return 'success';
        } else if (flashType === 'alert') {
          return 'danger';
        } else {
          return flashType;
        }
      })();
      // remove the trailing timestamp (there to ensure this method is always triggered)
      message = flash[flashType]?.replace(/\d+$/, '');  
    }
    if (type && message) {
      const timeout = type === 'danger' ? false : baseOptions.timeout;
      const position = type === 'danger' ? 'top-center' : 'bottom-center';
      if (this.hasModalOutlet && this.modalOutlet.element.checkVisibility()) {
        $(this.modalOutlet.element).one('hidden.bs.modal', () => {
          bootoast.toast({ ...baseOptions, type, message, timeout, position });
        });
      } else {
        bootoast.toast({ ...baseOptions, type, message, timeout, position });
      }
    }
  }

  errorsValueChanged(errors: string[]) {
    // console.log('errors:', errors)
    errors.forEach(error => { 
      bootoast.toast({ ...baseOptions, type: 'danger', message: error, timeout: false, position: 'top-center' });
    });
  }

  remove() {
    this.container?.replaceChildren();
  }
}