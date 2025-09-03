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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Global SVG defs for Electric Border effect */}
        <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1">
                <animate attributeName="baseFrequency" values="0.015;0.03;0.015" dur="6s" repeatCount="indefinite" />
              </feTurbulence>
              <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>

              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1">
                <animate attributeName="baseFrequency" values="0.015;0.03;0.015" dur="6s" repeatCount="indefinite" />
              </feTurbulence>
              <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>

              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1b" seed="2">
                <animate attributeName="baseFrequency" values="0.02;0.035;0.02" dur="6s" repeatCount="indefinite" />
              </feTurbulence>
              <feOffset in="noise1b" dx="0" dy="0" result="offsetNoise3">
                <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>

              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2b" seed="2">
                <animate attributeName="baseFrequency" values="0.02;0.035;0.02" dur="6s" repeatCount="indefinite" />
              </feTurbulence>
              <feOffset in="noise2b" dx="0" dy="0" result="offsetNoise4">
                <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
              </feOffset>

              <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
              <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
              <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

              <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B">
                <animate attributeName="scale" values="20;30;20" dur="6s" repeatCount="indefinite" />
              </feDisplacementMap>
            </filter>
          </defs>
        </svg>

        {children}
      </body>
    </html>
  );
}
