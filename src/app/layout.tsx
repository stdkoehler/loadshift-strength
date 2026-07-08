import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/query/providers/QueryProvider";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Next.js reference build of the workout tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <QueryProvider>
          <div className="flex min-h-full flex-1 flex-col">
            <main className="mx-auto w-full max-w-[900px] flex-1">{children}</main>
            <NavBar />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
