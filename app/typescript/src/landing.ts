import './jquery';
import 'bootstrap-sass-3.3.6/assets/javascripts/bootstrap/transition';
import 'bootstrap-sass-3.3.6/assets/javascripts/bootstrap/collapse';
import { toggleHeaderOnScroll } from './utils';

const header = <HTMLElement>document.body.querySelector(':scope > nav');
window.addEventListener('scroll', toggleHeaderOnScroll(header), { passive: true });

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