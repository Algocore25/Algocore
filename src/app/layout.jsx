import '../index.css';
import { Providers } from './providers';

export const metadata = {
  title: 'AlgoCore - Master Programming',
  description: 'Practice programming algorithms and challenges.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
