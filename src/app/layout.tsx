import './globals.css'; // Import your global styles (already present)
import { ReactNode } from 'react';
import localFont from "next/font/local";
import Head from 'next/head';

// Define your local fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        {/* Load FullCalendar styles via CDN */}
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.8/index.global.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/resource-timegrid@6.1.8/index.global.min.css"
          rel="stylesheet"
        />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
