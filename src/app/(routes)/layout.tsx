import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import { getSession } from "~/app/(actions)/auth";

import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next Custom Session",
  description: "Custom Session implementation with nextjs app router",
};

export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // get the current authenticated user
  const user = await getSession().then((session) => session.user);
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="py-4 px-5 flex justify-between items-center bg-slate-300 dark:bg-slate-800">
          <Link className="text-2xl" href="/">
            Acme Secret Corp.
          </Link>
          <nav>
            <ul className="flex items-center gap-4">
              <li>
                <Link href="/" className="underline">
                  Home
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link href="/dashboard" className="underline">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/account" className="underline">
                      Account
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="underline">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="underline">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </header>

        <main className="flex min-h-screen flex-col items-center gap-8 p-5 container md:p-24 mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
