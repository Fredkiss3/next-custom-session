import * as React from "react";
import { Button } from "~/app/(components)/button";
import { Input } from "~/app/(components)/input";

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-4xl">Welcome to your super secret dashboard</h1>

      <h2 className="text-2xl">Here is a cat picture</h2>

      <img src="https://http.cat/100.jpg" alt="100 Continue" />
    </>
  );
}
