import { application } from "./controllers/application.js"
import tinycolor from 'tinycolor2';
import FormController, { type SubclassController } from './controllers/form_controller';

// Using css variables to capture style allows for use of the custom-button-variant mixin,
// which itself is just a copy of bootstrap's button-variant mixin that has been modified to use css variables.
// Thus standard bootstrap styling is conserved while allowing for dynamic custom button colors.
export function setCustomButtonProps(btn: HTMLElement) {
  const { bgColor, color } = btn.dataset as { bgColor: string, color: string };
  btn.style.setProperty('--btn-custom-bg', bgColor);
  btn.style.setProperty('--btn-custom-bg-darken-10', tinycolor(bgColor).darken(10).toString());
  btn.style.setProperty('--btn-custom-bg-darken-17', tinycolor(bgColor).darken(17).toString());
  btn.style.setProperty('--btn-custom-border', bgColor);
  btn.style.setProperty('--btn-custom-border-darken-12', tinycolor(bgColor).darken(12).toString());
  btn.style.setProperty('--btn-custom-border-darken-25', tinycolor(bgColor).darken(25).toString());
  btn.style.setProperty('--btn-custom-color', color);
}

export function parseDatasetObject<Type>(element: HTMLElement, prop: string, ...requiredProps: string[]): Type | null {
  try {
    const parsedData: Type = JSON.parse(element.dataset[prop] || '');
    if (parsedData && typeof parsedData === 'object') {
      return requiredProps.every(prop => parsedData.hasOwnProperty(prop)) ? parsedData : null;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export async function getJSON(dataPath: string, params: string) {
  const csrfTokenMeta = document.querySelector<HTMLMetaElement>('[name="csrf-token" ]');
  const csrfToken = csrfTokenMeta?.content;
  if (csrfToken) {
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json', 
        'X-CSRF-Token': csrfToken
      }
    };
    try {
      // return await Promise.all([
      //   fetch('/successes', headers).then(res => res.json()), 
      //   fetch('/companies/0/contributions', headers).then(res => res.json())
      // ]);
      return await fetch(`${dataPath}.json${params ? '?' + params : ''}` , options).then(res => res.json());
    } catch(err) {
      console.error(err);
    }
  } else {
    console.error(`No CSRF token found for fetch(${dataPath}.json)`)
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
  return (e: Event) => {
    if (isScrolling) return false;
    isScrolling = true;
    window.setTimeout(() => {
      lastScrollTop = toggleHeader(header, minScroll, minScrollTop, lastScrollTop) || lastScrollTop;
      isScrolling = false;
    }, 250);
  }
}

export function validateForm(e: SubmitEvent): boolean {
  const form = <HTMLFormElement>e.target;
  let isValid = true;
  const requiredFields: (HTMLInputElement | TomSelectInput)[] = [...form.querySelectorAll('input[required], select[required]')];
  
  // text fields are enabled/disabled via the disabled property
  // select inputs are enabled/disabled by toggling the [name] attribute, as this precludes ui (style) changes
  requiredFields.forEach(field => {
    if (field.disabled || !field.name || field.name === 'user[password_confirmation]') return;
    if (!field.checkValidity()) {
      field.closest('.form-group').classList.add('has-error');
      field.addEventListener(
        field instanceof HTMLSelectElement ? 'change' : 'input', 
        ({ target: _field }: { target: HTMLInputElement | TomSelectInput }) => {
          if (_field.value.trim()) {
            _field.closest('.form-group').classList.remove('has-error');
          }
        },
        { once: true }
      )
      isValid = false;
    }
  });
  form.classList.add('was-validated');
  if (!isValid) {
    e.preventDefault();
    e.stopPropagation();  // stops rails-ujs from disabling the submit button
    requiredFields.find(field => !field.checkValidity())?.focus();
  }
  return isValid;
}

export function serializeForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  return Array
    .from(formData.entries())
    .map(([field, value]) => encodeURIComponent(field) + '=' + encodeURIComponent(value as string | number | boolean))
    .join('&');
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
      clearTimeout(<number>timeout);
      timeout = setTimeout(later, wait) as any as number;
    }
  };
}

export function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function kebabToCamel(str: string) {
  return str.replace(/-./g, (char) => char[1].toUpperCase());
}

export function kebabize(str: string) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());
}

// export function copyToClipboard(str) {
//   const onCopy = (e) => {
//     e.clipboardData.setData("text/html", str);
//     e.clipboardData.setData("text/plain", str);
//     e.preventDefault();
//   };
//   document.addEventListener("copy", onCopy);
//   document.execCommand("copy");
//   document.removeEventListener("copy", onCopy);
// }

export function distinctItems(items: string[] | number[]) {
  return items.filter((item, i, _items) => i === _items.indexOf(item));
}

export function distinctObjects(objects: { [i: string]: any }[], attr: string) {
  return objects.filter((obj, i, _objects) => i === _objects.findIndex(_obj => _obj[attr] === obj[attr]));
}