import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-blue-500', 'text-white')).toBe('bg-blue-500 text-white');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base-class', undefined, null)).toBe('base-class');
    });

    it('should override conflicting Tailwind classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
  });
});