import * as React from "react";
import { clsx } from "~/lib/utils";

export type InputProps = React.JSX.IntrinsicElements["input"];

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        props.className,
        "w-72 px-4 h-12 bg-white ring-1 ring-slate-900/10 shadow-sm rounded-lg dark:text-slate-400",
        "hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500",
        "dark:bg-slate-800 dark:ring-0 dark:text-slate-300 dark:highlight-white/5 dark:hover:bg-slate-700"
      )}
    />
  );
}
