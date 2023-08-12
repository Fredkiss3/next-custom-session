import * as React from "react";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-4xl">Login</h1>

      <form action="" className="flex flex-col gap-4 items-start">
        <label htmlFor="username">Username</label>
        <Input name="username" placeholder="ex: johndoe" id="username" />
        <label htmlFor="password">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="ex: super5cr$t"
          id="password"
        />

        <Button>Login</Button>
      </form>
    </>
  );
}
