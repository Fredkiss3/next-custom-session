import * as React from "react";
import { redirect } from "next/navigation";
import {
  getSession,
  getUserAccountInfos,
  logoutUser,
  udpdateAccountInfos,
} from "~/app/(actions)/auth";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";
import { FlashMessages } from "~/app/(components)/flash-message";

export default async function DashboardPage() {
  // get the current authenticated user & redirect to login if not authenticated
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }

  // we are sure the user exists at this moment so we force the typescript type
  const userInfos = (await getUserAccountInfos())!;
  const formData = await session.getFormData();

  return (
    <>
      <FlashMessages />
      <h1 className="text-4xl">Update your account info</h1>

      <form
        action={udpdateAccountInfos}
        className="flex flex-col gap-4 max-w-[300px]"
      >
        <label htmlFor="username">Username</label>
        <Input
          name="username"
          placeholder="ex: johndoe"
          id="username"
          // set aria-invalid for accessibility, the style is already managed by the input component
          aria-invalid={!!formData?.errors?.username}
          // show the user their last input in case of error
          defaultValue={formData?.data?.username ?? userInfos.username}
          aria-describedby="username-error"
        />
        {/* Add username error feedback */}
        {formData?.errors?.username && (
          <small role="alert" id="username-error" className="text-red-500">
            {formData.errors.username}
          </small>
        )}

        <Button>Edit account infos</Button>
      </form>

      <div className="h-[1px] bg-gray-100/20 w-full max-w-[300px]" />
      <form action={logoutUser} className="">
        <Button className="!bg-red-500 dark:!bg-red-500">Logout</Button>
      </form>
    </>
  );
}
