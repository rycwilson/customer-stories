(function CSP() {
  const searchContainers = [...document.querySelectorAll('.search-and-filters')]
  for (container of searchContainers) container.setAttribute('data-init', 'true')
  
  const searchForms = document.querySelectorAll('form.search-stories');
  const searchResults = document.querySelectorAll('\
    .search-stories__results, \
    .stories-filter__results--category, \
    .stories-filter__results--product, \
    .search-and-filters__results--combined \
  ')
  // console.log(searchForms, searchResults)
  
  const gallery = document.getElementById('stories-gallery');
  const featuredStories = gallery.querySelectorAll('.story-card');
  searchForms.forEach(form => {
    form.addEventListener('input', syncSearchInputs);
    form.addEventListener('click', onBeforeSubmit);
  
    new TomSelect(form.querySelector('input[type="search"]'), {})
  });

  // console.log('featuredStories', featuredStories)
  
  initFilters();

  function initFilters() {
    const filters = document.querySelectorAll('.stories-filter__select:not(.ts-wrapper)');
    filters.forEach(select => {
      const otherSelects = [...filters].filter(_select => !_select.isSameNode(select));
      const tsOptions = Object.assign(
        sharedSelectOptions(select, otherSelects),  
        select.multiple ? multiSelectOptions() : singleSelectOptions()
      );
      const ts = new TomSelect(select, tsOptions);
      if (select.multiple) ts.on('item_add', (value, item) => onMultiSelectItemAdd(ts, item));
    })
  }
  
  function initFilterChangeHandler(changedSelect, otherSelects) {
    return function onFilterChange(value) {
      console.log('change', value)
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

      // console.log('urlParams', urlParams)
      console.log('tagsFilter', tagsFilter)

      syncFilters(changedSelect, otherSelects, tagsFilter, isMulti);
      filterStories(tagsFilter).then(showFilterResults);
      history.replaceState(null, null, `${formatTagParams(tagsFilter)}`)
    };
  }

  function onBeforeSubmit({ target, currentTarget: form }) {
    if (target.type !== 'submit') return false;
    if (form.querySelector('input[type="search"]').value === '') {
      location.reload(false);   // false => reload from cache if available; true => reload from server
    } else {
      searchResults.forEach(result => result.textContent = '');
      // replaceStateStoriesIndex('', '');
      //form.submit();
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
    if (Object.keys(results).length) Object.assign(results, { combined: filteredStories.length })
    gallery.replaceChildren(...filteredStories.map(card => {
      const li = document.createElement('li');
      li.appendChild(card);
      return li;
    }));
    return Promise.resolve(results);
  }

  function syncSearchInputs(e) {
    const query = e.target.value;
    [...searchForms]
      .filter(form => !form.isSameNode(this))
      .forEach(form => form.querySelector('input[type="search"]').value = query);
        
    // $('.search-stories__input').not($(this)).val($(this).val());
    // $('.search-stories input[type="hidden"]').val($(this).val());
    // $('.search-stories__clear').hide();
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

  function showFilterResults(results) {
    console.log('results', results)
    clearFilterResults();
    for (const [tagType, count] of Object.entries(results)) {
      document.querySelectorAll(`.stories-filter__results--${tagType}`).forEach(result => {
        result.textContent = `
          ${tagType === 'combined' ? 'Applied filters:\xa0\xa0' : ''}${count} ${count === 1 ? 'story' : 'stories'} found
        `;
      });
    }
  }

  function clearFilterResults() {
    document.querySelectorAll('[class*="stories-filter__results"]').forEach(result => result.textContent = '');
  }

  function onMultiSelectItemAdd(multiTomSelect, item) {
    item.querySelector('.clear-button').addEventListener('click', (e) => {
      e.stopPropagation();  // don't open dropdown
      removeMultiSelectItem(multiTomSelect, item);
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
          html: (config) => (`<div class="${config.className}" title="${config.title}"><div>&times;</div></div>`)
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
              <div class="clear-button" title="Clear selection">&times;</div>
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