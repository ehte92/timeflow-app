import { taskPriorityEnum, taskStatusEnum } from '@/lib/db/schema/tasks';

describe('Database Schema', () => {
  describe('Task Priority Enum', () => {
    it('should contain all expected priority levels', () => {
      expect(taskPriorityEnum).toEqual(['low', 'medium', 'high', 'urgent']);
    });

    it('should be readonly array', () => {
      expect(taskPriorityEnum).toEqual(['low', 'medium', 'high', 'urgent']);
    });
  });

  describe('Task Status Enum', () => {
    it('should contain all expected status values', () => {
      expect(taskStatusEnum).toEqual(['todo', 'in_progress', 'completed', 'cancelled']);
    });

    it('should be readonly array', () => {
      expect(Array.isArray(taskStatusEnum)).toBe(true);
      expect(taskStatusEnum.length).toBe(4);
    });
  });
});