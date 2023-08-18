import * as React from "react";
import { clsx } from "~/lib/utils";
import { getSession } from "~/app/(actions)/auth";
import { ClearFlash } from "./clear-flash";

import type { SessionFlash } from "~/lib/session";
export async function FlashMessages() {
  const flashes = await getSession().then((session) => session.getFlash());

  return (
    <>
      {flashes.map((flash) => (
        <FlashMessage key={flash.type} {...flash} />
      ))}

      <ClearFlash />
    </>
  );
}

export function FlashMessage(props: SessionFlash) {
  return (
    <div
      className={clsx("p-2 border rounded-md max-w-[300px]", {
        "text-emerald-600 border-emerald-600 dark:text-emerald-500 dark:border-emerald-500":
          props.type === "success",
        "text-red-600 border-red-600 dark:text-red-400 dark:border-red-400":
          props.type === "error",
      })}
    >
      {props.message}
    </div>
  );
}
