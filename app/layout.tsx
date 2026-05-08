import '../styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Photographer | YOLO Photography',
  description: 'YOLO Photography provides high-end wedding, portrait, destination, and event photography services.',
  keywords: ['Professional Photographer', 'Destination Wedding Photographer', 'Event Photography Services', 'Portrait Photography', 'YOLO Photography']
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#334155" />
      </head>
      <body>{children}</body>
    </html>
  );
}
