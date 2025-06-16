import './jquery';
import 'bootstrap-sass/assets/javascripts/bootstrap/transition';
import 'bootstrap-sass/assets/javascripts/bootstrap/collapse';
import bootoast from 'bootoast';
import { toggleHeaderOnScroll, validateForm } from './utils';

const header = <HTMLElement>document.body.querySelector(':scope > nav');
const accountForm: HTMLFormElement | null = document.querySelector('.account-form');
const toasterBaseOptions = {
  timeout: 4,
  animationDuration: 150,
  dismissable: true
}

window.addEventListener('scroll', toggleHeaderOnScroll(header), { passive: true });

if (accountForm) {
  accountForm.addEventListener('submit', validateForm);
  if (accountForm.dataset.flash) {
    const flash = JSON.parse(accountForm.dataset.flash);
    Object.keys(flash).forEach((flashType: string) => {
      bootoast.toast({ 
        ...toasterBaseOptions, 
        type: (() => {
          if (flashType === 'notice') {
            return 'success';
          } else if (flashType === 'alert') {
            return 'danger';
          } else {
            return flashType;
          }
        })(), 
        message: flash[flashType], 
        position: 'top-center',
        timeout: flashType === 'alert' ? false : toasterBaseOptions.timeout
      });
    });
  } else if (accountForm.dataset.resourceErrors) {
    JSON.parse(accountForm.dataset.resourceErrors).forEach((error: string) => {
      bootoast.toast({ ...toasterBaseOptions, type: 'danger', timeout: false, message: error, position: 'top-center' }); 
    });
  }
}

let resizeTimer: number;
setViewportHeight();
window.addEventListener('resize', (e) => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(setViewportHeight, 500);
});

// https://css-tricks.com/snippets/jquery/done-resizing-event/
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}