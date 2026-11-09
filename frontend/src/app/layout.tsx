import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/lib/query-provider";
import { EventStreamProvider } from "@/context/EventStreamContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <EventStreamProvider>
            <AppShell>{children}</AppShell>
          </EventStreamProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
