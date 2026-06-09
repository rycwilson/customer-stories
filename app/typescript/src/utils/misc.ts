import tinycolor from 'tinycolor2';
import { FetchRequest } from '@rails/request.js';

// Using css variables to capture style allows for use of the custom-button-variant mixin,
// which itself is just a copy of bootstrap's button-variant mixin that has been modified to use css variables.
// Thus standard bootstrap styling is conserved while allowing for dynamic custom button colors.
export function setCustomButtonProps(btn: HTMLElement) {
  const { bgColor, color } = btn.dataset;
  if (!bgColor || !color) {
    console.error("Missing custom button colors");
    return;
  }

  btn.style.setProperty('--btn-custom-bg', bgColor);
  btn.style.setProperty('--btn-custom-bg-darken-10', tinycolor(bgColor).darken(10).toString());
  btn.style.setProperty('--btn-custom-bg-darken-17', tinycolor(bgColor).darken(17).toString());
  btn.style.setProperty('--btn-custom-border', bgColor);
  btn.style.setProperty('--btn-custom-border-darken-12', tinycolor(bgColor).darken(12).toString());
  btn.style.setProperty('--btn-custom-border-darken-25', tinycolor(bgColor).darken(25).toString());
  btn.style.setProperty('--btn-custom-color', color);
}

export async function getJSON(dataPath: string, params?: URLSearchParams) {
  const request = new FetchRequest(
    'get', 
    `${dataPath}.json${params ? `?${params.toString()}` : ''}`
  );
  const response = await request.perform();
  if (response.ok) {
    return await response.json;
  }
}

// https://medium.com/@mariusc23/hide-header-on-scroll-down-show-on-scroll-up-67bbaae9a78c
function toggleHeader(header: HTMLElement, minScroll: number, minScrollTop: number, lastScrollTop: number) {
  const scrollTop = window.scrollY;
  if (Math.abs(lastScrollTop - scrollTop) <= minScroll) return false;
  if (scrollTop > lastScrollTop && scrollTop > header.offsetHeight) {
    if (scrollTop < minScrollTop) return false;
    header.classList.add('collapse-header');
  } else {
    header.classList.remove('collapse-header');
  }
  return scrollTop;
}

export function toggleHeaderOnScroll(header: HTMLElement) {  
  const minScroll = 10;
  const minScrollTop = 300;
  let isScrolling = false;
  let lastScrollTop = 0;
  return (_e: Event) => {
    if (isScrolling) return false;
    isScrolling = true;
    window.setTimeout(() => {
      lastScrollTop = toggleHeader(header, minScroll, minScrollTop, lastScrollTop) || lastScrollTop;
      isScrolling = false;
    }, 250);
  }
}

export function parseDatasetObject(
  element: HTMLElement,
  prop: string,
  ...requiredProps: string[]
) {
  try {
    const parsedData = JSON.parse(element.dataset[prop] || '');
    const hasRequiredProps = requiredProps.every(prop => (
      Object.prototype.hasOwnProperty.call(parsedData, prop)
    ));
    return (parsedData && typeof parsedData === 'object' && hasRequiredProps) ? parsedData : null;
  } catch {
    return null;
  }
}

export function debounce(callback: VoidFunction, wait: number, immediate = false) {
  let timeout: number | null;
  return () => {
    const later = () => {
      timeout = null;
      if (!immediate) callback.call(null);
    };
    if (immediate && !timeout) {
      callback.call(null);
    } else {
      if (timeout) clearTimeout(timeout);
      timeout = window.setTimeout(later, wait);
    }
  };
}

export async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Create a temporary textarea outside the viewport
      const temp = document.createElement('textarea');
      temp.style.position = 'absolute';
      temp.style.left = '-999999px';
      temp.value = text;
      document.body.prepend(temp);
      temp.select();
      try {
        document.execCommand('copy');
      } finally {
        temp.remove();
      }
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    throw err; // rethrow to allow caller to handle the error
  }
}

export function distinctItems(items: string[] | number[]) {
  return items.filter((item, i, array) => i === array.indexOf(item));
}

export function distinctObjects<T extends object, K extends keyof T>(objects: T[], attr: K): T[] {
  // Keeps the last occurrence of the duplicate
  return [...new Map(objects.map(item => [item[attr], item])).values()];
}
