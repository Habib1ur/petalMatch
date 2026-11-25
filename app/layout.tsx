import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Playfair_Display } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "PetalMatch — Where names meet a little magic.",
    template: "%s | PetalMatch",
  },
  description:
    "Two names. One little experiment. A surprising compatibility result wrapped in soft petals and quiet magic.",
  manifest: "/manifest.json",
  openGraph: {
    title: "PetalMatch — Where names meet a little magic.",
    description:
      "Two names. One little experiment. Discover your playful compatibility score.",
    type: "website",
    siteName: "PetalMatch",
  },
  twitter: {
    card: "summary_large_image",
    title: "PetalMatch — Where names meet a little magic.",
    description:
      "Two names. One little experiment. Discover your playful compatibility score.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF7FA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-[#F5A6C8]/30 selection:text-[#35283A]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
