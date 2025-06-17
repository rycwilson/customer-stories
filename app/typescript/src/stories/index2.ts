const searchParams = new URLSearchParams(location.search);
const gallery = document.getElementById('stories-gallery');
const featuredStories = document.querySelectorAll('.story-card');
const matchTypeInputs = document.querySelectorAll('[name*="match-type"]');

onload = () => gallery?.classList.remove('hidden');

document.querySelectorAll('.stories-filter__tag-header').forEach(header => {
  const group = <HTMLElement>header.nextElementSibling;
  group.style.height = header.getAttribute('aria-expanded') === 'true' ?
    `${group.scrollHeight}px` :
    '0px';
  header.addEventListener('click', () => {
    const shouldCollapse = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', (!shouldCollapse).toString());
    group.style.height = shouldCollapse ? '0px' : `${group.scrollHeight}px`;
  });
});