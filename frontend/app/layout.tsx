import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VeriHire",
  description: "Privacy-preserving hiring verification (hackathon MVP)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
      </body>
    </html>
  );
}

