import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import PageOverrideProvider from '../components/PageOverrideProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Check if this is an error page (404 or 500)
  // Error pages need minimal rendering to avoid build-time issues in AWS Amplify
  const isErrorPage = Component.displayName === 'Custom404' || 
                       Component.displayName === 'Custom500' ||
                       (Component as any).name === 'Custom404' ||
                       (Component as any).name === 'Custom500';

  // For error pages, render without any wrappers to prevent SSR issues
  if (isErrorPage) {
    return <Component {...pageProps} />;
  }

  // Normal pages get full app wrapper with auth and analytics
  return (
    <>
      {/* Google Analytics 4 */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                anonymize_ip: true,
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      <SessionProvider session={session}>
        <PageOverrideProvider>
          <Component {...pageProps} />
        </PageOverrideProvider>
      </SessionProvider>
    </>
  );
}
