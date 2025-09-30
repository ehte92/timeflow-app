import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  mockFetch,
  mockFetchError,
  render,
} from "@/__tests__/utils/test-utils";
import { CategoryForm } from "@/components/categories/category-form";
import type { Category } from "@/lib/db/schema/categories";

describe("CategoryForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render form in create mode", () => {
    render(<CategoryForm />);

    expect(screen.getByText("Create New Category")).toBeInTheDocument();
    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create category/i }),
    ).toBeInTheDocument();
  });

  it("should render form in edit mode", () => {
    const category: Category = {
      id: "cat-123",
      name: "Work",
      color: "#3B82F6",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<CategoryForm category={category} />);

    expect(screen.getByText("Edit Category")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Work")).toBeInTheDocument();
    expect(screen.getByDisplayValue("#3B82F6")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update category/i }),
    ).toBeInTheDocument();
  });

  it("should show validation error for empty name", async () => {
    render(<CategoryForm />);

    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("should show validation error for invalid color format", async () => {
    render(<CategoryForm />);

    const nameInput = screen.getByLabelText(/category name/i);
    const colorInput = screen.getByLabelText(/color/i);

    await user.type(nameInput, "Work");
    await user.clear(colorInput);
    await user.type(colorInput, "invalid-color");

    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });
    await user.click(submitButton);

    // Wait for validation error to appear
    await waitFor(
      () => {
        const errorElement = screen.queryByText(/invalid color format/i);
        expect(errorElement).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should create category with valid data", async () => {
    const mockCategory = {
      id: "cat-123",
      name: "Work",
      color: "#3B82F6",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFetch(
      { category: mockCategory, message: "Category created successfully" },
      true,
      201,
    );

    const onSuccess = jest.fn();
    render(<CategoryForm onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/category name/i);
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(nameInput, "Work");
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Work",
          color: "#3B82F6", // Default color
        }),
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should create category with custom color", async () => {
    const mockCategory = {
      id: "cat-123",
      name: "Personal",
      color: "#EF4444",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFetch(
      { category: mockCategory, message: "Category created successfully" },
      true,
      201,
    );

    const onSuccess = jest.fn();
    render(<CategoryForm onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/category name/i);
    const colorInput = screen.getByLabelText(/color/i);
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(nameInput, "Personal");
    await user.clear(colorInput);
    await user.type(colorInput, "#EF4444");
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Personal",
          color: "#EF4444",
        }),
      });
    });
  });

  it("should update category", async () => {
    const category: Category = {
      id: "cat-123",
      name: "Work",
      color: "#3B82F6",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedCategory = {
      ...category,
      name: "Updated Work",
    };

    mockFetch({
      category: updatedCategory,
      message: "Category updated successfully",
    });

    const onSuccess = jest.fn();
    render(<CategoryForm category={category} onSuccess={onSuccess} />);

    const nameInput = screen.getByDisplayValue("Work");
    const submitButton = screen.getByRole("button", {
      name: /update category/i,
    });

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Work");
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories/cat-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Work",
          color: "#3B82F6",
        }),
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should handle duplicate name error", async () => {
    mockFetchError(409, "A category with this name already exists");

    render(<CategoryForm />);

    const nameInput = screen.getByLabelText(/category name/i);
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(nameInput, "Existing Category");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/a category with this name already exists/i),
      ).toBeInTheDocument();
    });
  });

  it("should call onCancel when cancel button clicked", async () => {
    const onCancel = jest.fn();
    render(<CategoryForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("should disable form during submission", async () => {
    // Use a promise that resolves slowly to catch loading state
    const slowResolve = new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            status: 201,
            json: async () => ({
              category: {},
              message: "Category created successfully",
            }),
          }),
        100,
      ),
    );
    (global.fetch as jest.Mock).mockReturnValue(slowResolve);

    render(<CategoryForm />);

    const nameInput = screen.getByLabelText(/category name/i);
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(nameInput, "Work");
    await user.click(submitButton);

    // Check that button shows loading state
    await waitFor(
      () => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it("should render color preview", () => {
    const category: Category = {
      id: "cat-123",
      name: "Work",
      color: "#3B82F6",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { container } = render(<CategoryForm category={category} />);

    // Check that color preview div exists with correct background color
    const colorPreview = container.querySelector(
      'div[style*="background-color: rgb(59, 130, 246)"]',
    );
    expect(colorPreview).toBeInTheDocument();
  });

  it("should render preset color palette", () => {
    render(<CategoryForm />);

    // The form should have color preset buttons
    // We expect 12 preset colors based on the component implementation
    const { container } = render(<CategoryForm />);
    const colorButtons = container.querySelectorAll('button[type="button"]');

    // Should have at least the 12 preset color buttons
    expect(colorButtons.length).toBeGreaterThanOrEqual(12);
  });
});
