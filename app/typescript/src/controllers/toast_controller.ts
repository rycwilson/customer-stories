import { Controller } from "@hotwired/stimulus";

let bootoast: any;
import('bootoast').then(_bootoast => bootoast = _bootoast);

const baseOptions = {
  timeout: 3,
  animationDuration: 150,
  dismissable: true
};

export default class ToastController extends Controller {
  static values = { flash: Object };
  declare flashValue: FlashHash;

  flashValueChanged(flash: FlashHash) {
    console.log('flash:', flash)
    let type, message, position;    // these are bootoast option names and should not be changed
    
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
      message = flash[flashType]
      position = flashType === 'alert' ? 'top-center' : 'bottom-center';
    }
    if (type && message) bootoast.toast({ ...baseOptions, type, message, position });
  }
}