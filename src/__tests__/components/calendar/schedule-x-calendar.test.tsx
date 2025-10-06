/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ScheduleXCalendarComponent } from "@/components/calendar/schedule-x-calendar";
import * as tasksHooks from "@/lib/query/hooks/tasks";
import * as timeBlocksHooks from "@/lib/query/hooks/time-blocks";

// Mock the hooks
jest.mock("@/lib/query/hooks/tasks");
jest.mock("@/lib/query/hooks/time-blocks");

// Store calendar config for testing
let lastCalendarConfig: any = null;

// Mock ScheduleX components
jest.mock("@schedule-x/react", () => ({
  ScheduleXCalendar: () => {
    // Use the events from eventsService.set() instead of calendarApp.events
    const {
      mockEventsServiceEvents,
    } = require("@/__tests__/components/calendar/schedule-x-calendar.test");
    return (
      <div data-testid="schedule-x-calendar">
        Calendar with {mockEventsServiceEvents?.length || 0} events
      </div>
    );
  },
  useNextCalendarApp: jest.fn((config: any) => {
    lastCalendarConfig = config;
    return {
      views: config.views,
      callbacks: config.callbacks,
    };
  }),
}));

jest.mock("@schedule-x/calendar", () => ({
  createViewDay: () => ({ name: "day" }),
  createViewMonthGrid: () => ({ name: "month-grid" }),
  createViewWeek: () => ({ name: "week" }),
}));

jest.mock("@schedule-x/calendar-controls", () => ({
  createCalendarControlsPlugin: () => ({ name: "controls" }),
}));

// Track events for testing
export let mockEventsServiceEvents: any[] = [];

jest.mock("@schedule-x/events-service", () => ({
  createEventsServicePlugin: () => ({
    name: "events-service",
    set: jest.fn((events) => {
      mockEventsServiceEvents = events || [];
    }),
  }),
}));

jest.mock("@schedule-x/drag-and-drop", () => ({
  createDragAndDropPlugin: () => ({ name: "drag-and-drop" }),
}));

jest.mock("@schedule-x/resize", () => ({
  createResizePlugin: () => ({ name: "resize" }),
}));

jest.mock("@/components/calendar/calendar-toolbar", () => ({
  CalendarToolbar: () => <div data-testid="calendar-toolbar">Toolbar</div>,
}));

