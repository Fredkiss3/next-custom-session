"use client";
import * as React from "react";
import { clsx } from "~/lib/utils";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

export type ButtonProps = React.JSX.IntrinsicElements["button"];

export function Button(props: ButtonProps) {
  const status = useFormStatus();
  return (
    <button
      {...props}
      disabled={status.pending}
      className={clsx(
        props.className,
        "bg-slate-900 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto",
        "dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400",
        "hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      )}
    >
      {status.pending && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {props.children}
    </button>
  );
}
