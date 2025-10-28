import type React from "react";
import type { Metadata } from "next";
import { geist } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueueSync",
  description: "QueueSync",
  generator: "QueueSync.space",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} dark`}>{children}</body>
    </html>
  );
}
