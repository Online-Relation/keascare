import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KeasCare Markedssignaler",
  description: "Markedssignaler og tilsynsrapporter for bosteder",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: '/images/icons/favicon.png',
    apple: '/images/icons/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${workSans.variable} h-full antialiased`}>
      <body className={`${workSans.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
