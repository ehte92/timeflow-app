/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import {
  DELETE as deleteTimeBlock,
  GET as getTimeBlock,
  PUT as updateTimeBlock,
} from "@/app/api/time-blocks/[timeBlockId]/route";
import {
  POST as createTimeBlock,
  GET as getTimeBlocks,
} from "@/app/api/time-blocks/route";
import * as authModule from "@/lib/auth/auth-simple";
import { db } from "@/lib/db/client";

// Mock dependencies
jest.mock("@/lib/auth/auth-simple", () => ({
  auth: jest.fn(),
}));
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockAuth = authModule.auth as unknown as jest.MockedFunction<
  () => Promise<Session | null>
>;

describe("Time Blocks API - /api/time-blocks", () => {
  const mockUserId = "test-user-id";
  const mockTimeBlockId = "test-time-block-id";

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: "test@example.com", name: "Test User" },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  describe("GET /api/time-blocks", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/time-blocks");
      const response = await getTimeBlocks(request as NextRequest);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should fetch time blocks for authenticated user", async () => {
      const mockTimeBlocks = [
        {
          id: "1",
          title: "Morning Meeting",
          type: "scheduled",
          startTime: new Date("2025-10-03T09:00:00Z"),
          endTime: new Date("2025-10-03T10:00:00Z"),
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const _mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockOffset = jest.fn().mockResolvedValue(mockTimeBlocks);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });
      mockOrderBy.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        offset: mockOffset,
      });

      const request = new Request("http://localhost:3000/api/time-blocks");
      const response = await getTimeBlocks(request as NextRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.timeBlocks.length).toBe(1);
      expect(data.timeBlocks[0].id).toBe("1");
      expect(data.timeBlocks[0].title).toBe("Morning Meeting");
      expect(data.count).toBe(1);
    });

    it("should filter time blocks by date range", async () => {
      const _mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockOffset = jest.fn().mockResolvedValue([]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });
      mockOrderBy.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        offset: mockOffset,
      });

      const request = new Request(
        "http://localhost:3000/api/time-blocks?startDate=2025-10-03T00:00:00Z&endDate=2025-10-04T00:00:00Z",
      );
      const response = await getTimeBlocks(request as NextRequest);

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/time-blocks", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/time-blocks", {
        method: "POST",
        body: JSON.stringify({
          startTime: "2025-10-03T09:00:00Z",
          endTime: "2025-10-03T10:00:00Z",
        }),
      });
      const response = await createTimeBlock(request as NextRequest);

      expect(response.status).toBe(401);
    });

    it("should create a time block for authenticated user", async () => {
      const newTimeBlock = {
        title: "Test Block",
        type: "scheduled" as const,
        startTime: "2025-10-03T09:00:00Z",
        endTime: "2025-10-03T10:00:00Z",
      };

      const mockReturning = jest.fn().mockResolvedValue([
        {
          id: mockTimeBlockId,
          ...newTimeBlock,
          startTime: new Date(newTimeBlock.startTime),
          endTime: new Date(newTimeBlock.endTime),
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const mockValues = jest.fn().mockReturnValue({
        returning: mockReturning,
      });
      (db.insert as jest.Mock).mockReturnValue({
        values: mockValues,
      });

      const request = new Request("http://localhost:3000/api/time-blocks", {
        method: "POST",
        body: JSON.stringify(newTimeBlock),
      });
      const response = await createTimeBlock(request as NextRequest);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toBe("Time block created successfully");
      expect(data.timeBlock.id).toBe(mockTimeBlockId);
    });

    it("should return 400 if end time is before start time", async () => {
      const invalidTimeBlock = {
        startTime: "2025-10-03T10:00:00Z",
        endTime: "2025-10-03T09:00:00Z",
      };

      const request = new Request("http://localhost:3000/api/time-blocks", {
        method: "POST",
        body: JSON.stringify(invalidTimeBlock),
      });
      const response = await createTimeBlock(request as NextRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("GET /api/time-blocks/[timeBlockId]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/time-blocks/${mockTimeBlockId}`,
      );
      const response = await getTimeBlock(request as NextRequest, {
        params: Promise.resolve({ timeBlockId: mockTimeBlockId }),
      });

      expect(response.status).toBe(401);
    });

    it("should fetch a specific time block", async () => {
      const mockTimeBlock = {
        id: mockTimeBlockId,
        title: "Test Block",
        type: "scheduled",
        startTime: new Date("2025-10-03T09:00:00Z"),
        endTime: new Date("2025-10-03T10:00:00Z"),
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLimit = jest.fn().mockResolvedValue([mockTimeBlock]);
      const mockWhere = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
      });
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const request = new Request(
        `http://localhost:3000/api/time-blocks/${mockTimeBlockId}`,
      );
      const response = await getTimeBlock(request as NextRequest, {
        params: Promise.resolve({ timeBlockId: mockTimeBlockId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.timeBlock.id).toBe(mockTimeBlockId);
    });

    it("should return 404 if time block not found", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
      });
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const request = new Request(
        `http://localhost:3000/api/time-blocks/${mockTimeBlockId}`,
      );
      const response = await getTimeBlock(request as NextRequest, {
        params: Promise.resolve({ timeBlockId: mockTimeBlockId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/time-blocks/[timeBlockId]", () => {
    it("should update a time block", async () => {
      const existingTimeBlock = {
        id: mockTimeBlockId,
        title: "Old Title",
        type: "scheduled",
        startTime: new Date("2025-10-03T09:00:00Z"),
        endTime: new Date("2025-10-03T10:00:00Z"),
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = { title: "New Title" };

      const mockLimit = jest.fn().mockResolvedValue([existingTimeBlock]);
      const mockWhere = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
      });
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const mockReturning = jest
        .fn()
        .mockResolvedValue([{ ...existingTimeBlock, ...updateData }]);
      const mockUpdateWhere = jest.fn().mockReturnValue({
        returning: mockReturning,
      });
      const mockSet = jest.fn().mockReturnValue({
        where: mockUpdateWhere,
      });
      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });

      const request = new Request(
        `http://localhost:3000/api/time-blocks/${mockTimeBlockId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        },
      );
      const response = await updateTimeBlock(request as NextRequest, {
        params: Promise.resolve({ timeBlockId: mockTimeBlockId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Time block updated successfully");
    });
  });

  describe("DELETE /api/time-blocks/[timeBlockId]", () => {
    it("should delete a time block", async () => {
      const existingTimeBlock = {
        id: mockTimeBlockId,
        userId: mockUserId,
      };

      const mockLimit = jest.fn().mockResolvedValue([existingTimeBlock]);
      const mockWhere = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
      });
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
      (db.delete as jest.Mock).mockReturnValue({
        where: mockDeleteWhere,
      });

      const request = new Request(
        `http://localhost:3000/api/time-blocks/${mockTimeBlockId}`,
        {
          method: "DELETE",
        },
      );
      const response = await deleteTimeBlock(request as NextRequest, {
        params: Promise.resolve({ timeBlockId: mockTimeBlockId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Time block deleted successfully");
    });

    it("should return 404 if time block not found", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
      });
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const request = new Request(
        `http://localhost:3000/api/time-blocks/${mockTimeBlockId}`,
        {
          method: "DELETE",
        },
      );
      const response = await deleteTimeBlock(request as NextRequest, {
        params: Promise.resolve({ timeBlockId: mockTimeBlockId }),
      });

      expect(response.status).toBe(404);
    });
  });
});
