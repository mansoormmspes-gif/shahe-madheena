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
      <body className="min-h-full flex flex-col relative bg-slate-50 overflow-x-hidden">
        {/* Animated Background Container */}
        <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-teal-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 right-[-10%] w-[35%] h-[35%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-6000"></div>
        </div>
        <div className="fixed inset-0 bg-dot-pattern opacity-40 pointer-events-none -z-50" />
        {children}
      </body>
    </html>
  );
}
