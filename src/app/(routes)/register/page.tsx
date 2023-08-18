"use client";
import * as React from "react";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";
import { registerUser } from "~/app/(actions)/auth";
// import { FlashMessages } from "~/app/(components)/flash-message";

export default function RegisterPage() {
  return (
    <>
      {/* <FlashMessages /> */}
      <h1 className="text-4xl">Register</h1>

      <form
        action={registerUser}
        onChange={(e) => {
          console.log(e);
        }}
        className="flex flex-col gap-4 items-start"
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
