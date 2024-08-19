export function initStoryCard(card: HTMLElement) {
  const link = card.children[0];
  if (link.classList.contains('published')) {
    link.addEventListener('click', visitStory);

    // set passive: false to override Chrome default behavior; see TouchEvent MDN docs
    link.addEventListener('touchstart', visitStory, { passive: false });
  }
}

function visitStory(e: Event) {
  e.preventDefault();
  const link = <HTMLAnchorElement>e.currentTarget;
  // if (!link.dataset.ready) {
  //   e.preventDefault();
  // } else {
  //   link.dataset.ready = false;
  //   return false;
  // }
  const card = <HTMLElement>link.parentElement;
  const otherCards = [...<NodeListOf<HTMLDivElement>>document.querySelectorAll('.story-card')]
    .filter(_card => _card !== card);
  let loadingTimer: number;
  const toggleOtherCards = (shouldEnable: boolean) => {
    otherCards.forEach(_card => _card.style.pointerEvents = shouldEnable ? '' : 'none');
  }
  const revertStyle = (e: PageTransitionEvent) => {
    if (e.persisted) {
      clearTimeout(loadingTimer);
      card.classList.remove('loading', 'still-loading', 'hover');
      toggleOtherCards(true);
    }
  };
  const followLink = () => {
    toggleOtherCards(false);
    window.addEventListener('pagehide', revertStyle, { once: true });
    card.classList.add('loading');
    loadingTimer = window.setTimeout(() => card.classList.add('still-loading'), 1000);
    
    location.assign(link.href);
    // setTimeout(() => location = link.href)
    // link.dataset.ready = true;
    // link.click();
  }
  if (e.type === 'click') {
    followLink();
  } else if (e.type === 'touchstart' && !card.classList.contains('hover')) {
    card.classList.add('hover');

    // next tap => load story
    link.addEventListener('touchstart', followLink, { once: true });

    // undo hover and touchstart listener if clicking anywhere outside the story card
    document.addEventListener('touchstart', (e: Event) => {
      if (card.contains(e.target as Node)) return false;
      card.classList.remove('hover');  
      link.removeEventListener('touchstart', followLink);
    }, { once: true, capture: true });
  }
}