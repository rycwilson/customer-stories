import { Controller } from '@hotwired/stimulus';

export default class HeaderController extends Controller<HTMLElement>{

  scrollHandler = this.onScroll.bind(this);
  minScroll = 10;
  isScrolling = false;
  minScrollTop = 300;
  lastScrollTop = 0;

  connect() {
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  disconnect() {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  toggleCollapse() {
    const scrollTop = window.scrollY;
    if (Math.abs(this.lastScrollTop - scrollTop) <= this.minScroll) return false;
    if (scrollTop > this.lastScrollTop && scrollTop > this.element.offsetHeight) {
      if (scrollTop < this.minScrollTop) return false;
      this.element.classList.add('collapse-header');
      // document.querySelectorAll('.layout-sidebar')?.forEach(sidebar => sidebar.classList.add('collapse-header'));
    } else {
      this.element.classList.remove('collapse-header');
      // document.querySelectorAll('.layout-sidebar')?.forEach(sidebar => sidebar.classList.remove('collapse-header'));
    }
    this.lastScrollTop = scrollTop;
  }

  // https://medium.com/@mariusc23/hide-header-on-scroll-down-show-on-scroll-up-67bbaae9a78c
  onScroll() {
    console.log('scrolling')
    if (this.isScrolling) return false;
    this.isScrolling = true;
    setTimeout(() => {
      this.toggleCollapse();
      this.isScrolling = false;
    }, 250);
  }
}