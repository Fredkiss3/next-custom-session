import * as React from "react";
import { getSession } from "~/app/(actions)/auth";

import { FlashMessage } from "./flash-message.client";
export async function FlashMessages() {
  const flashes = await getSession().then((session) => session.getFlash());

  return (
    <>
      {flashes.map((flash) => (
        <FlashMessage key={flash.type} {...flash} />
      ))}
    </>
  );
}
