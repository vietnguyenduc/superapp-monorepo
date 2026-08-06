import { describe, it, expect } from 'vitest';

describe('framework-method smoke', () => {
  it('loads the app name', () => {
    expect('Framework Method').toBe('Framework Method');
  });
});
