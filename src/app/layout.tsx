import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const body = localFont({
  src: "../../public/fonts/manrope-latin.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});
const description =
  "Alisher Farhadi builds AI products and classroom software, and teaches people how to use them. See Pixio, TSI Hub, native apps and open-source tools.";
const title = "Alisher Farhadi | AI builder and educator";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Alisher Farhadi",
  },
  description,
  authors: [{ name: "Alisher Farhadi" }],
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Alisher Farhadi",
    title,
    description,
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Alisher Farhadi: AI builder and educator, with screenshots of Pixio and TSI Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@AlisherFarhadi",
    title,
    description,
    images: ["/og/home.jpg"],
  },
  icons: { icon: "/favicon.ico", shortcut: "/favicon-16x16.png" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" id="top" className={body.variable}>
      <body>{children}</body>
    </html>
  );
}
