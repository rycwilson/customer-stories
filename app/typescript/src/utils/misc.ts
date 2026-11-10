import type { DashboardController, CompanySettingsController } from '../controllers';
import Cookies from 'js-cookie';
import tinycolor from 'tinycolor2';
import { FetchRequest } from '@rails/request.js';

export async function imagesLoaded(images: HTMLImageElement[]) {
  const promises = images.map(img => {
    if (img.complete) return Promise.resolve();

    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true }); // Prevent hanging on broken links
    });
  });
  await Promise.all(promises);
}

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

export function onToggleSidebar(this: DashboardController | CompanySettingsController , _e: PointerEvent) {
  const shouldCollapse = !this.sidebarTargets[0].classList.contains('sidebar--collapsed');
  this.sidebarTargets.forEach(sidebar => (
    sidebar.classList.toggle('sidebar--collapsed', shouldCollapse)
  ));
  Cookies.set('csp-sidebar-collapsed', shouldCollapse ? 'true' : '');
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
    const parsedData = JSON.parse(element.dataset[prop] ?? '');
    const hasRequiredProps = requiredProps.every(prop => (
      Object.prototype.hasOwnProperty.call(parsedData, prop)
    ));
    return (parsedData && typeof parsedData === 'object' && hasRequiredProps) ? parsedData : null;
  } catch {
    return null;
  }
}

export function randomString() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function debounce<A extends unknown[]>(
  callback: (...args: A) => void,
  wait: number,
  immediate = false
) {
  let timeout: number | null;
  return (...args: A) => {
    const later = () => {
      timeout = null;
      if (!immediate) callback(...args);
    };
    if (immediate && !timeout) {
      callback(...args);
    } else if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait);
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

export function shallowEqual<T extends Record<string, any>>(objA: T, objB: any): boolean {
  // 1. Check for referential equality (same memory address)
  if (Object.is(objA, objB)) return true;

  // 2. Ensure both are objects and neither is null
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  // 3. Check if they have the same number of properties
  if (keysA.length !== keysB.length) return false;

  // 4. Verify every key in objA exists in objB and has the same value
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}
