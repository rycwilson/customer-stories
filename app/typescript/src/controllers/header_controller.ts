import { Controller } from '@hotwired/stimulus';
import { toggleHeaderOnScroll } from '../utils';

export default class HeaderController extends Controller<HTMLElement>{
  connect() {
    window.addEventListener('scroll', toggleHeaderOnScroll(this.element), { passive: true });
  }

  disconnect() {
    window.removeEventListener('scroll', toggleHeaderOnScroll(this.element));
  }
}