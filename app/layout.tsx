import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CollaborationProvider } from '@/lib/collaboration/collaboration-context';
import { Oxanium, Source_Code_Pro, Source_Serif_4 } from 'next/font/google';

export const metadata: Metadata = {
  title: 'CodeSync - Real-Time Collaborative Code Editor',
  description:
    'A cloud-hosted, real-time collaborative code editor and IDE. Edit, debug, and collaborate live with sub-20ms global synchronization.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

const oxanium = Oxanium({ subsets: ['latin'], variable: '--font-oxanium' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], variable: '--font-source-code-pro' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' });

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Use a consistent room ID for the demo
  // In a real app, you might want to generate this based on the URL or user session
  const roomId = 'codesync-demo-room';

  return (
    <html lang="en">
      <body className={`${oxanium.variable} ${sourceCodePro.variable} ${sourceSerif.variable} font-sans`}>
        <CollaborationProvider
          roomId={roomId}
          initialCode="// Welcome to CodeSync!\n// Start coding with your team in real-time"
        >
          {children}
          <Analytics />
        </CollaborationProvider>
      </body>
    </html>
  );
}
