import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sitescope.vercel.app"),
  title: "Free Website SEO Audit Tool | SiteScope",
  description: "Get a practical website SEO audit with scores and clear, actionable recommendations for technical SEO, content, performance, and accessibility.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Free Website SEO Audit Tool | SiteScope",
    description: "Get a practical website SEO audit with clear, actionable recommendations.",
    type: "website",
    siteName: "SiteScope",
  },
  twitter: { card: "summary", title: "Free Website SEO Audit Tool | SiteScope", description: "Get a practical website SEO audit with clear recommendations." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-white">{children}</body>
    </html>
  );
}
