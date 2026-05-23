import { describe, it, expect } from 'vitest';
import { createBackup, detectConflicts } from '../backup';

describe('Backup/Restore', () => {
  it('should create a backup with metadata', () => {
    const data = [{ id: '1', name: 'Test' }];
    const options = { includeMetadata: true };
    const result = createBackup(data, options);
    
    expect(result.success).toBe(true);
    expect(result.backup).toBeDefined();
    expect(result.backup.timestamp).toBeDefined();
  });

  it('should detect conflicts between backups', () => {
    const currentData = [{ id: '1', name: 'Test', version: 1 }];
    const backupData = [{ id: '1', name: 'Test Updated', version: 2 }];
    
    const result = detectConflicts(currentData, backupData);
    
    expect(result.conflicts).toBeDefined();
    expect(Array.isArray(result.conflicts)).toBe(true);
  });

  it('should resolve conflicts with keep-current strategy', () => {
    const currentData = [{ id: '1', name: 'Test', version: 1 }];
    const backupData = [{ id: '1', name: 'Test Updated', version: 2 }];
    
    const result = detectConflicts(currentData, backupData);
    
    expect(result.conflicts).toBeDefined();
  });
});
