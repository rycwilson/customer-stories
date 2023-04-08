//= require jquery3
//= require bootstrap/transition
//= require bootstrap/collapse
//= require mvpready-core
//= require mvpready-helpers
//= require mvpready-landing
//= require bootstrap-validator/dist/validator

let resizeTimer;

setViewportHeight();
collapseHeaderOnScroll();

addEventListener('resize', (e) => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setViewportHeight, 500);
})

// https://css-tricks.com/snippets/jquery/done-resizing-event/
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// https://medium.com/@mariusc23/hide-header-on-scroll-down-show-on-scroll-up-67bbaae9a78c
function collapseHeaderOnScroll() {
  const navbar = document.querySelector('.navbar-fixed-top');
  const minScroll = 10;
  let isScrolling = false;
  let lastScrollTop = 0;

  window.addEventListener('scroll', onScroll, { passive: true });
  
  function toggleCollapse() {
    const scrollTop = window.scrollY;
    if (Math.abs(lastScrollTop - scrollTop) <= minScroll) return false;
    if (scrollTop > lastScrollTop && scrollTop > navbar.offsetHeight) {
      navbar.classList.add('collapse-header');
    } else {
      navbar.classList.remove('collapse-header');
    }
    lastScrollTop = scrollTop;
  }

  function onScroll() {
    if (isScrolling) return false;
    isScrolling = true;
    setTimeout(() => {
      toggleCollapse();
      isScrolling = false;
    }, 250);
  }
}