import { describe, it, expect } from 'vitest';
import { parseClipboardRow, parseClipboardRows } from '../import-export/clipboardParser';

describe('parseClipboardRow', () => {
  it('keeps numbers with comma thousand separators as a single value', () => {
    expect(parseClipboardRow('1,000,002')).toEqual(['1,000,002']);
  });

  it('keeps numbers with comma thousand separators and decimal as a single value', () => {
    expect(parseClipboardRow('1,000,002.50')).toEqual(['1,000,002.50']);
  });

  it('keeps Vietnamese-format numbers with dot thousand separators and comma decimal as a single value', () => {
    expect(parseClipboardRow('1.000.002,50')).toEqual(['1.000.002,50']);
  });

  it('keeps plain numbers with commas as a single value', () => {
    expect(parseClipboardRow('1,234')).toEqual(['1,234']);
  });

  it('splits tab-separated rows (Excel format)', () => {
    expect(parseClipboardRow('KH001\tBank1\tpayment\t1000002\t2024-01-15')).toEqual([
      'KH001',
      'Bank1',
      'payment',
      '1000002',
      '2024-01-15',
    ]);
  });

  it('preserves numbers with comma thousand separators inside tab-separated rows', () => {
    const result = parseClipboardRow('KH001\tBank1\tpayment\t1,000,002\t2024-01-15');
    expect(result).toEqual(['KH001', 'Bank1', 'payment', '1,000,002', '2024-01-15']);
  });

  it('splits comma-separated CSV rows with non-numeric fields', () => {
    expect(parseClipboardRow('KH001,Bank1,payment,1000002,2024-01-15')).toEqual([
      'KH001',
      'Bank1',
      'payment',
      '1000002',
      '2024-01-15',
    ]);
  });

  it('splits comma-separated rows when not all segments are numeric', () => {
    expect(parseClipboardRow('KH001,1000002')).toEqual(['KH001', '1000002']);
  });

  it('returns single value when no separators present', () => {
    expect(parseClipboardRow('1000002')).toEqual(['1000002']);
  });

  it('returns single value for plain text', () => {
    expect(parseClipboardRow('Hello World')).toEqual(['Hello World']);
  });

  it('handles empty string', () => {
    expect(parseClipboardRow('')).toEqual(['']);
  });
});

describe('parseClipboardRows', () => {
  it('parses multi-line clipboard into 2D array', () => {
    expect(parseClipboardRows('KH001\t1000002\nKH002\t1,000,003')).toEqual([
      ['KH001', '1000002'],
      ['KH002', '1,000,003'],
    ]);
  });

  it('drops empty lines', () => {
    expect(parseClipboardRows('A\tB\n  \nC\tD')).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
  });

  it('handles single-line number with thousand separators', () => {
    expect(parseClipboardRows('1,000,002')).toEqual([['1,000,002']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseClipboardRows('A\tB\r\nC\tD')).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(parseClipboardRows('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(parseClipboardRows('   \n  \n  ')).toEqual([]);
  });
});
