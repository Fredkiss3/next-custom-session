import * as React from "react";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-4xl">Update your account info</h1>

      <form action="" className="flex flex-col gap-4">
        <Input placeholder="username" />
        <Input placeholder="username" />
        <Button>Edit profile infos</Button>
      </form>

      <form action="" className="">
        <Button className="!bg-red-500 dark:!bg-red-500">Logout</Button>
      </form>
    </>
  );
}
