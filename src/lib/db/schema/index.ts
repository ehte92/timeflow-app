// Export all schema definitions and types

export * from "./categories";
export * from "./tasks";
export * from "./time-blocks";
export * from "./users";

import { categories } from "./categories";
import { tasks } from "./tasks";
import { timeBlocks } from "./time-blocks";
// Re-export for convenience
import { users } from "./users";

export const schema = {
  users,
  categories,
  tasks,
  timeBlocks,
};
