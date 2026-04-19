import type { Metadata } from "next";
import { Geologica } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/lib/profile-context";

const geologica = Geologica({
  subsets: ["latin"],
  variable: "--font-geologica",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PathPilot AI — Study Abroad Mentor",
  description: "AI-powered study abroad guidance with personalized insights",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geologica.variable} h-full`}>
      <head>
        <meta name="mobile-web-app-capable" content="no" />
        <meta name="apple-mobile-web-app-capable" content="no" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased font-[family-name:var(--font-geologica)]">
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
