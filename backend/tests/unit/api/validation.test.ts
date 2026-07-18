import {
  getMissingFields,
  isNonEmptyString,
  isNumber,
  isStringArray,
  parseJsonBody,
} from '../../../app/api/_lib/validation';

describe('validation primitives', () => {
  it('isNonEmptyString rejects empty strings and non-strings', () => {
    expect(isNonEmptyString('a')).toBe(true);
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString(1)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });

  it('isStringArray requires every element to be a string', () => {
    expect(isStringArray(['a', 'b'])).toBe(true);
    expect(isStringArray(['a', 1])).toBe(false);
    expect(isStringArray('a')).toBe(false);
  });

  it('isNumber rejects NaN and non-numbers', () => {
    expect(isNumber(1)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber('1')).toBe(false);
  });

  it('getMissingFields reports only the fields that are missing, null, or undefined', () => {
    const body = { a: 'x', b: null, c: undefined };

    expect(getMissingFields(body, ['a', 'b', 'c', 'd'])).toEqual(['b', 'c', 'd']);
  });
});

describe('parseJsonBody', () => {
  it('returns the parsed object for valid JSON', async () => {
    const request = new Request('http://localhost/api/v1/health', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });

    expect(await parseJsonBody(request)).toEqual({ a: 1 });
  });

  it('returns null for malformed JSON rather than throwing', async () => {
    const request = new Request('http://localhost/api/v1/health', {
      method: 'POST',
      body: '{not valid json',
    });

    expect(await parseJsonBody(request)).toBeNull();
  });

  it('returns null for a JSON array (not an object)', async () => {
    const request = new Request('http://localhost/api/v1/health', {
      method: 'POST',
      body: JSON.stringify([1, 2, 3]),
    });

    expect(await parseJsonBody(request)).toBeNull();
  });
});
