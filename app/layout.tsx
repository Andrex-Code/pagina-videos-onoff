import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Videos de Canales ONOFF',
  description: 'Biblioteca de videos para TiendasOn, YaDinero y TryController.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
