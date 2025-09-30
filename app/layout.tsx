// app/layout.tsx
import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Sistema de Seguimiento de Radicados",
  description: "Gestión y seguimiento de documentos oficiales",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
        {/* Renderer de toasts */}
        <Toaster />
      </body>
    </html>
  )
}
