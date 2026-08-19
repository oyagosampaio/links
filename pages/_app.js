import Head from 'next/head';
import '../styles/globals.css';
import { BRAND, siteUrl } from '../lib/brand';

export default function App({ Component, pageProps }) {
  const url = siteUrl();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{BRAND.name}</title>
        <meta name="description" content={BRAND.description} />
        <link rel="icon" href={BRAND.favicon} type="image/png" />
        <link rel="apple-touch-icon" href={BRAND.favicon} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={BRAND.name} />
        <meta property="og:title" content={`${BRAND.name} — Gerencie seus links por R$ 9,90/mês`} />
        <meta property="og:description" content={BRAND.description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={BRAND.preview} />
        <meta property="og:image:alt" content={BRAND.name} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${BRAND.name} — Gerencie seus links por R$ 9,90/mês`} />
        <meta name="twitter:description" content={BRAND.description} />
        <meta name="twitter:image" content={BRAND.preview} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
