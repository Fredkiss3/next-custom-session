import * as React from "react";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";
import { registerUser } from "~/app/(actions)/auth";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-4xl">Register</h1>

      <form
        action={registerUser}
        className="flex flex-col gap-4 items-start"
        autoComplete="off"
      >
        <label htmlFor="username">Username</label>
        <Input name="username" placeholder="ex: johndoe" id="username" />
        <label htmlFor="password">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="ex: super5cr$t"
          id="password"
        />

        <Button>Create account</Button>
      </form>
    </>
  );
}
