import { describe, it, expect } from 'vitest';
import { exportToCSV, exportToJSON, generateTemplate } from '../import-export';

describe('Import/Export', () => {
  it('should export data to CSV format', () => {
    const data = [
      { name: 'Test 1', value: 100 },
      { name: 'Test 2', value: 200 },
    ];
    const result = exportToCSV(data, { fileName: 'test.csv' });
    
    expect(result.success).toBe(true);
    expect(result.filename).toBe('test.csv');
  });

  it('should export data to JSON format', () => {
    const data = [
      { name: 'Test 1', value: 100 },
      { name: 'Test 2', value: 200 },
    ];
    const result = exportToJSON(data, { fileName: 'test.json' });
    
    expect(result.success).toBe(true);
    expect(result.filename).toBe('test.json');
  });

  it('should generate a template file', () => {
    const columns = ['name', 'value', 'date'];
    const result = generateTemplate(columns, 'template.csv');
    
    expect(result.success).toBe(true);
    expect(result.filename).toBe('template.csv');
  });
});
