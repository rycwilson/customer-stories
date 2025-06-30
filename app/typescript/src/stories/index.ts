import Cookies from 'js-cookie';
import imagesLoaded from 'imagesloaded';
import TomSelect, { tsBaseOptions, addDynamicPlaceholder } from '../tomselect';
import type { TomOption, TomItem } from 'tom-select/dist/types/types';
import { type CBOptions } from 'tom-select/dist/types/plugins/clear_button/types';
import { init as initStoryCard } from './story_card';
import { setCustomButtonProps } from '../utils';
import { FetchRequest } from '@rails/request.js';

export const testExports = { foo }

function foo(a: number, b: number) {
  return a + b
}

const searchParams = new URLSearchParams(location.search);
const gallery = <HTMLDivElement>document.getElementById('stories-gallery');
const featuredStories: NodeListOf<HTMLDivElement> = document.querySelectorAll('.story-card');
const searchAndFilters: NodeListOf<HTMLDivElement> = document.querySelectorAll('.search-and-filters');
const searchForms: NodeListOf<HTMLFormElement> = document.querySelectorAll('.search-stories');
const filters: NodeListOf<HTMLSelectElement> = document.querySelectorAll('.stories-filter__select:not(.ts-wrapper)');
// const searchResults: NodeListOf<HTMLSpanElement> = document.querySelectorAll('.search-stories__results');
const filterResults: NodeListOf<HTMLDivElement> = document.querySelectorAll('.filter-results > span:last-child');
const matchTypeInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll('[name*="match-type"]');
const activeFilters: { [key: string]: { id: number, slug: string } } = {};

imagesLoaded('#stories-gallery', (instance?: ImagesLoaded.ImagesLoaded) => {
  if (instance) instance.elements[0].classList.remove('hidden');
});

initSearchForms();
initFilters();
featuredStories.forEach(initStoryCard);

// presently, only filters (not search) can be synchronously loaded
if (Object.keys(activeFilters).length) showResults();

// set activeFilters on history.replaceState
// => history.replaceState is only called after searchParams has been updated
const replaceStateFn = history.replaceState;
history.replaceState = (state, title, url) => {
  replaceStateFn.call(history, state, title, url);
  setActiveFilters();
}

const headerCTA = <HTMLAnchorElement | HTMLButtonElement>(
  document.querySelector('.company-header .primary-cta a') || document.querySelector('.company-header .primary-cta button')
);
if (headerCTA) {
  setCustomButtonProps(headerCTA);
  headerCTA.parentElement?.classList.remove('hidden');
}

function setActiveFilters() {
  if (activeFilters === undefined) return;
  
  // cleared filters
  Object.keys(activeFilters).forEach(tagType => {
    if (!searchParams.has(tagType)) delete activeFilters[tagType];
  });

  // added or updated filters
  Object.assign(
    activeFilters,
    Object.fromEntries(
      [...searchParams]
        .filter(([tagType, tagSlug]) => /^(category|product)$/.test(tagType))
        .map(([tagType, tagSlug]) => {
          const tagSelect = <HTMLSelectElement>[...filters].find(select => tagType === singleSelectTagType(select));
          const tagOption = <HTMLOptionElement>tagSelect.querySelector(`option[data-slug="${tagSlug}"]`);
          return [tagType, { id: parseInt(tagOption.value, 10), slug: tagSlug }];
        })
    )
  );
}

function initSearchForms() {
  const syncInputs = (e: Event) => {
    const form = e.currentTarget;
    const input = <HTMLInputElement>e.target;
    [...searchForms]
      .filter(_form => _form !== form)
      .forEach(_form => {
        const _input = <HTMLInputElement>_form.querySelector('.search-stories__input');
        _input.value = input.value;
      });
  }
  searchForms.forEach(form => {
    form.addEventListener('input', syncInputs);
    form.addEventListener('click', (e: Event) => {
      const btn = <HTMLButtonElement>e.target;
      if (btn.type === 'submit') beforeSubmitSearch(e) ;
    });
    const clearBtn = <HTMLButtonElement>form.querySelector('.search-stories__clear'); 
    clearBtn.addEventListener('click', (e) => {
      clearSearch(true);
      renderStories([...featuredStories]);
    });
  });
}

