import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// utils.ts imports FetchRequest at the top level; it has no runtime in Node/jsdom.
// Mocking the module here prevents the import from failing — we're not testing getJSON.
vi.mock('@rails/request.js', () => ({ FetchRequest: vi.fn() }));

import {
  copyToClipboard,
  debounce,
  distinctItems,
  distinctObjects,
  parseDatasetObject,
  setCustomButtonProps,
} from '../../src/utils';

describe('parseDatasetObject', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
  });

  it('parses a valid JSON dataset property', () => {
    el.dataset.config = JSON.stringify({ name: 'test', count: 5 });
    expect(parseDatasetObject(el, 'config')).toEqual({ name: 'test', count: 5 });
  });

  it('returns the object when all required properties are present', () => {
    el.dataset.config = JSON.stringify({ name: 'test', count: 5 });
    expect(parseDatasetObject(el, 'config', 'name', 'count')).toEqual({ name: 'test', count: 5 });
  });

  it('returns null when a required property is missing from the parsed object', () => {
    el.dataset.config = JSON.stringify({ name: 'test' });
    expect(parseDatasetObject(el, 'config', 'name', 'missing')).toBeNull();
  });

  it('returns null when the dataset property does not exist', () => {
    expect(parseDatasetObject(el, 'nonexistent')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    el.dataset.bad = 'not { json';
    expect(parseDatasetObject(el, 'bad')).toBeNull();
  });
});

describe('setCustomButtonProps', () => {
  it('sets the background and color CSS custom properties', () => {
    const btn = document.createElement('button');
    btn.dataset.bgColor = '#ff0000';
    btn.dataset.color = '#ffffff';
    setCustomButtonProps(btn);

    expect(btn.style.getPropertyValue('--btn-custom-bg')).toBe('#ff0000');
    expect(btn.style.getPropertyValue('--btn-custom-color')).toBe('#ffffff');
  });

  it('sets non-empty darkened background variants via tinycolor2', () => {
    const btn = document.createElement('button');
    btn.dataset.bgColor = '#ff0000';
    btn.dataset.color = '#ffffff';
    setCustomButtonProps(btn);

    const base = btn.style.getPropertyValue('--btn-custom-bg');
    const darkened = btn.style.getPropertyValue('--btn-custom-bg-darken-10');
    expect(darkened).not.toBe('');
    expect(darkened).not.toBe(base);
  });
});



// ─── Debounce (fake timers) ───────────────────────────────────────────────────
//
// vi.useFakeTimers() takes over setTimeout/clearTimeout so tests can advance
// the clock manually rather than waiting in real time.

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not invoke the callback before the wait elapses', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('resets the timer when called again before the wait elapses', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();               // reset — the clock restarts from here
    vi.advanceTimersByTime(50);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50); // now the second wait has fully elapsed
    expect(callback).toHaveBeenCalledOnce();
  });

  it('invokes the callback only once for rapid successive calls', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledOnce();
  });
});

// ─── Clipboard (mocked browser API) ──────────────────────────────────────────

describe('copyToClipboard', () => {
  it('uses navigator.clipboard in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });

    await copyToClipboard('hello world');
    expect(writeText).toHaveBeenCalledWith('hello world');
  });

  it('falls back to execCommand when the clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    // vi.spyOn requires the method to already exist; jsdom doesn't implement execCommand,
    // so we define the mock directly instead.
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    await copyToClipboard('fallback text');
    expect(execCommand).toHaveBeenCalledWith('copy');
  });
});

describe('distinctItems', () => {
  it('removes duplicate numbers', () => {
    expect(distinctItems([1, 2, 2, 3, 3])).toEqual([1, 2, 3]);
  });

  it('removes duplicate strings', () => {
    expect(distinctItems(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('returns an empty array unchanged', () => {
    expect(distinctItems([])).toEqual([]);
  });

  it('returns an all-unique array unchanged', () => {
    expect(distinctItems([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('distinctObjects', () => {
  it('keeps the last occurrence when objects share a key value', () => {
    const input = [{ id: 1, name: 'first' }, { id: 2, name: 'second' }, { id: 1, name: 'dupe' }];
    expect(distinctObjects(input, 'id')).toEqual([{ id: 1, name: 'dupe' }, { id: 2, name: 'second' }]);
  });

  it('returns the same array when key values are already unique', () => {
    const input = [{ id: 1, name: 'first' }, { id: 2, name: 'second' }];
    expect(distinctObjects(input, 'id')).toEqual(input);
  });

  it('returns an empty array unchanged', () => {
    expect(distinctObjects([], 'id')).toEqual([]);
  });
});

// Modified by Copilot
