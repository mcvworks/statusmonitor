import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, Fira_Code } from "next/font/google";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const BASE_URL = "https://monitor.ducktyped.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "DTMonitor — IT Alert Dashboard",
    template: "%s | DTMonitor",
  },
  description:
    "Centralized IT alert dashboard for monitoring cloud service outages, SaaS incidents, security vulnerabilities, and ISP issues.",
  icons: { icon: "/favicon.ico" },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "DTMonitor",
    title: "DTMonitor — IT Alert Dashboard",
    description:
      "Monitor cloud service outages, SaaS incidents, security vulnerabilities, and ISP issues in real time.",
    url: BASE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DTMonitor — IT Alert Dashboard",
    description:
      "Monitor cloud service outages, SaaS incidents, security vulnerabilities, and ISP issues in real time.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ducktyped",
  url: "https://ducktyped.com",
  logo: "https://ducktyped.com/logo.png",
  sameAs: [],
  subOrganization: {
    "@type": "WebApplication",
    name: "DTMonitor",
    url: "https://monitor.ducktyped.com",
    applicationCategory: "MonitoringApplication",
    description:
      "Centralized IT alert dashboard for monitoring cloud service outages, SaaS incidents, security vulnerabilities, and ISP issues.",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script to prevent FOUC — runs before paint
  const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='system'?window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light':t;if(d==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light-theme')}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light-theme')}}catch(e){}})()`;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${firaCode.variable} antialiased`}
      >
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
