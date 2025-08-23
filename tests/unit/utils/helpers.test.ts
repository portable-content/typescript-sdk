/**
 * @fileoverview Tests for utility helper functions
 */

import { isDefined, deepClone, debounce } from '../../../src/utils/helpers';

describe('isDefined', () => {
  it('should return true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined([])).toBe(true);
    expect(isDefined({})).toBe(true);
    expect(isDefined('hello')).toBe(true);
    expect(isDefined(42)).toBe(true);
    expect(isDefined(true)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it('should provide proper type narrowing', () => {
    const value: string | null | undefined = 'test';
    
    if (isDefined(value)) {
      // TypeScript should know value is string here
      expect(value.length).toBe(4);
    }
  });

  it('should work with arrays and filter', () => {
    const array = [1, null, 2, undefined, 3];
    const filtered = array.filter(isDefined);
    
    expect(filtered).toEqual([1, 2, 3]);
    expect(filtered.length).toBe(3);
  });
});

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it('should clone simple objects', () => {
    const original = { a: 1, b: 'test', c: true };
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    
    // Modifying clone should not affect original
    cloned.a = 999;
    expect(original.a).toBe(1);
  });

  it('should clone nested objects', () => {
    const original = {
      level1: {
        level2: {
          value: 'deep'
        },
        array: [1, 2, 3]
      }
    };
    
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.level1).not.toBe(original.level1);
    expect(cloned.level1.level2).not.toBe(original.level1.level2);
    expect(cloned.level1.array).not.toBe(original.level1.array);
    
    // Modifying nested values should not affect original
    cloned.level1.level2.value = 'modified';
    cloned.level1.array.push(4);
    
    expect(original.level1.level2.value).toBe('deep');
    expect(original.level1.array).toEqual([1, 2, 3]);
  });

  it('should clone arrays', () => {
    const original = [1, 'test', { nested: true }, [1, 2, 3]];
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[2]).not.toBe(original[2]);
    expect(cloned[3]).not.toBe(original[3]);
    
    // Modifying clone should not affect original
    cloned[0] = 999;
    (cloned[2] as any).nested = false;
    (cloned[3] as number[]).push(4);
    
    expect(original[0]).toBe(1);
    expect((original[2] as any).nested).toBe(true);
    expect(original[3]).toEqual([1, 2, 3]);
  });

  it('should clone Date objects', () => {
    const original = new Date(2023, 0, 1); // January 1, 2023 (month is 0-indexed)
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned instanceof Date).toBe(true);

    // Modifying clone should not affect original
    const originalYear = original.getFullYear();
    cloned.setFullYear(2024);
    expect(original.getFullYear()).toBe(originalYear);
  });

  it('should handle complex nested structures', () => {
    const original = {
      string: 'test',
      number: 42,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      date: new Date(2023, 0, 1),
      array: [1, { nested: 'value' }, [1, 2]],
      object: {
        deep: {
          deeper: {
            value: 'very deep'
          }
        }
      }
    };
    
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    
    // Test all nested references are different
    expect(cloned.date).not.toBe(original.date);
    expect(cloned.array).not.toBe(original.array);
    expect(cloned.array[1]).not.toBe(original.array[1]);
    expect(cloned.array[2]).not.toBe(original.array[2]);
    expect(cloned.object).not.toBe(original.object);
    expect(cloned.object.deep).not.toBe(original.object.deep);
    expect(cloned.object.deep.deeper).not.toBe(original.object.deep.deeper);
  });

  it('should handle circular references gracefully', () => {
    // Note: This implementation doesn't handle circular references
    // but we should test that it doesn't crash on simple cases
    const obj: any = { a: 1 };
    obj.self = obj;
    
    // This will cause infinite recursion, so we expect it to throw
    expect(() => deepClone(obj)).toThrow();
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('first');
    jest.advanceTimersByTime(50);
    
    debouncedFn('second');
    jest.advanceTimersByTime(50);
    
    // First call should be cancelled, only second should execute
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('second');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('arg1', 'arg2', 42);
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 42);
  });

  it('should work with different wait times', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);
    
    debouncedFn('test');
    jest.advanceTimersByTime(100);
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should handle rapid successive calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    // Make 10 rapid calls
    for (let i = 0; i < 10; i++) {
      debouncedFn(`call-${i}`);
      jest.advanceTimersByTime(10);
    }
    
    // Only the last call should be pending
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('call-9');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should work with typed functions', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Should accept parameters and pass them through
    debouncedFn(1, 2);
    jest.advanceTimersByTime(100);

    // Function should have been called with correct parameters
    expect(mockFn).toHaveBeenCalledWith(1, 2);
  });
});
