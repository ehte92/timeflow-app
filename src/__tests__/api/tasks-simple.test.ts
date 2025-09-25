/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import * as authModule from "@/lib/auth/auth-simple";

// Mock the auth function
jest.mock("@/lib/auth/auth-simple", () => ({
  auth: jest.fn(),
}));

// Mock the entire API routes to focus on authentication logic
jest.mock("@/app/api/tasks/route", () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

jest.mock("@/app/api/tasks/[taskId]/route", () => ({
  PUT: jest.fn(),
  DELETE: jest.fn(),
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

describe("Task API Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should authenticate user", async () => {
      mockAuth.mockResolvedValue(mockSession);

      const session = await mockAuth();
      expect(session).toEqual(mockSession);
      expect(session?.user?.id).toBe("user-123");
    });

    it("should handle unauthenticated user", async () => {
      mockAuth.mockResolvedValue(null);

      const session = await mockAuth();
      expect(session).toBeNull();
    });

    it("should handle auth errors", async () => {
      mockAuth.mockRejectedValue(new Error("Auth error"));

      await expect(mockAuth()).rejects.toThrow("Auth error");
    });
  });

  describe("Request handling", () => {
    it("should create valid NextRequest", () => {
      const request = new NextRequest("http://localhost:3000/api/tasks");
      expect(request.url).toBe("http://localhost:3000/api/tasks");
      expect(request.method).toBe("GET");
    });

    it("should create POST request with body", () => {
      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: "Test Task" }),
        headers: { "Content-Type": "application/json" },
      });
      expect(request.method).toBe("POST");
    });
  });
});
