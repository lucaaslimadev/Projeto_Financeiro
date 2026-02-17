import type { Metadata } from 'next';
import '@/app/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Projeto Financeiro',
  description: 'Controle financeiro pessoal com integração Telegram',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
