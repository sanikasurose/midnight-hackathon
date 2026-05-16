import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VeriHire | Proof, not exposure",
  description:
    "Privacy-preserving hiring verification on Midnight. Candidates prove qualifications without exposing raw personal data."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

