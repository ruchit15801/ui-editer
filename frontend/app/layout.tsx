import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Studio Canvas",
  description: "Modern browser based image editor"
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-text-main antialiased">
        {props.children}
      </body>
    </html>
  );
}

