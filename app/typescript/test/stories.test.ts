import { jest, describe, expect, test, beforeAll, beforeEach, it } from '@jest/globals';
import { testExports } from '../src/stories';

const { foo } = testExports;

describe('foo', () => {
  it('should return the sum of two numbers', () => {
    const result = foo(2, 3);
    expect(result).toBe(5);
  });

  it('should return NaN if any of the arguments is not a number', () => {
    const result = foo(2, NaN);
    expect(result).toBeNaN();
  });
});