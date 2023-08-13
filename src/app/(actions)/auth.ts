"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema/user.sql";
import * as argon2 from "argon2";

import { cookies } from "next/headers";
import { cache } from "react";
import { Session } from "~/lib/session";

const registerSchema = z.object({
  username: z.string().min(3, "username should be at least 3 characters"),
  password: z.string().min(3, "password should be at least 3 characters"),
});

export const getSession = cache(async function getSession(): Promise<Session> {
  const sessionId = cookies().get(Session.SESSION_COOKIE_KEY)?.value;

  if (!sessionId) {
    // Normally this code is never reached
    throw new Error("Session ID must be set in middleware");
  }

  const session = await Session.get(sessionId);

  if (!session) {
    // Neither this
    throw new Error(
      "Session must have been created in middleware to be accessed."
    );
  }

  return session;
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

    session.addFlash({
      type: "success",
      message: "Account created successfully",
    });
    revalidatePath("/");
    return redirect("/login");
  }
}
