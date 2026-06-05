import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carbon Cascade — Environment Day",
  description: "Trace the interconnected chain of your carbon footprint — from fossil fuels to vanishing species.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
