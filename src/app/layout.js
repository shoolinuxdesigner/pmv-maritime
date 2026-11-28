import { Nunito_Sans, Oswald } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientLayout from "../components/ClientLayout";
import { getMaintenanceStatus, checkMaintenanceBypass } from "@/lib/maintenance";
import { cookies } from "next/headers";

export const SHOW_LOADER = false;

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  themeColor: "#007BA7",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL("https://pmvmaritime.com"),
  title: {
    default: "PMV | Pinnacle Marine Ventures (PMV Maritime Solutions)",
    template: "%s | PMV - Pinnacle Marine Ventures",
  },
  description: "Pinnacle Marine Ventures (PMV), operating as PMV Maritime Solutions, delivers integrated marine & vessel services, technical management, crewing, shipbuilding, port operations, and marine consultancy.",
  keywords: [
    'PMV',
    'Pinnacle Marine Ventures',
    'Pinacle Marine Ventures',
    'PMV Maritime Solutions',
    'PMV Marine',
    'Marine Consultancy',
    'Maritime Training',
    'Ship Building',
    'Port Operations',
    'Marine Surveys',
    'Vessel Consultancy',
    'Audits & Inspections',
    'Vessel Management',
    'Technical Management',
    'Crew Management',
    'Ship Scrapping',
    'Pre-purchase Vessel Assessments'
  ],
  authors: [{ name: "Pinnacle Marine Ventures (PMV)" }],
  publisher: "Pinnacle Marine Ventures (PMV)",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PMV Maritime",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://pmvmaritime.com/",
  },
  openGraph: {
    title: "PMV | Pinnacle Marine Ventures (PMV Maritime Solutions)",
    description: "Pinnacle Marine Ventures (PMV), operating as PMV Maritime Solutions, delivers integrated marine & vessel services, technical management, crewing, shipbuilding, port operations, and marine consultancy.",
    url: "https://pmvmaritime.com",
    siteName: "Pinnacle Marine Ventures (PMV)",
    locale: "en_US",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://pmvmaritime.com/#organization",
      "name": "Pinnacle Marine Ventures",
      "alternateName": [
        "PMV",
        "Pinacle Marine Ventures",
        "PMV Maritime Solutions",
        "PMV Maritime Solutions Limited"
      ],
      "url": "https://pmvmaritime.com",
      "logo": "https://pmvmaritime.com/logo.png",
      "description": "Pinnacle Marine Ventures (PMV), operating as PMV Maritime Solutions, delivers integrated marine and vessel services worldwide."
    },
    {
      "@type": "WebSite",
      "@id": "https://pmvmaritime.com/#website",
      "url": "https://pmvmaritime.com",
      "name": "Pinnacle Marine Ventures (PMV)",
      "alternateName": ["PMV", "Pinacle Marine Ventures", "PMV Maritime Solutions"],
      "publisher": {
        "@id": "https://pmvmaritime.com/#organization"
      }
    }
  ]
};

export default async function RootLayout({ children }) {
  let maintenanceMode = false;
  try {
    const maintenanceData = await getMaintenanceStatus();
    maintenanceMode = Boolean(maintenanceData?.isEnabled);

    if (maintenanceMode) {
      try {
        const cookieStore = await cookies();
        const bypassCookie = cookieStore.get("maintenance_bypass_expiry");
        if (checkMaintenanceBypass(bypassCookie)) {
          maintenanceMode = false;
        }
      } catch {
        // Safe fallback if cookies cannot be accessed during SSR
      }
    }
  } catch (err) {
    console.error("Maintenance check error in RootLayout:", err);
    maintenanceMode = false;
  }

  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${oswald.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col relative">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-W8T8S6RFGY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-W8T8S6RFGY');
          `}
        </Script>
        <ClientLayout maintenanceMode={maintenanceMode} showLoader={SHOW_LOADER}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
