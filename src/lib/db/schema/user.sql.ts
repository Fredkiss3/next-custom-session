import { InferModel } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 256 }).unique(),
  password: varchar("password", { length: 256 }),
});

export type User = InferModel<typeof users>;
