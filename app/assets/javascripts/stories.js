'use strict';

(function CSP() {
  const searchContainers = [...document.querySelectorAll('.search-and-filters')]
  for (const container of searchContainers) container.setAttribute('data-init', 'true')
  
  const featuredStories = document.querySelectorAll('.story-card');
  // console.log('featuredStories', featuredStories)
  const searchForms = document.querySelectorAll('form.search-stories');
  
  initSearchForms();
  initFilters();
  initStoryCards();
  
  function initSearchForms() {
    searchForms.forEach(form => {
      form.addEventListener('input', syncSearchInputs);
      form.addEventListener('click', (e) => { if (e.target.type === 'submit') onBeforeSubmit(e) });
      form.querySelector('.search-stories__clear').addEventListener('click', (e) => {
        clearSearch();
        updateGallery([...featuredStories]);
      });
    });
  }

  function initFilters() {
    const filters = document.querySelectorAll('.stories-filter__select:not(.ts-wrapper)');
    filters.forEach(select => {
      const otherSelects = [...filters].filter(_select => !_select.isSameNode(select));
      const tsOptions = Object.assign(
        sharedSelectOptions(select, otherSelects),  
        select.multiple ? multiSelectOptions() : singleSelectOptions()
      );
      const ts = new TomSelect(select, tsOptions);
      if (select.multiple) {
        // add clearing behavior
        ts.wrapper.querySelectorAll('.item').forEach(item => onMultiSelectItemAdd(ts, item));
        ts.on('item_add', (value, item) => onMultiSelectItemAdd(ts, item));
      };
    })
  }

  function initStoryCards() {
    featuredStories.forEach(card => {
      const link = card.children[0];
      if (link.classList.contains('published')) {
        link.addEventListener('click', visitStory);
        link.addEventListener('touchstart', visitStory);
      }
    })    
  }

  
  function visitStory(e) {
    e.preventDefault();
    const link = this;
    const card = link.parentElement;
    const toggleSpinner = () => {
      card.classList.add('loading', 'still-loading');
      document.body.style.pointerEvents = 'none';
      addEventListener('visibilitychange', (e) => {
        card.classList.remove('loading', 'still-loading');
        document.body.style.pointerEvents = 'initial';
      })
    }
    const followLink = () => {
      toggleSpinner();
      setTimeout(() => location = link.href);
    }
    if (e.type === 'click') {
      followLink();
    } else if (e.type === 'touchstart' && !card.classList.contains('hover')) {
      card.classList.add('hover');

      // next tap => load story
      link.addEventListener('touchstart', followLink, { once: true });

      // undo hover and touchstart listener if clicking anywhere outside the story card
      document.addEventListener('touchstart', (e) => {
        if (card.contains(e.target)) return false;
        card.classList.remove('hover');  
        link.removeEventListener('touchstart', followLink);
      }, { once: true, capture: true });
    }
  }
  
  function initFilterChangeHandler(changedSelect, otherSelects) {
    return function onFilterChange(value) {
      const isMulti = Array.isArray(value);
      const tagsFilter = {};
      // const urlParams = Object.fromEntries(
      //   [...new URLSearchParams(location.search)].filter(([tagType, tagSlug]) => tagType.match(/category|product/))
      // );
      const getTagSlug = (select, selectedValue) => !selectedValue ? '' : (
        Object.values(select.tomselect.options).find(option => option.value === selectedValue).slug
      );

      if (isMulti) {
        const tagTypeIds = value;   // e.g. 'category-4', 'product-7'

        // reverse => ensures FIFO behavior
        // reduce => build the tagsFilter object, with only one instance of a given tag type
        // sort => category always goes first
        const newTagTypeIds = tagTypeIds
          .reverse()   
          .reduce((acc, tagTypeId) => {
            const tagType = tagTypeId.slice(0, tagTypeId.lastIndexOf('-'));
            const isRepeatedType = acc.find(_tagTypeId => _tagTypeId.includes(tagType));
            if (isRepeatedType) {
              return acc;
            } else {
              // build the tagsFilter object
              tagsFilter[`${tagType}`] = { 
                id: parseInt(tagTypeId.slice(tagTypeId.lastIndexOf('-') + 1), 10), 
                slug: getTagSlug(changedSelect, tagTypeId) 
              };
              return [...acc, tagTypeId];
            }
          }, [])
          .sort(categoryFirst);
        if (newTagTypeIds.length) changedSelect.tomselect.setValue(newTagTypeIds, true);

      } else {
        const tagType = singleSelectTagType(changedSelect);

        // build the tagsFilter object
        if (value) tagsFilter[`${tagType}`] = { id: parseInt(value, 10), slug: getTagSlug(changedSelect, value) };
        otherSelects.forEach(select => {
          const thisTagType = singleSelectTagType(select);
          if (!select.multiple && select.value && (thisTagType !== tagType)) {
            tagsFilter[thisTagType] = { id: parseInt(select.value, 10), slug: getTagSlug(select, select.value) }; 
          }
        });
      }
      // console.log('tagsFilter', tagsFilter)
      clearSearch();
      clearFilterResults();
      filterStories(tagsFilter).then(showResults);
      syncFilters(changedSelect, otherSelects, tagsFilter, isMulti);
      history.replaceState(null, null, `${formatTagParams(tagsFilter)}`);
    };
  }

  function onBeforeSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const query = form.querySelector('input[type="search"]').value;
    const noResultsMesg = `Sorry, we couldn't find any stories matching \"${query}\"`
    if (!query) {
      location.reload(false);   // false => reload from cache if available; true => reload from server
    } else {
      updateGallery([]);
      clearFilterSelections();
      fetch('/stories/search?' + new URLSearchParams({ query }), {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      }).then(res => res.json()).then((storyIds) => {
        const filteredStories = [...featuredStories].filter(card => storyIds.includes(parseInt(card.dataset.storyId, 10)));

        form.classList.add('was-executed');
        showResults({ search: filteredStories.length });
        updateGallery(filteredStories, noResultsMesg); 
      })
    }
  }

  function filterStories(tagsFilter) {
    let filteredStories = [...featuredStories];
    const isTagged = (card, tagType) => JSON.parse(card.dataset[tagType]).includes(tagsFilter[tagType].id);
    for (const tagType of Object.keys(tagsFilter)) {
      if (tagsFilter[tagType]) {
        filteredStories = filteredStories.filter(card => isTagged(card, tagType));
      }
    }
    const results = Object.fromEntries( 
      Object.entries(tagsFilter).reduce((activeFilters, [tagType, { id: tagId, slug: tagSlug }]) => {
        if (tagId) activeFilters.push([ tagType, [...featuredStories].filter(card => isTagged(card, tagType)).length ]);
        return activeFilters;
      }, [])
    );
    const noResultsMesg = "Sorry, we couldn't find any stories matching the selected filter(s)";
    if (Object.keys(results).length) Object.assign(results, { combined: filteredStories.length })
    updateGallery(filteredStories, noResultsMesg);
    return Promise.resolve(results);
  }
  
  function updateGallery(filteredStories, noResultsMesg) {
    const gallery = document.getElementById('stories-gallery');
    const createItem = (content) => {
      const li = document.createElement('li');
      if (typeof content === 'string') {
        li.insertAdjacentHTML('afterbegin', content);
      } else {
        li.appendChild(content);
      }
      return li;
    }
    if (!filteredStories.length && noResultsMesg) {
      gallery.replaceChildren(createItem(`<h4 id="no-search-results">${noResultsMesg}</h4>`));
    } else {
      gallery.replaceChildren(...filteredStories.map(createItem));
    }
  }

  function showResults(results) {
    // console.log('results', results)
    const format = (count) => `${count} ${count === 1 ? 'story' : 'stories'} found`;
    if (results.search) {
      document.querySelectorAll('.search-stories__results').forEach(result => {
        result.textContent = format(results.search);
      });
    } else {
      for (const [tagType, count] of Object.entries(results)) {
        document.querySelectorAll(`.stories-filter__results--${tagType}`).forEach(result => {
          result.textContent = `${tagType === 'combined' ? 'Applied filters:\xa0\xa0' : ''}${format(count)}`;
        });
      }
    }
  }

  function syncSearchInputs(e) {
    const query = e.target.value;
    [...searchForms]
      .filter(form => !form.isSameNode(this))
      .forEach(form => form.querySelector('input[type="search"]').value = query);
  }

  function syncFilters(changedSelect, otherSelects, tagsFilter, multiChanged) {
    otherSelects.forEach(select => {
      if (multiChanged) {
        select.tomselect.setValue(
          tagsFilter[singleSelectTagType(select)] ? tagsFilter[singleSelectTagType(select)].id : '', 
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
        const newTagTypeIds = Object.entries(tagsFilter)
          .flatMap(([tagType, { id: tagId }]) => tagId ? `${tagType}-${tagId}` : [])
          .sort(categoryFirst);
         multiSelect.tomselect.setValue(newTagTypeIds, true);
      }
    }
  }

  function clearSearch() {
    searchForms.forEach(form => {
      form.classList.remove('was-executed');
      form.querySelector('.search-stories__input').value = '';
      form.querySelector('.search-stories__results').textContent = ''
    })
  }

  function clearFilterSelections() {
    document.querySelectorAll('.stories-filter__select:not(.ts-wrapper)').forEach(select => select.tomselect.clear(true));
    clearFilterResults();
  }

  function clearFilterResults() {
    document.querySelectorAll('[class*="stories-filter__results"]').forEach(result => result.textContent = '');
  }

  function onMultiSelectItemAdd(ts, item) {
    item.querySelector('.clear-button').addEventListener('click', (e) => {
      e.stopPropagation();  // don't highlight active or open dropdown
      removeMultiSelectItem(ts, item);
    });
  }

  function removeMultiSelectItem(multiTomSelect, item) {
    multiTomSelect.removeItem(item.dataset.value);
    multiTomSelect.blur();

    // when the last item is removed the placeholder disappears, so set it manually (related to hidePlaceholder setting)
    if (multiTomSelect.getValue().length === 0) {
      multiTomSelect.control_input.placeholder = multiTomSelect.settings.placeholder;
    }
  };

  function sharedSelectOptions(select, otherSelects) {
    return {
      onInitialize() {
        // disallow search
        select.nextElementSibling.querySelector('input').addEventListener('keypress', (e) => e.preventDefault());
      },
      onChange: initFilterChangeHandler(select, otherSelects)
    };
  }
  
  function singleSelectOptions() {
    return {
      plugins: {
        'clear_button': {
          title: 'Clear selection',
          html: (config) => (`<button type="button" class="btn ${config.className}" title="${config.title}">&times;</button>`)
        }
      }
    };
  }

  function multiSelectOptions() {
    return { 
      hidePlaceholder: true,
      closeAfterSelect: true,
      render: {
        item: (data, escape) => {
          const tagType = (
            data.value[0].toUpperCase() + (data.value.slice(1, data.value.lastIndexOf('-')).split('-').join(' '))
          );
  
          // tom-select will add .item class to this template
          return `
            <div>
              <div>
                <span class="tag-type">${tagType}:</span>&nbsp;<span class="tag-name">${escape(data.text)}</span>
              </div>
              <button type="button" class="btn clear-button" title="Clear selection">&times;</button>
            </div>
          `
        }
      },
      onInitialize() {},
      onItemAdd(value, item) {
        // disable highlighting of item when clicked
        const observer = new MutationObserver(mutations => {
          if (item.classList.contains('active')) item.classList.remove('active');
        });
        observer.observe(item, { attributes: true })
      }
    };
  }

  function formatTagParams(tagsFilter) {
    return Object.keys(tagsFilter).length === 0 ?
      '/' :
      Object.keys(tagsFilter).reduce((params, tagType, i) => (
        params + `${i === 0 ? '?' : '&'}${tagType}=${tagsFilter[tagType].slug}`
      ), '');
  }

  function singleSelectTagType(select) {
    const tagMatch = select.className.match(/select--(?<tagType>(\w|-)+)/);
    return tagMatch ? tagMatch.groups.tagType : '';
  }

  function categoryFirst(a, b) {
    return a.includes('category') ? -1 : (b.includes('category') ? 1 : 0);
  }
})()