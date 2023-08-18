"use server";
import * as argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema/user.sql";
import { cookies } from "next/headers";
import { cache } from "react";
import { Session } from "~/lib/session";
import { eq, sql } from "drizzle-orm";

const registerSchema = z.object({
  username: z
    .string({
      required_error: "username is required",
    })
    // we don't want to consider trailing spaces in the username
    .trim()
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]+$/,
      "Invalid username, only alphanumeric, `_` and numbers accepted"
    )
    .min(3, "username should be at least 3 characters"),
  password: z
    .string({
      required_error: "password is required",
    })
    .min(3, "password should be at least 3 characters"),
});

export const getSession = cache(async function getSession(): Promise<Session> {
  // sessionId can be null, but are sure it is always defined because we do so in the middleware
  const sessionId = cookies().get(Session.SESSION_COOKIE_KEY)!.value;
  // Session can be null, but we are sure it is always defined
  return (await Session.get(sessionId))!;
});

const loginSchema = z.object({
  username: z
    .string({
      required_error: "username is required",
    })
    .min(1, "username is required")
    .trim(),
  password: z
    .string({
      required_error: "password is required",
    })
    .min(1, "password is required"),
});

export async function loginUser(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parseResult = loginSchema.safeParse(data);
  const session = await getSession();

  if (parseResult.success) {
    const { username, password } = parseResult.data;
    const usernameLowerCase = username.toLowerCase();
    const existingUsers = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = ${usernameLowerCase}`);

    if (existingUsers.length === 0) {
      // add a flash message for success case
      await session.addFlash({
        type: "error",
        message: "Invalid username or password",
      });
    } else if (!(await argon2.verify(existingUsers[0].password, password))) {
      // password did not match
      await session.addFlash({
        type: "error",
        message: "Invalid username or password",
      });
    } else {
      // Generate the session for the user & send the new cookie to the client
      await session.generateForUser(existingUsers[0]);
      cookies().set(session.getCookie());

      // add a flash message for success case
      await session.addFlash({
        type: "success",
        message: "You are now logged in, you can have access to your dashboard",
      });
    }
  } else {
    // add form errors for error case
    await session.addFormData({
      data,
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  // revalidate at the end
  return revalidatePath("/login");
}

export async function registerUser(formData: FormData) {
  const data = Object.fromEntries(formData);

  const parseResult = registerSchema.safeParse(data);
  const session = await getSession();

  if (parseResult.success) {
    const { username, password } = parseResult.data;

    const usernameLowerCase = username.toLowerCase();
    const existingUsers = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = ${usernameLowerCase}`);

    if (existingUsers.length > 0) {
      await session.addFormData({
        data,
        errors: {
          username: ["A user with this username already exists"],
        },
      });
    } else {
      await db.insert(users).values({
        username: usernameLowerCase,
        password: await argon2.hash(password),
      });

      // add a flash message for success case
      await session.addFlash({
        type: "success",
        message: "Account created successfully",
      });
    }
  } else {
    // add form errors for error case
    await session.addFormData({
      data,
      errors: parseResult.error.flatten().fieldErrors,
    });
  }
  // revalidate at the end
  return revalidatePath("/register");
}
