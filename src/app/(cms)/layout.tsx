import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/webdock-cms/styles.css";

export const metadata: Metadata = {
  title: "CMS · Spitzli Development",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
