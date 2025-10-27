import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Career Studio GM7",
  description:
    "Career Studio GM7 helps teams craft polished resumes with Firebase Auth, Firestore, and on-demand PDF streaming.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <TopNav />
          <Suspense fallback={<div style={{ padding: "2rem" }}>Loading...</div>}>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
