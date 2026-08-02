import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salinas OS | RCBS Executive Intelligence",
  description:
    "Executive operational intelligence for Reality Check Business Solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
