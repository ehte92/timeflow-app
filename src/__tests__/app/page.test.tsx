import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home Page", () => {
  it("should render the main heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { name: /⏰ TimeFlow/i });
    expect(heading).toBeInTheDocument();
  });

  it("should render the subtitle", () => {
    render(<Home />);

    const subtitle = screen.getByText(
      /Smart Task Planner with AI-powered time blocking and productivity insights/i,
    );
    expect(subtitle).toBeInTheDocument();
  });

  it("should render setup complete section", () => {
    render(<Home />);

    const setupHeading = screen.getByRole("heading", {
      name: /🎉 Fresh Setup Complete!/i,
    });
    expect(setupHeading).toBeInTheDocument();
  });

  it("should display all technology checkmarks", () => {
    render(<Home />);

    expect(screen.getByText("Next.js 15 with App Router")).toBeInTheDocument();
    expect(screen.getByText("Tailwind CSS v4")).toBeInTheDocument();
    expect(screen.getByText("shadcn/ui Components")).toBeInTheDocument();
    expect(screen.getByText("Drizzle ORM")).toBeInTheDocument();
    expect(screen.getByText("Supabase Database")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Configuration")).toBeInTheDocument();
  });

  it("should render action links", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: /get started/i }),
    ).toBeInTheDocument();

    // Verify the Sign In link exists
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute("data-slot")).toBe("button");
  });

  it("should display progress bar at 100%", () => {
    render(<Home />);

    const progressBarContainer = screen.getByText(
      "Ready to start building...",
    ).nextElementSibling;
    const fullProgressBar = progressBarContainer?.querySelector(
      '[style*="width: 100%"]',
    );
    expect(fullProgressBar).toBeInTheDocument();
  });
});
