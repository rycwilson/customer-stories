import Cookies from 'js-cookie';
import imagesLoaded from 'imagesloaded';
import { init as initStoryCard } from './story_card';
import { setCustomButtonProps } from '../utils';

// TODO replace bootstrap modal with native dialog
import '../jquery';
import 'bootstrap-sass/assets/javascripts/bootstrap/modal';

const searchParams = new URLSearchParams(location.search);
const socialShareRedirectURI = searchParams.get('redirect_uri');
if (socialShareRedirectURI) location.href = socialShareRedirectURI;

const relatedStories: NodeListOf<HTMLDivElement> = document.querySelectorAll('.story-card');

imagesLoaded('.story-wrapper', (instance?: ImagesLoaded.ImagesLoaded) => {
  if (instance) instance.elements[0].classList.remove('hidden');
  initFixedCta();
});
relatedStories.forEach(initStoryCard);
initMobileCta();
initMoreStories();
initVideo();
initShareButtons();

const editStoryLink = document.querySelector('.stories-header__edit');
if (editStoryLink) editStoryLink.addEventListener('click', () => Cookies.set('csp-edit-story-tab', '#story-narrative-content'));

const headerCTA = <HTMLAnchorElement | HTMLButtonElement>(
  document.querySelector('.company-header .primary-cta a') || document.querySelector('.company-header .primary-cta button')
);
if (headerCTA) {
  setCustomButtonProps(headerCTA);
  headerCTA.parentElement?.classList.remove('hidden');
}

function initMoreStories() {
  if (isMobileView() && document.querySelector('.primary-cta-xs')) return false;
  const minStories = 4;
  const delay = 5;
  const storySlug = location.pathname.slice(location.pathname.lastIndexOf('/') + 1);
  const shouldInit = (
    document.body.className.search(/pixlee|varmour/) === -1 && 
    window.innerWidth >= 768
    // TODO: # of featured|related stories >= minStories (implement in server)
  )
  if (!shouldInit) return false;
  const carousel = document.createElement('div');
  carousel.id = 'cs-tabbed-carousel';
  carousel.classList.add('cs-plugin');
  const scriptTag = document.createElement('script');
  scriptTag.src = `${location.origin}/plugins/tabbed_carousel/cs.js`; 
  scriptTag.setAttribute('data-delay', delay.toString());
  scriptTag.setAttribute('data-title', 'More Stories');
  scriptTag.setAttribute('data-skip', storySlug)
  document.body.appendChild(carousel);
  document.body.appendChild(scriptTag);

  // prevent the carousel tab from covering up user sign in
  const signInFooter = <HTMLDivElement>document.getElementById('sign-in-footer');
  if (signInFooter) addFooterScrollListener(carousel, signInFooter);    
}

function initMobileCta() {
  const cta = <HTMLDivElement>document.querySelector('.primary-cta-xs');
  if (cta) {
    const removeCta = (e: Event) => { 
      if (e.target && (e.target as HTMLElement).closest('button')) cta.remove(); 
    };
    setTimeout(() => cta.classList.add('open'), 3000);
    cta.addEventListener('click', removeCta);
    cta.addEventListener('touchend', removeCta);
  }
}

function initVideo() {
  document.querySelectorAll('.video-thumb-container').forEach(container => {
    ['click', 'touchend'].forEach(event => container.addEventListener(event, loadVideo));
  })
}

// //TODO: move this behavior to html + css (position: sticky)
function initFixedCta() {
  const isPixleeStory = ['stories', 'show', 'pixlee'].every(token => document.body.classList.contains(token));
  const sidebar = document.querySelector('.story-sidebar');
  const cta = <HTMLDivElement>document.querySelector('.pixlee-cta');
  if (!isPixleeStory || isMobileView() || !sidebar || !cta) return false;
  const backgroundDiv = <HTMLDivElement>cta.querySelector('.cta__image');
  const ctaTop = scrollY + backgroundDiv.getBoundingClientRect().top;
  document.addEventListener('scroll', (e) => {
    if (scrollY > ctaTop - 95) {
      // console.log('fix', scrollY, ctaTop)
      cta.style.position = 'fixed';
      cta.style.top = '95px';
      cta.style.left = `${sidebar.getBoundingClientRect().left + parseFloat(getComputedStyle(sidebar).paddingLeft)}px`;
      cta.style.height = '400px';
      cta.style.width = `${
        parseFloat(getComputedStyle(sidebar).width) - 
        parseFloat(getComputedStyle(sidebar).paddingLeft) - 
        parseFloat(getComputedStyle(sidebar).paddingRight)
      }px`;
    } else {
      // console.log('no fix')
      cta.style.position = 'static';
    }
  }, { passive: true });
}

