"use client"

import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { CommandPalette } from "@/components/CommandPalette"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { useToast } from "@/components/Toast"
import { AuthGuard } from "@/components/AuthGuard"
import "./globals.css"

function ToastProvider({ children }: { children: React.ReactNode }) {
  const { ToastContainer } = useToast()

  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F1117" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <AuthGuard>
              <div className="pb-[max(env(safe-area-inset-bottom),64px)] md:pb-0">
                <Suspense fallback={null}>{children}</Suspense>
              </div>
              <CommandPalette />
              <MobileBottomNav />
            </AuthGuard>
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
