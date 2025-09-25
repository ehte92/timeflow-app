import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(
  email: string,
  name: string,
  password: string,
) {
  const hashedPassword = await hashPassword(password);

  const newUser = await db
    .insert(users)
    .values({
      email,
      name,
      password: hashedPassword,
    })
    .returning();

  return newUser[0];
}

export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}
