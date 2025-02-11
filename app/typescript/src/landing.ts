import './jquery';
import 'bootstrap-sass-3.3.6/assets/javascripts/bootstrap/transition';
import 'bootstrap-sass-3.3.6/assets/javascripts/bootstrap/collapse';
import { toggleHeaderOnScroll, validateForm } from './utils';

const header = <HTMLElement>document.body.querySelector(':scope > nav');
const signInForm: HTMLFormElement | null = document.querySelector('form[action="/users/sign_in"]'); 
const signUpForm: HTMLFormElement | null = document.querySelector('form[action="/users"]');

console.log(signUpForm)

window.addEventListener('scroll', toggleHeaderOnScroll(header), { passive: true });
if (signInForm) signInForm.addEventListener('submit', validateForm);
if (signUpForm) signUpForm.addEventListener('submit', validateForm);

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