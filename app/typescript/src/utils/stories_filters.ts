export const STORY_FILTER_KEYS = ['curator', 'status', 'customer', 'category', 'product'] as const;

type FilterValue = number | string | null | undefined;
type Filters = { [key: string]: FilterValue | boolean };

/** The story filters that currently have a selected value (blank, null and 0 are "not selected"). */
export function activeFilters(filters: Filters = {}) {
  return STORY_FILTER_KEYS
    .filter(key => filters[key] && filters[key] !== '0')
    .map(key => [key, String(filters[key])] as const);
}

export function activeFilterCount(filters: Filters = {}) {
  return activeFilters(filters).length;
}

export function haveSameActiveFilters(a: Filters = {}, b: Filters = {}) {
  return JSON.stringify(activeFilters(a)) === JSON.stringify(activeFilters(b));
}

/**
 * Query params for the stories index. A search string takes precedence over filters, since the two
 * are mutually exclusive. `match_type` only applies when more than one filter is selected.
 */
export function buildStoriesParams(
  filters: Filters = {}, 
  searchString = '', 
  matchType: 'all' | 'any' = 'all'
) {
  const params = new URLSearchParams();
  if (searchString) {
    params.set('q', searchString);
    return params;
  }
  const active = activeFilters(filters);
  active.forEach(([key, value]) => params.set(key, value));
  if (active.length > 1) params.set('match_type', matchType);
  return params;
}
