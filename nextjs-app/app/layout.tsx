import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function RootLayout({
  children,
}: AppProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
