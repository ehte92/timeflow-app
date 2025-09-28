/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { GET } from "@/app/api/tasks/route";
import * as authModule from "@/lib/auth/auth-simple";

// Mock the auth function
jest.mock("@/lib/auth/auth-simple", () => ({
  auth: jest.fn(),
}));

// Mock the database client
const _mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockOffset = jest.fn();

jest.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockReturnValue({
          orderBy: mockOrderBy.mockReturnValue({
            limit: mockLimit.mockReturnValue({
              offset: mockOffset.mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
  },
}));

// Mock drizzle-orm functions
jest.mock("drizzle-orm", () => ({
  and: jest.fn((...args) => ({ type: "and", args })),
  desc: jest.fn((field) => ({ type: "desc", field })),
  eq: jest.fn((field, value) => ({ type: "eq", field, value })),
  gte: jest.fn((field, value) => ({ type: "gte", field, value })),
  isNotNull: jest.fn((field) => ({ type: "isNotNull", field })),
  lt: jest.fn((field, value) => ({ type: "lt", field, value })),
  lte: jest.fn((field, value) => ({ type: "lte", field, value })),
  or: jest.fn((...args) => ({ type: "or", args })),
}));

const mockAuth = authModule.auth as unknown as jest.MockedFunction<
  () => Promise<Session | null>
>;

// Mock session
const mockSession: Session = {
  user: {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
  },
  expires: "2025-12-31",
};

describe("Tasks API Route - Filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    // Reset mock return values
    mockOffset.mockResolvedValue([]);
  });

  describe("Priority Filtering", () => {
    it("should filter tasks by priority", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?priority=high",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "eq",
              value: "user-123",
            }),
            expect.objectContaining({
              type: "eq",
              value: "high",
            }),
          ]),
        }),
      );
    });

    it("should handle all priority levels", async () => {
      const priorities = ["low", "medium", "high", "urgent"];

      for (const priority of priorities) {
        const request = new NextRequest(
          `http://localhost:3000/api/tasks?priority=${priority}`,
        );

        await GET(request);

        expect(mockWhere).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "and",
            args: expect.arrayContaining([
              expect.objectContaining({
                type: "eq",
                value: priority,
              }),
            ]),
          }),
        );
      }
    });
  });

  describe("Date Range Filtering", () => {
    beforeEach(() => {
      // Mock current date to a fixed point for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-15T12:00:00Z")); // Saturday, June 15, 2024
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should filter overdue tasks", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=overdue",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "lt",
            }),
            expect.objectContaining({
              type: "or",
              args: expect.arrayContaining([
                expect.objectContaining({
                  type: "eq",
                  value: "todo",
                }),
                expect.objectContaining({
                  type: "eq",
                  value: "in_progress",
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    it("should filter tasks due today", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=today",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
            expect.objectContaining({
              type: "lt",
            }),
          ]),
        }),
      );
    });

    it("should filter tasks due tomorrow", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=tomorrow",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
            expect.objectContaining({
              type: "lt",
            }),
          ]),
        }),
      );
    });

    it("should filter tasks due this week", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=this_week",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
            expect.objectContaining({
              type: "lt",
            }),
          ]),
        }),
      );
    });

    it("should filter tasks due next week", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=next_week",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
            expect.objectContaining({
              type: "lt",
            }),
          ]),
        }),
      );
    });

    it("should filter tasks due this month", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=this_month",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
            expect.objectContaining({
              type: "lt",
            }),
          ]),
        }),
      );
    });
  });

  describe("Custom Date Range Filtering", () => {
    it("should filter tasks by custom date range", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dueDateFrom=2024-01-01T00:00:00.000Z&dueDateTo=2024-01-31T23:59:59.999Z",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "lte",
            }),
          ]),
        }),
      );
    });

    it("should filter tasks with only dueDateFrom", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dueDateFrom=2024-01-01T00:00:00.000Z",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "gte",
            }),
          ]),
        }),
      );
    });

    it("should filter tasks with only dueDateTo", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dueDateTo=2024-01-31T23:59:59.999Z",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "isNotNull",
            }),
            expect.objectContaining({
              type: "lte",
            }),
          ]),
        }),
      );
    });
  });

  describe("Combined Filtering", () => {
    it("should handle multiple filters together", async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();
      mockAuth.mockResolvedValue(mockSession);
      mockOffset.mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/tasks?status=todo&priority=high&dateRange=this_week&categoryId=12345678-1234-5678-9abc-123456789abc",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "eq",
              value: "user-123",
            }),
            expect.objectContaining({
              type: "eq",
              value: "todo",
            }),
            expect.objectContaining({
              type: "eq",
              value: "high",
            }),
            expect.objectContaining({
              type: "eq",
              value: "12345678-1234-5678-9abc-123456789abc",
            }),
          ]),
        }),
      );
    });

    it("should handle status and priority filters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?status=completed&priority=urgent",
      );

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "eq",
              value: "user-123",
            }),
            expect.objectContaining({
              type: "eq",
              value: "completed",
            }),
            expect.objectContaining({
              type: "eq",
              value: "urgent",
            }),
          ]),
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid date range values", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dateRange=invalid_range",
      );

      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe("Invalid query parameters");
    });

    it("should handle invalid priority values", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?priority=invalid_priority",
      );

      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe("Invalid query parameters");
    });

    it("should handle invalid status values", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?status=invalid_status",
      );

      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe("Invalid query parameters");
    });

    it("should handle malformed date strings", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?dueDateFrom=invalid-date-format",
      );

      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe("Invalid query parameters");
    });

    it("should handle invalid UUID for categoryId", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?categoryId=not-a-valid-uuid",
      );

      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe("Invalid query parameters");
    });
  });

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/tasks");
      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.error).toBe("Unauthorized");
    });

    it("should include user ID in all queries", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks");

      await GET(request);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "and",
          args: expect.arrayContaining([
            expect.objectContaining({
              type: "eq",
              value: "user-123",
            }),
          ]),
        }),
      );
    });
  });

  describe("Pagination", () => {
    it("should apply default limit and offset", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks");

      await GET(request);

      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it("should apply custom limit and offset", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks?limit=25&offset=10",
      );

      await GET(request);

      expect(mockLimit).toHaveBeenCalledWith(25);
      expect(mockOffset).toHaveBeenCalledWith(10);
    });
  });
});
