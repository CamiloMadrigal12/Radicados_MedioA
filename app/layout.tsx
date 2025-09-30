// app/layout.tsx
import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { ToastProvider, ToastViewport } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "Sistema de Seguimiento de Radicados",
  description: "Gestión y seguimiento de documentos oficiales",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}
