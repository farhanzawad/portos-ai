import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "PORTOS AI — Port Operations Intelligence System",
  description:
    "Bangladesh-focused AI-assisted port operations decision-support prototype for container terminals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-portos-bg text-portos-navy antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
