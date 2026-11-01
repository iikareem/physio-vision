import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { RegisterSW } from "@/components/register-sw";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Physio Vision",
  description:
    "Organize clinic and private physiotherapy patients, notes, and reception.",
  applicationName: "Physio Vision",
  appleWebApp: {
    capable: true,
    // Opaque status bar — avoids the frosted/blur strip under the notch in PWA.
    statusBarStyle: "black",
    title: "Physio Vision",
  },
  formatDetection: {
    telephone: false,
  },
  // Extra legacy keys older iOS / Android look for (alongside appleWebApp).
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Physio Vision",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/apple-touch-icon.png", type: "image/png" },
    ],
    apple: [
      // No sizes — required by older iOS which ignores sized variants.
      { url: "/icons/apple-touch-icon.png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#134e4a" },
    { media: "(prefers-color-scheme: dark)", color: "#134e4a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-screen min-h-dvh overflow-x-hidden antialiased">
        <RegisterSW />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
