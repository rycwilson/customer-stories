// search customer wins or contributors
export function searchTable(searchResults) {
  const subPanelCtrl = this;
  const columnFilters = subPanelCtrl.filterCheckboxTargets.map(checkbox => {
    switch(checkbox.id) {
      case 'show-wins-with-story':
        return { column: 'story', q: checkbox.checked ? '' : '^false$', regEx: true, smartSearch: false };
      case 'show-completed':
        return { column: 'status', q: checkbox.checked ? '' : '^((?!completed).)*$', regEx: true, smartSearch: false };
      case 'show-published':
        return { column: 'storyPublished', q: checkbox.checked ? '' : 'false', regEx: false, smartSearch: false }
      default: 
        console.error('Unrecognized column filter');
    }
  });
  subPanelCtrl.datatableTarget.setAttribute(
    'data-datatable-search-params-value', 
    JSON.stringify(Object.assign(
      { curatorId: subPanelCtrl.curatorSelectTarget.value },
      { columnFilters },
      searchResults ? { searchResults } : { filterVal: subPanelCtrl.filterSelectTarget.value }
    ))
  );
}