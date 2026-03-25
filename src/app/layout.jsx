import Script from 'next/script';
import '../index.css';
import { Providers } from './providers';

export const metadata = {
  title: 'AlgoCore - Master Programming',
  description: 'Practice programming algorithms and challenges.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VGBPBNEPP8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VGBPBNEPP8');
          `}
        </Script>

        {/* TensorFlow.js core */}
        <Script
          src="https://unpkg.com/@tensorflow/tfjs@3.21.0/dist/tf.min.js"
          strategy="beforeInteractive"
        />
        {/* COCO-SSD model */}
        <Script
          src="https://unpkg.com/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

