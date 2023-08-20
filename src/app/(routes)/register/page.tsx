import * as React from "react";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";
import { getSession, registerUser } from "~/app/(actions)/auth";
import Link from "next/link";

export default async function RegisterPage() {
  // get form data & errors
  const formData = await getSession().then((s) => s.getFormData());

  return (
    <>
      <h1 className="text-4xl">Register</h1>

      <form
        action={registerUser}
        className="flex flex-col gap-4 items-start max-w-[300px]"
      >
        <label htmlFor="username">Username</label>
        <Input
          name="username"
          placeholder="ex: johndoe"
          id="username"
          // set aria-invalid for accessibility, the style is already managed by the input component
          aria-invalid={!!formData?.errors?.username}
          // set defaultValue in case our app is loaded without JS
          defaultValue={formData?.data?.username}
          aria-describedby="username-error"
        />
        {/* Add username error feedback */}
        {formData?.errors?.username && (
          <small role="alert" id="username-error" className="text-red-500">
            {formData.errors.username}
          </small>
        )}

        <label htmlFor="password">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="ex: super5cr$t"
          id="password"
          aria-invalid={!!formData?.errors?.password}
          aria-describedby="password-error"
        />

        {/* Add password error feedback */}
        {formData?.errors?.password && (
          <small role="alert" id="password-error" className="text-red-500">
            {formData.errors.password}
          </small>
        )}

        <Button>Create account</Button>
      </form>

      <small>
        Already have an account ?&nbsp;
        <Link href="/login" className="underline">
          Login
        </Link>
      </small>
    </>
  );
}