function initShareButtons() {
  document.querySelectorAll('.share-button').forEach((link: Element) => {
    const _link = link as HTMLAnchorElement;
    _link.addEventListener('click', (e: Event) => {
      e.preventDefault();   // don't follow the link
      const width = +(_link.dataset.windowWidth as string);
      const height = +(_link.dataset.windowHeight as string);
      const top = screenTop + (document.documentElement.clientHeight / 2) - (height / 2);
      const left = screenLeft + (document.documentElement.clientWidth / 2) - (width / 2);
      window.open(
        _link.href, 
        'Share Customer Story', 
        `width=${width},height=${height},top=${top},left=${left},resizable=no`
      );
    });
  });
}

// TODO how to determine if carousel is present given that it won't appear until X seconda after load?
function addFooterScrollListener(carousel: HTMLDivElement, footer: HTMLDivElement) {
  document.addEventListener('scroll', (e) => {
    // TODO memoize this?
    const scrollBottom = document.documentElement.scrollHeight - document.documentElement.clientHeight - scrollY;

    if (scrollBottom < footer.clientHeight) {
      carousel.classList.add('hidden');
    } else if (!document.cookie.includes('cs-tabbed-carousel-removed')) {
      carousel.classList.remove('hidden');
    }
  }, { passive: true });
}

function loadVideo(this: HTMLElement, e: Event) {
  if (e.target && (e.target as HTMLElement).closest('iframe')) return;
  const provider = this.dataset.provider;
  const url = this.dataset.videoUrl as string;
  const sharedParams = 'autoplay=1';
  const youtubeParams = 'enablejsapi=1&controls=0&iv_load_policy=3&showinfo=0&rel=0';
  const params = (
    `${url.includes('?') ? '&' : '?'}` + sharedParams + `${provider === 'youtube' ? `&${youtubeParams}` : ''}`
  );
  const modal = <HTMLElement>document.getElementById('video-modal');
  const videoFrame: HTMLIFrameElement = isMobileView() ? 
    <HTMLIFrameElement>document.querySelector('.story-video-xs iframe') : 
    <HTMLIFrameElement>modal.querySelector('iframe');
  const pauseVideo = (e: Event) => {
    (videoFrame.contentWindow as Window).postMessage(
      provider === 'youtube' ? '{"event":"command","func":"pauseVideo","args":""}' : '{"method":"pause"}', 
      '*'
    );
  }
  if (isMobileView()) {
    videoFrame.addEventListener('load', (e) => {
      const frame = e.currentTarget as HTMLIFrameElement;
      const parent = frame.parentElement as HTMLElement;
      frame.classList.remove('hidden');
      [...parent.children].forEach(el => { if (el !== frame) el.remove(); });
    }, { once: true });
    videoFrame.src = url + params;

  // attach one-time listeners since the postMessage will differ by provider
  } else {
    const closeBtn = <HTMLButtonElement>modal.querySelector('button.close');
    (videoFrame.contentWindow as Window).location.replace(url + params);
    closeBtn.addEventListener('click', pauseVideo);
    $(modal)
      .on('hide.bs.modal', pauseVideo)
      .one('hidden.bs.modal', (e: Event) => {
        closeBtn.removeEventListener('click', pauseVideo);
        $(modal).off('hide.bs.modal', pauseVideo);
      })
  }
}

function isMobileView() {
  return document.documentElement.clientWidth < 768;
}