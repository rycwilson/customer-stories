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

searchForms.forEach(form => {
  form.addEventListener('input', syncSearchInputs);
  form.addEventListener('click', onBeforeSubmit);

  new TomSelect(form.querySelector('input[type="search"]'), {})
});

const filters = document.querySelectorAll('.stories-filter__select')
filters.forEach(filter => new TomSelect(filter, {}))

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

function syncSearchInputs (e) {
  const query = e.target.value;
  [...searchForms]
    .filter(form => !form.isSameNode(this))
    .forEach(form => form.querySelector('input[type="search"]').value = query);
      
  // $('.search-stories__input').not($(this)).val($(this).val());
  // $('.search-stories input[type="hidden"]').val($(this).val());
  // $('.search-stories__clear').hide();
}