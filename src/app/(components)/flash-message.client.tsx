"use client";
import * as React from "react";
import { SessionFlash } from "~/lib/session";
import { clsx } from "~/lib/utils";

export function FlashMessage(props: SessionFlash) {
  const [hidden, setHidden] = React.useState(false);
  return (
    <div
      className={clsx(
        "p-2 border rounded-md items-center justify-between gap-10",
        {
          "text-emerald-600 border-emerald-600 dark:text-emerald-500 dark:border-emerald-500":
            props.type === "success",
          "text-red-600 border-red-600 dark:text-red-400 dark:border-red-400":
            props.type === "error",
          flex: !hidden,
          hidden,
        }
      )}
    >
      <span>{props.message}</span>
      <button onClick={() => setHidden(true)} className="text-gray-200">
        X
      </button>
    </div>
  );
}
