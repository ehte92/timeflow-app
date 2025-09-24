import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { users } from "./users";

export const taskPriorityEnum = ["low", "medium", "high", "urgent"] as const;
export const taskStatusEnum = [
  "todo",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: taskPriorityEnum })
    .notNull()
    .default("medium"),
  status: text("status", { enum: taskStatusEnum }).notNull().default("todo"),
  estimatedMinutes: integer("estimated_minutes"), // Time estimate in minutes
  actualMinutes: integer("actual_minutes"), // Actual time spent in minutes
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskPriority = (typeof taskPriorityEnum)[number];
export type TaskStatus = (typeof taskStatusEnum)[number];
