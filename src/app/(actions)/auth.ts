"use server";
import * as argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema/user.sql";
import { cookies } from "next/headers";
import { cache } from "react";
import { Session } from "~/lib/session";

const registerSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]+$/, "Invalid username")
    .min(3, "username should be at least 3 characters"),
  password: z.string().min(3, "password should be at least 3 characters"),
});

export const getSession = cache(async function getSession(): Promise<Session> {
  const sessionId = cookies().get(Session.SESSION_COOKIE_KEY)?.value;
  return (await Session.get(sessionId!))!;
});

export async function registerUser(formData: FormData) {
  const data = Object.fromEntries(formData);

  const parseResult = registerSchema.safeParse(data);
  const session = await getSession();

  if (parseResult.success) {
    const { username, password } = parseResult.data;
    await db.insert(users).values({
      username,
      password: await argon2.hash(password),
    });

    await session.addFlash({
      type: "success",
      message: "Account created successfully, you can now login",
    });
  } else {
    await session.addFlash({
      type: "error",
      message: "Your input is invalid",
    });
  }
  return revalidatePath("/");
}
