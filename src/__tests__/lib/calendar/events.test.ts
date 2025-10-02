import {
  CALENDAR_IDS,
  mergeCalendarEvents,
  transformTaskToEvent,
  transformTimeBlockToEvent,
} from "@/lib/calendar/events";
import type { Task } from "@/lib/db/schema/tasks";
import type { TimeBlock } from "@/lib/db/schema/time-blocks";

describe("Calendar Events Utilities", () => {
  describe("transformTaskToEvent", () => {
    it("should return null for tasks without due dates", () => {
      const task: Task = {
        id: "task-1",
        title: "Task without due date",
        description: "Description",
        priority: "medium",
        status: "todo",
        userId: "user-1",
        categoryId: null,
        dueDate: null,
        estimatedMinutes: null,
        actualMinutes: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTaskToEvent(task);
      expect(result).toBeNull();
    });

    it("should transform all-day task correctly (midnight UTC)", () => {
      const task: Task = {
        id: "task-1",
        title: "All-day task",
        description: "Description",
        priority: "high",
        status: "todo",
        userId: "user-1",
        categoryId: null,
        dueDate: new Date("2025-10-05T00:00:00.000Z"),
        estimatedMinutes: null,
        actualMinutes: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTaskToEvent(task);

      expect(result?.id).toBe("task-task-1");
      expect(result?.title).toBe("All-day task");
      expect(result?.description).toBe("Description");
      expect(result?.calendarId).toBe(CALENDAR_IDS.TASK_HIGH);
      expect(result?.start.toString()).toBe("2025-10-05");
      expect(result?.end.toString()).toBe("2025-10-05");
    });

    it("should transform timed task correctly", () => {
      const task: Task = {
        id: "task-2",
        title: "Timed task",
        description: "Description",
        priority: "urgent",
        status: "todo",
        userId: "user-1",
        categoryId: null,
        dueDate: new Date("2025-10-05T14:30:00.000Z"),
        estimatedMinutes: null,
        actualMinutes: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTaskToEvent(task);

      expect(result).toMatchObject({
        id: "task-task-2",
        title: "Timed task",
        description: "Description",
        calendarId: CALENDAR_IDS.TASK_CRITICAL,
      });
      expect(result?.start.toString()).toBe("2025-10-05T14:30:00+00:00[UTC]");
      // End time should be 1 hour after start
      expect(result?.end.toString()).toBe("2025-10-05T15:30:00+00:00[UTC]");
    });

    it("should assign correct calendar ID based on priority", () => {
      const priorities = [
        { priority: "urgent", expectedId: CALENDAR_IDS.TASK_CRITICAL },
        { priority: "high", expectedId: CALENDAR_IDS.TASK_HIGH },
        { priority: "medium", expectedId: CALENDAR_IDS.TASK_MEDIUM },
        { priority: "low", expectedId: CALENDAR_IDS.TASK_LOW },
      ] as const;

      for (const { priority, expectedId } of priorities) {
        const task: Task = {
          id: "task-1",
          title: "Task",
          description: null,
          priority,
          status: "todo",
          userId: "user-1",
          categoryId: null,
          dueDate: new Date("2025-10-05T14:00:00.000Z"),
          estimatedMinutes: null,
          actualMinutes: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = transformTaskToEvent(task);
        expect(result?.calendarId).toBe(expectedId);
      }
    });

    it("should handle task without description", () => {
      const task: Task = {
        id: "task-1",
        title: "Task without description",
        description: null,
        priority: "medium",
        status: "todo",
        userId: "user-1",
        categoryId: null,
        dueDate: new Date("2025-10-05T14:00:00.000Z"),
        estimatedMinutes: null,
        actualMinutes: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTaskToEvent(task);
      expect(result?.description).toBeUndefined();
    });
  });

  describe("transformTimeBlockToEvent", () => {
    it("should transform time block correctly", () => {
      const timeBlock: TimeBlock = {
        id: "block-1",
        title: "Morning Standup",
        type: "scheduled",
        startTime: new Date("2025-10-05T09:00:00.000Z"),
        endTime: new Date("2025-10-05T09:30:00.000Z"),
        description: "Daily team meeting",
        taskId: null,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTimeBlockToEvent(timeBlock);

      expect(result.id).toBe("timeblock-block-1");
      expect(result.start.toString()).toBe("2025-10-05T09:00:00+00:00[UTC]");
      expect(result.end.toString()).toBe("2025-10-05T09:30:00+00:00[UTC]");
      expect(result.title).toBe("Morning Standup");
      expect(result.description).toBe("Daily team meeting");
      expect(result.calendarId).toBe(CALENDAR_IDS.TIMEBLOCK_SCHEDULED);
    });

    it("should assign correct calendar ID based on type", () => {
      const types = [
        { type: "scheduled", expectedId: CALENDAR_IDS.TIMEBLOCK_SCHEDULED },
        { type: "actual", expectedId: CALENDAR_IDS.TIMEBLOCK_ACTUAL },
        { type: "break", expectedId: CALENDAR_IDS.TIMEBLOCK_BREAK },
      ] as const;

      for (const { type, expectedId } of types) {
        const timeBlock: TimeBlock = {
          id: "block-1",
          title: null,
          type,
          startTime: new Date("2025-10-05T09:00:00.000Z"),
          endTime: new Date("2025-10-05T09:30:00.000Z"),
          description: null,
          taskId: null,
          userId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = transformTimeBlockToEvent(timeBlock);
        expect(result.calendarId).toBe(expectedId);
      }
    });

    it("should use default title when time block has no title", () => {
      const timeBlock: TimeBlock = {
        id: "block-1",
        title: null,
        type: "break",
        startTime: new Date("2025-10-05T12:00:00.000Z"),
        endTime: new Date("2025-10-05T13:00:00.000Z"),
        description: null,
        taskId: null,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTimeBlockToEvent(timeBlock);
      expect(result.title).toBe("break time block");
    });

    it("should handle time block without description", () => {
      const timeBlock: TimeBlock = {
        id: "block-1",
        title: "Focus Time",
        type: "scheduled",
        startTime: new Date("2025-10-05T14:00:00.000Z"),
        endTime: new Date("2025-10-05T16:00:00.000Z"),
        description: null,
        taskId: null,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = transformTimeBlockToEvent(timeBlock);
      expect(result.description).toBeUndefined();
    });
  });

  describe("mergeCalendarEvents", () => {
    it("should merge tasks and time blocks into single array", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Task 1",
          description: null,
          priority: "high",
          status: "todo",
          userId: "user-1",
          categoryId: null,
          dueDate: new Date("2025-10-05T10:00:00.000Z"),
          estimatedMinutes: null,
          actualMinutes: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "task-2",
          title: "Task 2",
          description: null,
          priority: "medium",
          status: "todo",
          userId: "user-1",
          categoryId: null,
          dueDate: new Date("2025-10-06T14:00:00.000Z"),
          estimatedMinutes: null,
          actualMinutes: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const timeBlocks: TimeBlock[] = [
        {
          id: "block-1",
          title: "Meeting",
          type: "scheduled",
          startTime: new Date("2025-10-05T09:00:00.000Z"),
          endTime: new Date("2025-10-05T10:00:00.000Z"),
          description: null,
          taskId: null,
          userId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = mergeCalendarEvents(tasks, timeBlocks);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("task-task-1");
      expect(result[1].id).toBe("task-task-2");
      expect(result[2].id).toBe("timeblock-block-1");
    });

    it("should filter out tasks without due dates", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Task with due date",
          description: null,
          priority: "high",
          status: "todo",
          userId: "user-1",
          categoryId: null,
          dueDate: new Date("2025-10-05T10:00:00.000Z"),
          estimatedMinutes: null,
          actualMinutes: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "task-2",
          title: "Task without due date",
          description: null,
          priority: "medium",
          status: "todo",
          userId: "user-1",
          categoryId: null,
          dueDate: null,
          estimatedMinutes: null,
          actualMinutes: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = mergeCalendarEvents(tasks, []);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("task-task-1");
    });

    it("should handle empty arrays", () => {
      const result = mergeCalendarEvents([], []);
      expect(result).toEqual([]);
    });

    it("should handle undefined inputs", () => {
      const result = mergeCalendarEvents();
      expect(result).toEqual([]);
    });
  });
});
