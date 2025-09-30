import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  mockFetch,
  mockFetchError,
  render,
} from "@/__tests__/utils/test-utils";
import { CategoryList } from "@/components/categories/category-list";
import type { Category } from "@/lib/db/schema/categories";

describe("CategoryList", () => {
  const user = userEvent.setup();

  const mockCategories: Category[] = [
    {
      id: "cat-1",
      name: "Work",
      color: "#3B82F6",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cat-2",
      name: "Personal",
      color: "#10B981",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state", () => {
    // Mock fetch that never resolves to simulate loading
    mockFetch(
      new Promise(() => {
        /* never resolves */
      }),
    );

    render(<CategoryList />);

    expect(screen.getByText(/loading categories/i)).toBeInTheDocument();
  });

  it("should render categories list", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    // Check that colors are displayed
    expect(screen.getByText("#3B82F6")).toBeInTheDocument();
    expect(screen.getByText("#10B981")).toBeInTheDocument();
  });

  it("should render empty state when no categories", async () => {
    mockFetch({
      categories: [],
      count: 0,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/create your first category to organize your tasks/i),
    ).toBeInTheDocument();
  });

  it("should render error state", async () => {
    mockFetchError(500, "Failed to load categories");

    render(<CategoryList />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load categories/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("should call onEditCategory when edit button clicked", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    const onEditCategory = jest.fn();
    render(<CategoryList onEditCategory={onEditCategory} />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Find all edit buttons (there should be one per category)
    const editButtons = screen.getAllByTitle(/edit category/i);
    await user.click(editButtons[0]);

    expect(onEditCategory).toHaveBeenCalledWith(mockCategories[0]);
  });

  it("should not render edit buttons when onEditCategory not provided", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Edit buttons should not be present
    expect(screen.queryByTitle(/edit category/i)).not.toBeInTheDocument();
  });

  it("should open delete confirmation dialog", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle(/delete category/i);
    await user.click(deleteButtons[0]);

    // Check that confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
      expect(
        screen.getByText(
          /are you sure you want to delete the category "work"/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("should delete category when confirmed", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle(/delete category/i);
    await user.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });

    // Mock successful deletion
    mockFetch({ message: "Category deleted successfully" });

    // Click confirm delete button
    const confirmButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories/cat-1", {
        method: "DELETE",
      });
    });
  });

  it("should cancel delete when cancel clicked", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle(/delete category/i);
    await user.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText("Delete Category")).not.toBeInTheDocument();
    });

    // Delete should not have been called
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/categories/"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("should show loading state during deletion", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle(/delete category/i);
    await user.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });

    // Mock deletion that takes time
    mockFetch(
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ message: "Category deleted successfully" }),
          100,
        ),
      ),
    );

    // Click confirm delete button
    const confirmButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    // Should show deleting state
    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });
  });

  it("should retry loading when try again clicked", async () => {
    mockFetchError(500, "Failed to load categories");

    render(<CategoryList />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load categories/i),
      ).toBeInTheDocument();
    });

    // Mock successful retry
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });
  });

  it("should render color indicators", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    const { container } = render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Check that color indicator divs exist with correct background colors
    const colorIndicators = container.querySelectorAll(
      'div[style*="background-color"]',
    );
    expect(colorIndicators.length).toBeGreaterThanOrEqual(2);
  });

  it("should disable delete button during deletion", async () => {
    mockFetch({
      categories: mockCategories,
      count: mockCategories.length,
    });

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle(/delete category/i);
    await user.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });

    // Mock slow deletion
    mockFetch(
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ message: "Category deleted successfully" }),
          100,
        ),
      ),
    );

    // Click confirm delete button
    const confirmButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    // Buttons should be disabled
    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    });
  });
});
