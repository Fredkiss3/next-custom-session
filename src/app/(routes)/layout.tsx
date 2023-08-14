import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next Custom Session",
  description: "Custom Session implementation with nextjs app router",
};

export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="py-4 px-5 flex justify-between items-center  bg-slate-300 dark:bg-slate-800">
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
