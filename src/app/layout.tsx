import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/query/providers/QueryProvider";
import { NavBar } from "@/components/NavBar";
import { Header } from "@/components/Header";
import { RestTimerBar } from "@/components/training/RestTimerBar";
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
  title: "LoadShift Strength",
  description: "LoadShift Strength — track training, plans, and progress",
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
      <body className="h-dvh overflow-hidden flex flex-col bg-neutral-950 text-neutral-100">
        <QueryProvider>
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <Header />
            <main className="min-h-0 flex-1 overflow-y-auto app-scroll">
              <div className="mx-auto w-full max-w-[900px]">{children}</div>
            </main>
            <RestTimerBar />
            <NavBar />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
