import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Go — surround territory, capture stones",
  description:
    "The ancient game of Go (Weiqi / Baduk) built with Next.js and TypeScript. Play 9×9, 13×13 or 19×19 against a friend or a heuristic computer opponent, with full rules — captures, ko, suicide, passing — and Chinese area scoring on a neon board.",
};

export const viewport: Viewport = {
  themeColor: "#070610",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
