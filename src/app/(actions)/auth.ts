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
import { redirect } from "next/navigation";

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
      console.log({
        action: session.getCookie().value,
      });
      cookies().set(session.getCookie());

      // add a flash message for success case
      await session.addFlash({
        type: "success",
        message: "You are now logged in, you can have access to your dashboard",
      });
      return redirect("/dashboard");
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

      return redirect("/login");
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

export async function getUserAccountInfos() {
  const user = await getSession().then((session) => session.user);

  if (user) {
    const dbUsers = await db
      .select({
        // only select the username & id to not expose the password
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, Number(user.id)));

    if (dbUsers.length > 0) {
      return dbUsers[0];
    }
  }

  return null;
}

const updateAccountSchema = z.object({
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
});

export async function udpdateAccountInfos(formData: FormData) {
  const session = await getSession();

  const user = await getUserAccountInfos();
  // Don't allow unauthenticated users
  if (!user) {
    await session.addFlash({
      type: "error",
      message:
        "You need to be logged in to be able to update your account information",
    });

    // Redirect to login if not connected
    return redirect("/login");
  }

  const data = Object.fromEntries(formData);
  const parseResult = updateAccountSchema.safeParse(data);

  if (parseResult.success) {
    const { username } = parseResult.data;

    const usernameLowerCase = username.toLowerCase();

    // verify that there is not already a different user with this username
    const existingUsers = await db
      .select()
      .from(users)
      .where(
        sql`lower(${users.username}) = ${usernameLowerCase} AND id != ${user.id}`
      );

    if (existingUsers.length > 0) {
      await session.addFormData({
        data,
        errors: {
          username: ["A user with this username already exists"],
        },
      });
    } else {
      await db
        .update(users)
        .set({
          username: username.toLowerCase(),
        })
        .where(eq(users.id, user.id));

      // add a flash message for success case
      await session.addFlash({
        type: "success",
        message: "Username updated successfully",
      });
      return redirect("/dashboard/account");
    }
  } else {
    // add form errors for error case
    await session.addFormData({
      data,
      errors: parseResult.error.flatten().fieldErrors,
    });
  }
  // revalidate at the end
  return revalidatePath("/dashboard/account");
}

export async function logoutUser() {
  const session = await getSession();

  const user = await getUserAccountInfos();
  // Don't allow unauthenticated users
  if (!user) {
    await session.addFlash({
      type: "error",
      message:
        "You need to be logged in to be able to update your account information",
    });

    // Redirect to login if not connected
    return redirect("/login");
  }

  await session.invalidate();
  await session.addFlash({
    type: "success",
    message: "You are now Logged out.",
  });

  cookies().set(session.getCookie());
  return redirect("/login");
}
