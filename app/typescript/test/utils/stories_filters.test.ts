import { describe, it, expect } from 'vitest';
import {
  activeFilterCount,
  buildStoriesParams,
  haveSameActiveFilters,
} from '../../src/utils/stories_filters';

describe('activeFilterCount', () => {
  it('counts only filters with a selected value', () => {
    expect(activeFilterCount({ curator: 1, status: '', customer: null, category: '3' })).toBe(2);
  });

  it('ignores keys that are not story filters', () => {
    expect(activeFilterCount({ 'show-completed': true })).toBe(0);
  });

  it('handles missing filters', () => {
    expect(activeFilterCount()).toBe(0);
  });
});

describe('haveSameActiveFilters', () => {
  it('treats blank, null and missing values alike', () => {
    expect(haveSameActiveFilters({ curator: null }, {})).toBe(true);
    expect(haveSameActiveFilters({ status: '' }, { status: undefined })).toBe(true);
  });

  it('treats numeric and string ids alike', () => {
    expect(haveSameActiveFilters({ curator: 2 }, { curator: '2' })).toBe(true);
  });

  it('detects a changed filter', () => {
    expect(haveSameActiveFilters({ curator: 2 }, { curator: 3 })).toBe(false);
    expect(haveSameActiveFilters({ curator: 2 }, {})).toBe(false);
  });
});

describe('buildStoriesParams', () => {
  it('is empty without filters or a search string', () => {
    expect(buildStoriesParams({}, '').toString()).toBe('');
  });

  it('omits match_type when only one filter is selected', () => {
    expect(buildStoriesParams({ curator: 1 }, '', 'any').toString()).toBe('curator=1');
  });

  it('includes match_type when multiple filters are selected', () => {
    const params = buildStoriesParams({ curator: 1, category: '4' }, '', 'any');
    expect(params.toString()).toBe('curator=1&category=4&match_type=any');
  });

  it('uses only the search string when one is present', () => {
    const params = buildStoriesParams({ curator: 1, category: '4' }, 'acme', 'all');
    expect(params.toString()).toBe('q=acme');
  });
});
