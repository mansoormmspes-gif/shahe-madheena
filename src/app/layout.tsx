import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meelad Fest 2k26 - Irshadu swibiyan madrasa",
  description: "Event registration and management for Meelad Fest 2k26",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-slate-50">
        {/* Subtle Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-300/30 blur-[120px] rounded-full animate-blob" />
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-amber-200/20 blur-[120px] rounded-full animate-blob [animation-delay:2s]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-teal-300/20 blur-[120px] rounded-full animate-blob [animation-delay:4s]" />
        </div>
        <div className="fixed inset-0 bg-dot-pattern opacity-40 pointer-events-none -z-40" />
        {children}
      </body>
    </html>
  );
}