function clearSearch(isUserInput: boolean = false) {
  searchAndFilters.forEach(component => component.classList.remove('has-search-results'));
  searchForms.forEach(form => {
    (form.querySelector('.search-stories__input') as HTMLInputElement).value = '';
    [
      (form.querySelector('.search-stories__results') as HTMLElement),
      ((form.nextElementSibling as HTMLElement).querySelector('.search-stories__search-string') as HTMLElement),
      ((form.nextElementSibling as HTMLElement).querySelector('.search-stories__results') as HTMLElement)
    ].forEach(el => el.textContent = '');
  });
  if (isUserInput) renderStories([...featuredStories]);
}

function initFilters() {
  initFilterControls();
  const tsOptions = (select: TomSelectInput, otherSelects: TomSelectInput[]) => ({
    onInitialize(this: TomSelect) {
      if (select.multiple) addDynamicPlaceholder(this);
    },
    onChange: onChangeFilter.bind(null, select, otherSelects),
    onItemAdd(value: string, item: TomItem) {
      if (select.multiple) {
        // disable highlighting of item when clicked
        const observer = new MutationObserver(mutations => {
          if (item.classList.contains('active')) item.classList.remove('active');
        });
        observer.observe(item, { attributes: true });
      }
    },
    render: {
      // item(data: TomOption, escape: (str: string) => string) {
        // if (select.multiple) {
          // const tagType = (
          //   data.value[0].toUpperCase() + (data.value.slice(1, data.value.lastIndexOf('-')).split('-').join(' '))
          // );
          // return `<div><div><span class="tag-type">${tagType}:</span>&nbsp;<span class="tag-name">${escape(data.text)}</span></div></div>`
      // }
    },
    plugins: select.multiple ? {
      'remove_button': {
        title: 'Clear selection'
      }
    } : {
      'clear_button': {
        title: 'Clear selection',
        html: (config: CBOptions) => (
          `<button type="button" class="btn ${config.className}" title="${config.title}">&times;</button>`
        )
      }
    }
  });
  filters.forEach(select => {
    const otherSelects = [...filters].filter(_select => _select !== select);
    const ts = new TomSelect(select, { ...tsBaseOptions, ...tsOptions(select, otherSelects) });
    if (select.multiple) {
      // add clearing behavior
      ts.wrapper.querySelectorAll('.item').forEach((item: Element) => onAddMultiSelectItem(ts, item as TomItem));
      ts.on('item_add', (value: string, item: Element) => onAddMultiSelectItem(ts, item as TomItem));
    };
  });
  setTimeout(() => searchAndFilters.forEach(container => container.setAttribute('data-init', 'true')));
}

function onAddMultiSelectItem(ts: TomSelect, item: TomItem) {
  const clearBtn = item.querySelector('.remove');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();    // don't highlight active or open dropdown
      const tagType = item.dataset.value.split('-')[0];
      searchParams.delete(tagType);
      history.replaceState(null, '', searchParams.size === 0 ? '/' : `?${searchParams.toString()}`);
      // ts.blur();
    });
  }
}
    
function initFilterControls() {
  setActiveFilters();
  document.querySelectorAll('.filter-controls button').forEach(btn => btn.addEventListener('click', clearFilters));
  matchTypeInputs.forEach(input => input.addEventListener('change', (e: Event | CustomEvent) => {
    if ('detail' in e && e.detail.silent) return;
    if (input.checked) {
      Cookies.set('csp-filters-match-type', input.value);
      const mirrorInput = <HTMLInputElement>[...matchTypeInputs].find(_input => (
        (_input.value === input.value) && (_input !== input))
      );
      mirrorInput.checked = true;
      const silentChange = new CustomEvent('change', { bubbles: true, detail: { silent: true } });
      mirrorInput.dispatchEvent(silentChange);
      if (Object.keys(activeFilters).length > 1) {
        renderStories(filterStories(), "Sorry, we couldn't find any stories matching the selected filters");
        showResults();
      }
    }
  }));
}

