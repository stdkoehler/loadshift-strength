import { describe, expect, it } from 'vitest';
import { addDays, dowName, dowShort, formatDate, fmt } from './date';

describe('addDays', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2024-01-30', 3)).toBe('2024-02-02');
  });
  it('subtracts days with a negative offset', () => {
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
  });
});

describe('dowName / dowShort', () => {
  it('names 2024-01-01 (a Monday) correctly', () => {
    expect(dowName('2024-01-01')).toBe('Monday');
    expect(dowShort('2024-01-01')).toBe('Mon');
  });
});

describe('formatDate', () => {
  it('formats as DD.MM.YYYY', () => {
    expect(formatDate('2024-03-05')).toBe('05.03.2024');
  });
});

describe('fmt', () => {
  it('rounds to 2 decimals and stringifies', () => {
    expect(fmt(89.456)).toBe('89.46');
  });
  it('returns empty string for null/undefined/NaN', () => {
    expect(fmt(null)).toBe('');
    expect(fmt(undefined)).toBe('');
    expect(fmt(NaN)).toBe('');
  });
});
