import type { Metadata } from "next";
import Script from "next/script";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimationLayer from "@/components/AnimationLayer";
import CompareBar from "@/components/CompareBar";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const IMPACT_UTT_ID = process.env.NEXT_PUBLIC_IMPACT_UTT_ID ?? "";
const SKIMLINKS_SITE_ID = process.env.NEXT_PUBLIC_SKIMLINKS_SITE_ID ?? "";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans-brand",
  display: "swap",
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregret.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Pregret — Know Before You Regret",
    template: "%s | Pregret",
  },
  description:
    "The Regret Score for any product — before you buy. Owner-verified satisfaction data at day 30, 60, and 90. Serving shoppers across the US and Canada.",
  keywords: [
    "product regret score",
    "should I buy",
    "product satisfaction",
    "buyer's remorse",
    "long-term reviews",
    "worth it",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "en-CA": "/",
      "en": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Pregret",
    url: site,
    title: "Pregret — Know Before You Regret",
    description:
      "The Regret Score for any product. Owner-verified satisfaction at day 30, 60, and 90 — across US and Canada.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Pregret — The Regret Score for anything before you buy it.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pregret — Know Before You Regret",
    description: "Time-decayed satisfaction data on the products you're about to buy.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <head>
        {/* Force refresh/reload to start at the top of the page */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("scrollRestoration" in history){history.scrollRestoration="manual"}try{window.scrollTo(0,0)}catch(e){}`,
          }}
        />
        <meta name="geo.region" content="US" />
        <meta name="geo.region" content="CA" />
        <meta name="geo.placename" content="United States, Canada" />
        <link rel="alternate" hrefLang="en-US" href={site} />
        <link rel="alternate" hrefLang="en-CA" href={site} />
        <link rel="alternate" hrefLang="en" href={site} />
        <link rel="alternate" hrefLang="x-default" href={site} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Pregret",
              url: site,
              inLanguage: ["en-US", "en-CA"],
              audience: {
                "@type": "PeopleAudience",
                geographicArea: [
                  { "@type": "Country", name: "United States" },
                  { "@type": "Country", name: "Canada" },
                ],
              },
              potentialAction: {
                "@type": "SearchAction",
                target: `${site}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Pregret",
              url: site,
              logo: `${site}/logo.png`,
              areaServed: [
                { "@type": "Country", name: "United States" },
                { "@type": "Country", name: "Canada" },
              ],
            }),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {IMPACT_UTT_ID && (
          <Script
            id="impact-utt"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/${IMPACT_UTT_ID}.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`,
            }}
          />
        )}
        {SKIMLINKS_SITE_ID && (
          <Script
            id="skimlinks"
            strategy="lazyOnload"
            src={`https://s.skimresources.com/js/${SKIMLINKS_SITE_ID}.skimlinks.js`}
          />
        )}
        <div className="rd flex min-h-full flex-col" data-rd>
          <span className="rd-progress" data-progress />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AnimationLayer />
          <CompareBar />
          <CookieBanner />
        </div>
      </body>
    </html>
  );
}