function onChangeFilter(changedSelect: TomSelectInput, otherSelects: TomSelectInput[], value: string | string[]) {
  const isMulti = value instanceof Array;
  const getTagSlug = (select: TomSelectInput, value: string) => {
    if (!value) return '';
    const options = Object.values(select.tomselect.options) as TomOption[];
    const tagOption = options.find(option => option.value === value) as TomOption;
    return tagOption.slug;
  };

  if (isMulti) {
    const tagTypeIds = value;   // e.g. ['category-1', 'category-2', 'product-3'] 
    
    // reverse => ensures FIFO behavior
    // reduce => ensure only one instance of a given tag type
    // sort => category always goes first
    const newTagTypeIds = tagTypeIds
      .reverse()   
      .reduce((acc: string[], tagTypeId) => {
        const tagType = tagTypeId.split('-')[0];
        const isRepeatedType = acc.find(_tagTypeId => _tagTypeId.includes(tagType));
        return isRepeatedType ? acc : [...acc, tagTypeId];
      }, [])
      .sort(byTagType.bind(null, 'category'));

    // delete search param for any tag type that is no longer selected
    for (const [tagType, tagSlug] of searchParams) {
      if (!newTagTypeIds.find(tagTypeId => tagTypeId.includes(tagType))) {
        searchParams.delete(tagType);
      }
    }

    if (newTagTypeIds.length) {
      // overwrite multi-select value to remove duplicate tag types
      changedSelect.tomselect.setValue(newTagTypeIds, true);

      // add or overwrite search params
      newTagTypeIds.forEach((tagTypeId: string) => {
        const tagType = tagTypeId.split('-')[0];
        const tagSlug = getTagSlug(changedSelect, tagTypeId);
        searchParams.set(tagType, tagSlug);
      });
    }

  } else {
    if (value) {
      searchParams.set(singleSelectTagType(changedSelect), getTagSlug(changedSelect, value));
    } else {
      searchParams.delete(singleSelectTagType(changedSelect));
    }
  }

  history.replaceState(null, '', searchParams.size === 0 ? '/' : `?${searchParams.toString()}`);
  clearSearch();
  syncFilters(changedSelect, otherSelects, isMulti);
  renderStories(filterStories(), "Sorry, we couldn't find any stories matching the selected filters");
  showResults();
}

async function beforeSubmitSearch(e: Event) {
  e.preventDefault();
  const form = <HTMLFormElement>e.currentTarget;
  const searchInput = <HTMLInputElement>form.querySelector('.search-stories__input');
  const searchString = searchInput.value;
  if (!searchString) {
    location.reload();   // reload from cache if available; true => reload from server
  } else {
    renderStories([]);
    clearFilters();

    const request = new FetchRequest('get', '/stories', { query: { q: searchString } });
    const response = await request.perform();
    if (response.ok) {
      const storyIds = await response.json;
      const searchResults = [...featuredStories].filter(card => {
        const { dataset: { storyId } } = card;
        return storyId && storyIds.includes(+storyId);
      });
      renderStories(searchResults, `Sorry, we couldn't find any stories matching \"${searchString}\"`); 
      showResults(searchString);
    }

    // setting X-Requested-With allows the js request without an InvalidCrossOriginRequest error  
    // https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection.html
    // see bottom answer: https://stackoverflow.com/questions/29310187/rails-invalidcrossoriginrequest
    // fetch('/stories?' + new URLSearchParams({ q: searchString }), {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Requested-With': 'XMLHttpRequest',   // to identify as an ajax request
    //     'X-CSRF-Token': (<HTMLMetaElement>document.querySelector('[name="csrf-token"]')).content
    //   }
    // }).then(res => res.json())
    //   .then((storyIds) => {
    //     const searchResults = [...featuredStories].filter(card => {
    //       const storyId = +<string>card.dataset.storyId;
    //       return storyIds.includes(storyId);
    //     });
    //     renderStories(searchResults, `Sorry, we couldn't find any stories matching \"${searchString}\"`); 
    //     showResults(searchString)
    //   })
  }
}

function filterStories() {
  const [matchAll, matchAny, , ,] = [...matchTypeInputs];
  const storyIsTagged = (card: HTMLElement, tagType: string) => (
    card.dataset[tagType] && JSON.parse(card.dataset[tagType] as string).includes(activeFilters[tagType].id)
  );
  return Object.keys(activeFilters).length === 0 ?
    [...featuredStories] :
    [...featuredStories].filter(card => {
      if (matchAll.checked) {
        return Object.keys(activeFilters).every(tagType => storyIsTagged(card, tagType));
      } else if (matchAny.checked) {
        return Object.keys(activeFilters).some(tagType => storyIsTagged(card, tagType));
      }
    });
}

