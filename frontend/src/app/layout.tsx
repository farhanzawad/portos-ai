import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/lib/query-provider";
import { EventStreamProvider } from "@/context/EventStreamContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-[#0A0C10] text-[#e2e2e8] font-sans antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <EventStreamProvider>
            <AppShell>{children}</AppShell>
          </EventStreamProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
