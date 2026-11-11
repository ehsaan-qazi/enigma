import type { Metadata } from "next";
import { switzer } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENIGMA | Academic Viva & Understanding Verification",
  description: "AI-powered academic viva platform for verifiable student understanding and rigorous oral assessment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${switzer.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-[#171923]">
        {children}
      </body>
    </html>
  );
}
