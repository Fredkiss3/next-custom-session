import * as React from "react";
import Image from "next/image";
import { getSession } from "~/app/(actions)/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // get the current authenticated user & redirect to login if not authenticated
  const user = await getSession().then((session) => session.user);
  if (!user) {
    redirect("/login");
  }
  return (
    <>
      <h1 className="text-4xl">Welcome to your super secret dashboard</h1>

      <h2 className="text-2xl">Here is a picture of a cat :</h2>

      <Image
        width={500}
        height={500}
        src="https://http.cat/100.jpg"
        alt="100 Continue"
      />
    </>
  );
}
