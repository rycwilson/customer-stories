import { Controller } from "@hotwired/stimulus";
import bootoast from 'bootoast';

const baseOptions = {
  timeout: 4,
  animationDuration: 150,
  dismissable: true
};

export default class ToastController extends Controller {
  static values = { 
    flash: { type: Object, default: {} },
    errors: { type: Array, default: [] }
  };
  declare flashValue: FlashHash;
  declare errorsValue: string[];

  flashValueChanged(flash: FlashHash) {
    console.log('flash:', flash)
    let type, message;    // these are bootoast option names and should not be changed
    
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
      bootoast.toast({ 
        ...baseOptions, 
        type, 
        message, 
        timeout: type === 'danger' ? false : baseOptions.timeout, 
        position: type === 'danger' ? 'top-center' : 'bottom-center' 
      });
    }
  }

  errorsValueChanged(errors: string[]) {
    console.log('errors:', errors)
    errors.forEach(error => { 
      bootoast.toast({ 
        ...baseOptions, 
        type: 'danger', 
        message: error, 
        timeout: false, 
        position: 'top-center'
      });
    });
  }
}