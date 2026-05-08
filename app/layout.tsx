import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NTL Sales Dashboard 2569",
  description: "Realtime sales dashboard – เงินติดล้อ ปี 2569",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