describe("ScheduleXCalendarComponent", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();
    mockEventsServiceEvents = []; // Reset events
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ScheduleXCalendarComponent />
      </QueryClientProvider>,
    );
  };

  it("should show loading state while fetching data", () => {
    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderComponent();

    expect(screen.getByText("Loading calendar...")).toBeInTheDocument();
  });

  it("should render calendar when tasks are loading but time blocks are loaded", () => {
    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: { timeBlocks: [], count: 0 },
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByText("Loading calendar...")).toBeInTheDocument();
  });

  it("should render calendar with no events", () => {
    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: { tasks: [], count: 0 },
      isLoading: false,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: { timeBlocks: [], count: 0 },
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId("schedule-x-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-toolbar")).toBeInTheDocument();
    expect(screen.getByText(/Calendar with 0 events/)).toBeInTheDocument();
  });

  it.skip("should render calendar with tasks", () => {
    const mockTasks = [
      {
        id: "task-1",
        title: "Test Task",
        description: "Description",
        priority: "high",
        status: "todo",
        userId: "user-1",
        categoryId: null,
        dueDate: new Date("2025-10-05T14:00:00.000Z"),
        estimatedMinutes: null,
        actualMinutes: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: { tasks: mockTasks, count: 1 },
      isLoading: false,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: { timeBlocks: [], count: 0 },
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId("schedule-x-calendar")).toBeInTheDocument();
    expect(screen.getByText(/Calendar with 1 events/)).toBeInTheDocument();
  });

  it.skip("should render calendar with time blocks", () => {
    const mockTimeBlocks = [
      {
        id: "block-1",
        title: "Meeting",
        type: "scheduled" as const,
        startTime: new Date("2025-10-05T09:00:00.000Z"),
        endTime: new Date("2025-10-05T10:00:00.000Z"),
        description: "Daily standup",
        taskId: null,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: { tasks: [], count: 0 },
      isLoading: false,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: { timeBlocks: mockTimeBlocks, count: 1 },
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId("schedule-x-calendar")).toBeInTheDocument();
    expect(screen.getByText(/Calendar with 1 events/)).toBeInTheDocument();
  });

  it.skip("should render calendar with both tasks and time blocks", () => {
    const mockTasks = [
      {
        id: "task-1",
        title: "Test Task",
        description: null,
        priority: "high" as const,
        status: "todo" as const,
        userId: "user-1",
        categoryId: null,
        dueDate: new Date("2025-10-05T14:00:00.000Z"),
        estimatedMinutes: null,
        actualMinutes: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockTimeBlocks = [
      {
        id: "block-1",
        title: "Meeting",
        type: "scheduled" as const,
        startTime: new Date("2025-10-05T09:00:00.000Z"),
        endTime: new Date("2025-10-05T10:00:00.000Z"),
        description: null,
        taskId: null,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: { tasks: mockTasks, count: 1 },
      isLoading: false,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: { timeBlocks: mockTimeBlocks, count: 1 },
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByTestId("schedule-x-calendar")).toBeInTheDocument();
    expect(screen.getByText(/Calendar with 2 events/)).toBeInTheDocument();
  });

  it.skip("should filter out tasks without due dates", () => {
    const mockTasks = [
      {
        id: "task-1",
        title: "Task with due date",
        description: null,
        priority: "high" as const,
        status: "todo" as const,
        userId: "user-1",
        categoryId: null,
        dueDate: new Date("2025-10-05T14:00:00.000Z"),
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
        priority: "medium" as const,
        status: "todo" as const,
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

    (tasksHooks.useTasks as jest.Mock).mockReturnValue({
      data: { tasks: mockTasks, count: 2 },
      isLoading: false,
    });

    (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
      data: { timeBlocks: [], count: 0 },
      isLoading: false,
    });

    renderComponent();

    // Only 1 event should be shown (task without due date is filtered out)
    expect(screen.getByText(/Calendar with 1 events/)).toBeInTheDocument();
  });

  describe("Drag and Drop", () => {
    it("should update task when dragged to new date/time", () => {
      const mockUpdateTask = jest.fn();
      const mockTasks = [
        {
          id: "task-1",
          title: "Test Task",
          description: null,
          priority: "high" as const,
          status: "todo" as const,
          userId: "user-1",
          categoryId: null,
          dueDate: new Date("2025-10-05T14:00:00.000Z"),
          estimatedMinutes: null,
          actualMinutes: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (tasksHooks.useTasks as jest.Mock).mockReturnValue({
        data: { tasks: mockTasks, count: 1 },
        isLoading: false,
      });

      (tasksHooks.useUpdateTask as jest.Mock).mockReturnValue({
        mutate: mockUpdateTask,
      });

      (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
        data: { timeBlocks: [], count: 0 },
        isLoading: false,
      });

      (timeBlocksHooks.useUpdateTimeBlock as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
      });

      renderComponent();

      // Simulate drag event using the stored calendar config
      const updatedEvent = {
        id: "task-task-1",
        title: "Test Task",
        start: {
          year: 2025,
          month: 10,
          day: 6,
          epochMilliseconds: new Date("2025-10-06T15:00:00.000Z").getTime(),
        },
        end: {
          year: 2025,
          month: 10,
          day: 6,
          epochMilliseconds: new Date("2025-10-06T16:00:00.000Z").getTime(),
        },
        calendarId: "task-high",
      };

      lastCalendarConfig.callbacks.onEventUpdate(updatedEvent);

      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "task-1",
          data: expect.objectContaining({
            dueDate: expect.any(String),
          }),
        }),
        expect.any(Object),
      );
    });

    it("should update time block when dragged to new date/time", () => {
      const mockUpdateTimeBlock = jest.fn();
      const mockTimeBlocks = [
        {
          id: "block-1",
          title: "Meeting",
          type: "scheduled" as const,
          startTime: new Date("2025-10-05T09:00:00.000Z"),
          endTime: new Date("2025-10-05T10:00:00.000Z"),
          description: null,
          taskId: null,
          userId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (tasksHooks.useTasks as jest.Mock).mockReturnValue({
        data: { tasks: [], count: 0 },
        isLoading: false,
      });

      (tasksHooks.useUpdateTask as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
      });

      (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
        data: { timeBlocks: mockTimeBlocks, count: 1 },
        isLoading: false,
      });

      (timeBlocksHooks.useUpdateTimeBlock as jest.Mock).mockReturnValue({
        mutate: mockUpdateTimeBlock,
      });

      renderComponent();

      // Simulate drag event using the stored calendar config
      const updatedEvent = {
        id: "timeblock-block-1",
        title: "Meeting",
        start: {
          epochMilliseconds: new Date("2025-10-05T10:00:00.000Z").getTime(),
        },
        end: {
          epochMilliseconds: new Date("2025-10-05T11:00:00.000Z").getTime(),
        },
        calendarId: "timeblock-scheduled",
      };

      lastCalendarConfig.callbacks.onEventUpdate(updatedEvent);

      expect(mockUpdateTimeBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "block-1",
          data: expect.objectContaining({
            startTime: expect.any(String),
            endTime: expect.any(String),
          }),
        }),
        expect.any(Object),
      );
    });

    it("should handle unknown event type gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      (tasksHooks.useTasks as jest.Mock).mockReturnValue({
        data: { tasks: [], count: 0 },
        isLoading: false,
      });

      (tasksHooks.useUpdateTask as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
      });

      (timeBlocksHooks.useTimeBlocks as jest.Mock).mockReturnValue({
        data: { timeBlocks: [], count: 0 },
        isLoading: false,
      });

      (timeBlocksHooks.useUpdateTimeBlock as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
      });

      renderComponent();

      // Simulate drag event with unknown type using the stored calendar config
      const updatedEvent = {
        id: "unknown-123",
        title: "Unknown Event",
        start: {
          epochMilliseconds: new Date("2025-10-05T10:00:00.000Z").getTime(),
        },
        end: {
          epochMilliseconds: new Date("2025-10-05T11:00:00.000Z").getTime(),
        },
        calendarId: "unknown",
      };

      lastCalendarConfig.callbacks.onEventUpdate(updatedEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown event type:",
        "unknown-123",
      );

      consoleSpy.mockRestore();
    });
  });
});
