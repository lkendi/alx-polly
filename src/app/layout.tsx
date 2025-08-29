import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polly - Interactive Polling Platform",
  description:
    "Create, share, and vote on polls with our interactive polling platform. Engage your community and gather insights with real-time voting.",
  keywords: [
    "polls",
    "voting",
    "surveys",
    "community",
    "engagement",
    "feedback",
  ],
  authors: [{ name: "Polly Team" }],
  creator: "Polly",
  publisher: "Polly",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://polly.com",
    title: "Polly - Interactive Polling Platform",
    description:
      "Create, share, and vote on polls with our interactive polling platform.",
    siteName: "Polly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polly - Interactive Polling Platform",
    description:
      "Create, share, and vote on polls with our interactive polling platform.",
    creator: "@polly",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
