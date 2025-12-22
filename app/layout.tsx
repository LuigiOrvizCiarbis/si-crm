import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./client-layout"

export const metadata: Metadata = {
  title: "Social Impulse — CRM IA Omnicanal",
  description:
    "CRM Conversacional con IA para WhatsApp, Instagram y más canales. Automatiza ventas y mejora conversiones.",
  keywords: "CRM, WhatsApp Business, Instagram, IA, automatización, ventas, conversaciones",
  authors: [{ name: "Social Impulse" }],
  creator: "Social Impulse",
  publisher: "Social Impulse",
  openGraph: {
    title: "Social Impulse — CRM IA Omnicanal",
    description: "CRM Conversacional con IA para WhatsApp, Instagram y más canales",
    url: "https://socialimpulse.com",
    siteName: "Social Impulse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Social Impulse CRM",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Impulse — CRM IA Omnicanal",
    description: "CRM Conversacional con IA para WhatsApp, Instagram y más canales",
    images: ["..\public\logo-sicrm..png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
