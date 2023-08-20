import * as React from "react";
import { getSession } from "~/app/(actions)/auth";
import { headers } from "next/headers";
import { FlashMessageClient } from "./flash-message.client";

export async function FlashMessages() {
  // ignore HEAD requests because
  // next use them for redirects and rerender the page twice
  if (headers().get("x-method") === "HEAD") return null;

  const flashes = await getSession().then((session) => session.getFlash());

  return (
    <>
      {flashes.map((flash) => (
        <FlashMessageClient key={Math.random()} {...flash} />
      ))}
    </>
  );
}
