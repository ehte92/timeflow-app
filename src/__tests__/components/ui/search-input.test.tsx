import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/ui/search-input";

describe("SearchInput", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should render with placeholder", () => {
    render(
      <SearchInput onChange={mockOnChange} placeholder="Search tasks..." />,
    );

    expect(screen.getByPlaceholderText("Search tasks...")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display search icon", () => {
    render(<SearchInput onChange={mockOnChange} />);

    const searchIcon = screen
      .getByRole("textbox")
      .parentElement?.querySelector("svg");
    expect(searchIcon).toBeInTheDocument();
  });

  it("should call onChange with debounced input", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchInput onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test search");

    // Should not call onChange immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Advance timers to trigger debounce
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith("test search");
    });
  });

  it("should show clear button when input has value", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchInput onChange={mockOnChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test");

    // Clear button should appear
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should clear input when clear button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchInput onChange={mockOnChange} value="initial value" />);

    expect(screen.getByDisplayValue("initial value")).toBeInTheDocument();

    const clearButton = screen.getByRole("button");
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith("");
  });

  it("should update input value when external value changes", () => {
    const { rerender } = render(
      <SearchInput onChange={mockOnChange} value="first" />,
    );

    expect(screen.getByDisplayValue("first")).toBeInTheDocument();

    rerender(<SearchInput onChange={mockOnChange} value="second" />);

    expect(screen.getByDisplayValue("second")).toBeInTheDocument();
  });

  it("should not show clear button when input is empty", () => {
    render(<SearchInput onChange={mockOnChange} value="" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should handle custom debounce timing", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchInput onChange={mockOnChange} debounceMs={500} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test");

    // Should not trigger after default time
    jest.advanceTimersByTime(300);
    expect(mockOnChange).not.toHaveBeenCalled();

    // Should trigger after custom debounce time
    jest.advanceTimersByTime(200);
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith("test");
    });
  });

  it("should handle rapid typing with debouncing", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchInput onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByRole("textbox");

    // Type rapidly
    await user.type(input, "a");
    jest.advanceTimersByTime(100);
    await user.type(input, "b");
    jest.advanceTimersByTime(100);
    await user.type(input, "c");

    // Should only call once after the full debounce period
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith("abc");
    });
  });

  it("should apply custom className", () => {
    render(
      <SearchInput onChange={mockOnChange} className="custom-search-class" />,
    );

    const container = screen.getByRole("textbox").parentElement;
    expect(container).toHaveClass("custom-search-class");
  });
});
