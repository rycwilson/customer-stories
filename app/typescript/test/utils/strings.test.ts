import { describe, it, expect } from 'vitest';

import {
  capitalize,
  convertCase,
  formatPercent,
  trimHtml,
} from '../../src/utils';

describe('formatPercent', () => {
  it('returns "0%" when total is zero', () => {
    expect(formatPercent(0, 0)).toBe('0%');
  });

  it('omits decimals when the result is a whole number', () => {
    expect(formatPercent(50, 100)).toBe('50%');
    expect(formatPercent(100, 100)).toBe('100%');
  });

  it('uses one decimal place by default', () => {
    expect(formatPercent(1, 3)).toBe('33.3%');
  });

  it('respects a custom decimal count', () => {
    expect(formatPercent(1, 3, 2)).toBe('33.33%');
  });
});

describe('capitalize', () => {
  it('uppercases the first character', () => expect(capitalize('hello')).toBe('Hello'));
  it('leaves an already-capitalized string unchanged', () => expect(capitalize('Hello')).toBe('Hello'));
  it('handles a single character', () => expect(capitalize('a')).toBe('A'));
  it('handles an empty string', () => expect(capitalize('')).toBe(''));
});

describe('convertCase', () => {
  const caseExamples = { 
    camel: 'helloWorld',  pascal: 'HelloWorld', kebab: 'hello-world', snake: 'hello_world' 
  };
  const convertsTo = (targetCase: 'camel' | 'pascal' | 'kebab' | 'snake') => () => (
    [ 
      { label: 'PascalCase', input: 'HelloWorld' },
      { label: 'kebab-case', input: 'hello-world' },
      { label: 'snake_case', input: 'hello_world' },
      { label: 'camelCase', input: 'helloWorld' } 
    ].forEach(({ input }) => {
      expect(convertCase(input, targetCase)).toBe(caseExamples[targetCase]);
    })
  )
  it('converts to camel case correctly', convertsTo('camel'));

  it('converts to pascal case correctly', convertsTo('pascal'));

  it('converts to kebab case correctly', convertsTo('kebab'));

  it('converts to snake case correctly', convertsTo('snake'));

  it('returns the input when input is an unsupported format', () => {
    const unsupported = ['has spaces', 'has-mixedCase', '', '123startsWithNumber', 'special$chars'];
    Object.keys(caseExamples).forEach((targetCase) => {
      unsupported.forEach(input => expect(convertCase(input, targetCase)).toBe(input));
    });
  });
});

describe('trimHtml', () => {
  it('removes whitespace between tags', () => {
    expect(trimHtml('<div>  <span>hello</span>  </div>')).toBe('<div><span>hello</span></div>');
  });

  it('collapses multiple spaces within content to one', () => {
    expect(trimHtml('<p>hello   world</p>')).toBe('<p>hello world</p>');
  });

  it('removes newlines', () => {
    expect(trimHtml('<p>\nhello\n</p>')).toBe('<p>hello</p>');
  });

  it('trims leading and trailing whitespace', () => {
    expect(trimHtml('  <p>hello</p>  ')).toBe('<p>hello</p>');
  });
});