import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-simple";
import { rateLimit, rateLimitConfigs } from "./rate-limit";

/**
 * API middleware that applies common security patterns:
 * - Authentication check
 * - Rate limiting per authenticated user
 */
export async function withApiMiddleware(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting based on user ID
    const apiRateLimit = rateLimit(rateLimitConfigs.api);
    const rateLimitResponse = apiRateLimit(request, session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the actual handler
    return await handler(request, session.user.id);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("API middleware error:", error);
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
