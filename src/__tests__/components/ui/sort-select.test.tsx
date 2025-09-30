import { fireEvent, render, screen } from "@testing-library/react";
import { SortSelect } from "@/components/ui/sort-select";
import type { TaskSortBy, TaskSortOrder } from "@/lib/query/hooks/tasks";

describe("SortSelect", () => {
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with default sort option", () => {
    render(
      <SortSelect
        sortBy="createdAt"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    expect(screen.getByText("Newest First")).toBeInTheDocument();
  });

  it("should display correct icon for descending order", () => {
    const { container } = render(
      <SortSelect
        sortBy="createdAt"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    // ArrowDownAZ icon should be present for desc order
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should display correct icon for ascending order", () => {
    const { container } = render(
      <SortSelect
        sortBy="title"
        sortOrder="asc"
        onSortChange={mockOnSortChange}
      />,
    );

    // ArrowUpAZ icon should be present for asc order
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should call onSortChange when a new sort option is selected", () => {
    render(
      <SortSelect
        sortBy="createdAt"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Select "Title (A-Z)" option
    const option = screen.getByText("Title (A-Z)");
    fireEvent.click(option);

    expect(mockOnSortChange).toHaveBeenCalledWith("title", "asc");
  });

  it("should display all sort options when opened", () => {
    render(
      <SortSelect
        sortBy="createdAt"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    const expectedOptions = [
      "Newest First",
      "Oldest First",
      "Due Date (Soonest)",
      "Due Date (Latest)",
      "Priority (High to Low)",
      "Priority (Low to High)",
      "Title (A-Z)",
      "Title (Z-A)",
      "Recently Updated",
      "Recently Completed",
    ];

    expectedOptions.forEach((option) => {
      expect(screen.getAllByText(option).length).toBeGreaterThan(0);
    });
  });

  it("should handle priority sort selection", () => {
    render(
      <SortSelect
        sortBy="createdAt"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    const option = screen.getByText("Priority (High to Low)");
    fireEvent.click(option);

    expect(mockOnSortChange).toHaveBeenCalledWith("priority", "desc");
  });

  it("should handle due date sort selection", () => {
    render(
      <SortSelect
        sortBy="createdAt"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    const option = screen.getByText("Due Date (Soonest)");
    fireEvent.click(option);

    expect(mockOnSortChange).toHaveBeenCalledWith("dueDate", "asc");
  });

  it("should reflect current sort state", () => {
    const { rerender } = render(
      <SortSelect
        sortBy="title"
        sortOrder="asc"
        onSortChange={mockOnSortChange}
      />,
    );

    expect(screen.getByText("Title (A-Z)")).toBeInTheDocument();

    rerender(
      <SortSelect
        sortBy="priority"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />,
    );

    expect(screen.getByText("Priority (High to Low)")).toBeInTheDocument();
  });

  it("should handle all sortBy and sortOrder combinations", () => {
    const sortOptions: Array<{ sortBy: TaskSortBy; sortOrder: TaskSortOrder }> =
      [
        { sortBy: "createdAt", sortOrder: "asc" },
        { sortBy: "createdAt", sortOrder: "desc" },
        { sortBy: "updatedAt", sortOrder: "desc" },
        { sortBy: "dueDate", sortOrder: "asc" },
        { sortBy: "dueDate", sortOrder: "desc" },
        { sortBy: "priority", sortOrder: "asc" },
        { sortBy: "priority", sortOrder: "desc" },
        { sortBy: "status", sortOrder: "asc" },
        { sortBy: "status", sortOrder: "desc" },
        { sortBy: "title", sortOrder: "asc" },
        { sortBy: "title", sortOrder: "desc" },
        { sortBy: "completedAt", sortOrder: "desc" },
      ];

    sortOptions.forEach(({ sortBy, sortOrder }) => {
      const { unmount } = render(
        <SortSelect
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={mockOnSortChange}
        />,
      );

      // Just verify it renders without errors
      expect(screen.getByRole("combobox")).toBeInTheDocument();

      unmount();
    });
  });
});
