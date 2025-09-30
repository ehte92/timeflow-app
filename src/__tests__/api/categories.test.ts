/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import {
  DELETE as DELETE_BY_ID,
  PATCH as PATCH_BY_ID,
} from "@/app/api/categories/[categoryId]/route";
import { GET, POST } from "@/app/api/categories/route";
import * as authModule from "@/lib/auth/auth-simple";

// Mock the auth function
jest.mock("@/lib/auth/auth-simple", () => ({
  auth: jest.fn(),
}));

// Mock the database client
const _mockSelect = jest.fn();
const _mockInsert = jest.fn();
const _mockUpdate = jest.fn();
const _mockDelete = jest.fn();
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockValues = jest.fn();
const mockReturning = jest.fn();
const mockSet = jest.fn();

jest.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockReturnValue({
          orderBy: mockOrderBy.mockReturnValue({
            limit: mockLimit.mockResolvedValue([]),
          }),
          limit: mockLimit.mockResolvedValue([]),
        }),
        orderBy: mockOrderBy.mockResolvedValue([]),
      }),
    }),
    insert: () => ({
      values: mockValues.mockReturnValue({
        returning: mockReturning.mockResolvedValue([]),
      }),
    }),
    update: () => ({
      set: mockSet.mockReturnValue({
        where: mockWhere.mockReturnValue({
          returning: mockReturning.mockResolvedValue([]),
        }),
      }),
    }),
    delete: () => ({
      where: mockWhere.mockResolvedValue(undefined),
    }),
  },
}));

// Mock drizzle-orm functions
jest.mock("drizzle-orm", () => ({
  and: jest.fn((...args) => ({ type: "and", args })),
  asc: jest.fn((field) => ({ type: "asc", field })),
  eq: jest.fn((field, value) => ({ type: "eq", field, value })),
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

// Mock category data
const mockCategory = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Work",
  color: "#3B82F6",
  userId: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Categories API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("GET /api/categories", () => {
    it("should return categories for authenticated user", async () => {
      const mockCategories = [
        mockCategory,
        {
          ...mockCategory,
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Personal",
        },
      ];

      mockOrderBy.mockResolvedValueOnce(mockCategories);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(2);
      expect(data.categories[0]).toMatchObject({
        id: mockCategory.id,
        name: mockCategory.name,
        color: mockCategory.color,
        userId: mockCategory.userId,
      });
      expect(data.count).toBe(2);
    });

    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty array if no categories", async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe("POST /api/categories", () => {
    it("should create a category with valid data", async () => {
      mockLimit.mockResolvedValueOnce([]); // No duplicate
      mockReturning.mockResolvedValueOnce([mockCategory]);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Work",
          color: "#3B82F6",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe("Category created successfully");
      expect(data.category).toMatchObject({
        id: mockCategory.id,
        name: mockCategory.name,
        color: mockCategory.color,
        userId: mockCategory.userId,
      });
    });

    it("should use default color if not provided", async () => {
      mockLimit.mockResolvedValueOnce([]);
      mockReturning.mockResolvedValueOnce([mockCategory]);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Work",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.category).toMatchObject({
        id: mockCategory.id,
        name: mockCategory.name,
        userId: mockCategory.userId,
      });
    });

    it("should return 409 if category name already exists", async () => {
      mockLimit.mockResolvedValueOnce([mockCategory]); // Duplicate found

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Work",
          color: "#3B82F6",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("A category with this name already exists");
    });

    it("should return 400 for invalid name (too short)", async () => {
      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "",
          color: "#3B82F6",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 for invalid name (too long)", async () => {
      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "a".repeat(51),
          color: "#3B82F6",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 for invalid color format", async () => {
      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Work",
          color: "invalid-color",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Work",
          color: "#3B82F6",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("PATCH /api/categories/[categoryId]", () => {
    it("should update a category", async () => {
      mockLimit.mockResolvedValueOnce([mockCategory]); // Category exists
      mockLimit.mockResolvedValueOnce([]); // No duplicate name
      mockReturning.mockResolvedValueOnce([
        { ...mockCategory, name: "Updated Work" },
      ]);

      const response = await PATCH_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${mockCategory.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: "Updated Work",
            }),
          },
        ),
        { params: Promise.resolve({ categoryId: mockCategory.id }) },
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Category updated successfully");
      expect(data.category.name).toBe("Updated Work");
    });

    it("should update only color", async () => {
      mockLimit.mockResolvedValueOnce([mockCategory]);
      mockReturning.mockResolvedValueOnce([
        { ...mockCategory, color: "#EF4444" },
      ]);

      const response = await PATCH_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${mockCategory.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              color: "#EF4444",
            }),
          },
        ),
        { params: Promise.resolve({ categoryId: mockCategory.id }) },
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.category.color).toBe("#EF4444");
    });

    it("should return 404 if category not found", async () => {
      mockLimit.mockResolvedValueOnce([]);

      const nonexistentId = "550e8400-e29b-41d4-a716-446655449999";

      const response = await PATCH_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${nonexistentId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: "Updated",
            }),
          },
        ),
        { params: Promise.resolve({ categoryId: nonexistentId }) },
      );

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Category not found");
    });

    it("should return 409 if new name already exists for another category", async () => {
      mockLimit.mockResolvedValueOnce([mockCategory]); // Category exists
      mockLimit.mockResolvedValueOnce([
        { ...mockCategory, id: "550e8400-e29b-41d4-a716-446655440999" },
      ]); // Duplicate name

      const response = await PATCH_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${mockCategory.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: "Existing Name",
            }),
          },
        ),
        { params: Promise.resolve({ categoryId: mockCategory.id }) },
      );

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("A category with this name already exists");
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await PATCH_BY_ID(
        new NextRequest("http://localhost:3000/api/categories/invalid-uuid", {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated",
          }),
        }),
        { params: Promise.resolve({ categoryId: "invalid-uuid" }) },
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid category ID format");
    });

    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const response = await PATCH_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${mockCategory.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: "Updated",
            }),
          },
        ),
        { params: Promise.resolve({ categoryId: mockCategory.id }) },
      );

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/categories/[categoryId]", () => {
    it("should delete a category", async () => {
      mockLimit.mockResolvedValueOnce([mockCategory]);

      const response = await DELETE_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${mockCategory.id}`,
          {
            method: "DELETE",
          },
        ),
        { params: Promise.resolve({ categoryId: mockCategory.id }) },
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Category deleted successfully");
    });

    it("should return 404 if category not found", async () => {
      mockLimit.mockResolvedValueOnce([]);

      const nonexistentId = "550e8400-e29b-41d4-a716-446655449999";

      const response = await DELETE_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${nonexistentId}`,
          {
            method: "DELETE",
          },
        ),
        { params: Promise.resolve({ categoryId: nonexistentId }) },
      );

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Category not found");
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await DELETE_BY_ID(
        new NextRequest("http://localhost:3000/api/categories/invalid-uuid", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ categoryId: "invalid-uuid" }) },
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid category ID format");
    });

    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const response = await DELETE_BY_ID(
        new NextRequest(
          `http://localhost:3000/api/categories/${mockCategory.id}`,
          {
            method: "DELETE",
          },
        ),
        { params: Promise.resolve({ categoryId: mockCategory.id }) },
      );

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
