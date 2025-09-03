import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Alisher Farhadi - Developer, Educator, Entrepreneur",
  description:
    "Alisher Farhadi is a developer, educator, and entrepreneur, and an AI enthusiast having developed several SAAS platforms and worked on online infrastructure.",
  keywords: [
    "Alisher Farhadi",
    "developer",
    "educator",
    "entrepreneur",
    "AI",
    "SAAS",
    "infrastructure",
  ],
  authors: [{ name: "Alisher Farhadi" }],
  metadataBase: new URL("https://alisher.space"),
  openGraph: {
    type: "website",
    url: "https://alisher.space",
    title: "Alisher Farhadi - Developer, Educator, Entrepreneur",
    description:
      "Alisher Farhadi is a developer, educator, and entrepreneur, and an AI enthusiast having developed several SAAS platforms and worked on online infrastructure.",
    images: [
      {
        url: "/og-image.png", // placeholder
        width: 1200,
        height: 630,
        alt: "Alisher Farhadi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@AlisherFarhadi", // Replace with actual handle
    creator: "@AlisherFarhadi", // Replace with actual handle
    title: "Alisher Farhadi - Developer, Educator, Entrepreneur",
    description:
      "Alisher Farhadi is a developer, educator, and entrepreneur, and an AI enthusiast having developed several SAAS platforms and worked on online infrastructure.",
    images: ["/twitter-image.png"], // placeholder
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
        {children}
      </body>
    </html>
  );
}
