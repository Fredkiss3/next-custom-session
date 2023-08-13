import * as React from "react";
// import { getSession } from "~/app/(actions)/auth";
import { clsx } from "~/lib/utils";
import type { SessionFlash } from "~/lib/session";

export async function FlashMessages() {
  const flashes = [
    {
      type: "error",
      message: "Error",
    },
    {
      type: "success",
      message: "Success",
    },
  ]; //await getSession().then((session) => session.getFlash());

  return (
    <>
      {flashes.map((flash) => (
        <FlashMessages key={flash.type} {...flash} />
      ))}
    </>
  );
}

function FlashMesssage(props: SessionFlash) {
  return (
    <div
      className={clsx("rounded-md p-2 border", {
        "text-emerald-700 bg-emerald-400/20": props.type === "success",
        "": props.type === "error",
      })}
    >
      {props.message}
    </div>
  );
}
