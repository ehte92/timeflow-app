import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home Page", () => {
  it("should render the main heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", {
      name: /Master Your Time, Amplify Your Impact/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("should render the brand tagline", () => {
    render(<Home />);

    const tagline = screen.getByText(
      /Transform scattered tasks into focused achievement/i,
    );
    expect(tagline).toBeInTheDocument();
  });

  it("should render social proof section", () => {
    render(<Home />);

    const socialProof = screen.getByText("1M+");
    expect(socialProof).toBeInTheDocument();
    expect(
      screen.getByText(/Tasks Completed by 10,000\+ Professionals/i),
    ).toBeInTheDocument();
  });

  it("should display auth tabs", () => {
    render(<Home />);

    expect(screen.getByRole("tab", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sign Up/i })).toBeInTheDocument();
  });

  it("should render welcome back heading on sign in tab", () => {
    render(<Home />);

    const welcomeHeading = screen.getByRole("heading", {
      name: /Welcome back/i,
    });
    expect(welcomeHeading).toBeInTheDocument();
  });

  it("should display brand logo", () => {
    render(<Home />);

    expect(screen.getAllByText("TimeFlow").length).toBeGreaterThan(0);
  });
});
