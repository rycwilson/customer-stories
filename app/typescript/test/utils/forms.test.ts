import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  serializeForm,
} from '../../src/utils';

describe('serializeForm', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    document.body.appendChild(form);
  });

  afterEach(() => {
    form.remove();
  });

  it('serializes form inputs to a query string', () => {
    form.innerHTML = '<input name="foo" value="bar"><input name="baz" value="qux">';
    expect(serializeForm(form)).toBe('foo=bar&baz=qux');
  });

  it('excludes the authenticity_token field', () => {
    form.innerHTML = '<input name="authenticity_token" value="xyz"><input name="foo" value="bar">';
    expect(serializeForm(form)).toBe('foo=bar');
  });

  it('returns an empty string for a form with no inputs', () => {
    expect(serializeForm(form)).toBe('');
  });
});