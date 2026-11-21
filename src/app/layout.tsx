import type { Metadata } from 'next';
import './globals.css';
import { CmsConfigProvider } from '@/providers/CmsConfigProvider';

export const metadata: Metadata = {
  title: 'Royal — Electro de Maison | E-Commerce & Électroménager Tunisie',
  description: 'Plateforme E-Commerce Royal — Électroménager et équipement de cuisine d’excellence en Tunisie.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '256x256' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[var(--royal-bg)] text-[var(--royal-ink)]">
        <CmsConfigProvider>{children}</CmsConfigProvider>
      </body>
    </html>
  );
}