function renderStories(stories: HTMLElement[], noResultsMesg?: string) {
  const createItem = (content: HTMLElement | string) => {
    const li = document.createElement('li');
    if (typeof content === 'string') {
      li.insertAdjacentHTML('afterbegin', content);
    } else {
      li.appendChild(content);
    }
    return li;
  }
  if (!stories.length && noResultsMesg) {
    gallery.replaceChildren(createItem(`<h4 id="no-search-results">${noResultsMesg}</h4>`));
  } else {
    gallery.replaceChildren(...stories.map(createItem));
  }
}

function showResults(searchString?: string) {
  const hasSearchResults = Boolean(searchString);
  const hasCombinedResults = Object.keys(activeFilters).length > 1;
  const results = [...document.querySelectorAll('.story-card')].filter(card => {
    const li = <HTMLLIElement>card.parentElement;
    return !li.classList.contains('hidden');
  });
  const showCount = (target: HTMLElement) => (
    target.textContent = `${results.length} ${results.length === 1 ? 'story' : 'stories'}`
  ); 
  if (hasSearchResults) {
    searchForms.forEach(form => {
      const resultsContainers: (HTMLElement | null)[] = [];
      resultsContainers.push(<HTMLElement>form.querySelector('.search-stories__results'));
      resultsContainers.push(<HTMLElement>(form.nextElementSibling as HTMLElement).querySelector('.search-stories__results'));
      resultsContainers.filter((container): container is HTMLElement => container !== null).forEach(showCount);
      const searchStringContainer = <HTMLElement>form.nextElementSibling;
      const searchStringEl = <HTMLElement>searchStringContainer.querySelector('.search-stories__search-string');
      searchStringEl.textContent = `"${searchString}"`;
    })
  } else {
    filterResults.forEach(el => hasCombinedResults ? showCount(el) : el.textContent = '');
  }
  searchAndFilters.forEach(component => {
    if (hasSearchResults) {
      component.classList.remove('has-combined-results');
      component.classList.add('has-search-results');
    } else if (hasCombinedResults) {
      component.classList.remove('has-search-results');
      component.classList.add('has-combined-results');
    } else {
      component.classList.remove('has-combined-results', 'has-search-results');
    }
  });
}

function syncFilters(changedSelect: TomSelectInput, otherSelects: TomSelectInput[], multiChanged: boolean) {
  otherSelects.forEach(select => {
    if (multiChanged) {
      select.tomselect.setValue(
        activeFilters[singleSelectTagType(select)] ? activeFilters[singleSelectTagType(select)].id : '', 
        true
      );
    } else {
      const changedType = singleSelectTagType(changedSelect);
      if (singleSelectTagType(select) === changedType) {
        select.tomselect.setValue(changedSelect.value, true);
      }
    }
  });
  if (!multiChanged) {
    const multiSelect = otherSelects.find(select => select.multiple);
    if (multiSelect) {
      const newTagTypeIds = Object.entries(activeFilters)
        .flatMap(([tagType, { id: tagId }]) => tagId ? `${tagType}-${tagId}` : [])
        .sort(byTagType.bind(null, 'category'));
        multiSelect.tomselect.setValue(newTagTypeIds, true);
    }
  }
}

function clearFilters(e?: Event) {
  if (Object.keys(activeFilters).length === 0) return;
  const isUserInput = Boolean(e);
  Object.keys(activeFilters).forEach(tagType => searchParams.delete(tagType));
  history.replaceState(null, '', searchParams.size === 0 ? '/' : `?${searchParams.toString()}`);
  filters.forEach((select: TomSelectInput) => select.tomselect.clear(true));
  if (isUserInput) renderStories([...featuredStories]);
  searchAndFilters.forEach(component => component.classList.remove('has-combined-results'));
}

function singleSelectTagType(select: HTMLSelectElement) {
  return select.dataset.tomselectKindValue as string;
}

function byTagType(tagType: string, a: string, b: string) {
  return a.includes(tagType) ? -1 : (b.includes(tagType) ? 1 : 0);
}