"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient, RADICADOS_TABLE, calculateBusinessDaysBetween } from "@/lib/supabase"

type Props = {
  /** ID del radicado a actualizar */
  id: string
  /** Número del radicado (solo para el toast) */
  numero?: string
  /** Fecha del radicado (YYYY-MM-DD) para calcular dias_respuesta */
  fechaRadicado?: string | null
  /** Llamar después de actualizar (p.ej. refrescar lista, cerrar modal) */
  onDone?: () => void
  /** Pasar props visuales del botón */
  className?: string
  size?: "sm" | "default" | "lg" | "icon"
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  /** Deshabilitar si ya está respondido */
  disabled?: boolean
}

const toLocalISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function RespondidoButton({
  id,
  numero,
  fechaRadicado,
  onDone,
  className,
  size = "sm",
  variant,
  disabled,
}: Props) {
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const markAsResponded = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const hoy = new Date()
      let dias: number | null = null
      if (fechaRadicado) {
        dias = await calculateBusinessDaysBetween(new Date(fechaRadicado), hoy)
      }

      const { error } = await supabase
        .from(RADICADOS_TABLE)
        .update({
          fecha_radicado_respuesta: toLocalISO(hoy),
          dias_respuesta: dias,
          alerta: false,
        })
        .eq("id", id)

      if (error) {
        toast({
          title: "No se pudo marcar como respondido",
          description: error.message ?? "Intenta nuevamente.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Trámite respondido",
        description: numero ? `#${numero}` : undefined,
      })

      onDone?.()
    } catch (e: any) {
      toast({
        title: "Error inesperado",
        description: e?.message ?? "Revisa la consola.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [loading, fechaRadicado, id, numero, onDone, supabase, toast])

  return (
    <Button
      size={size}
      variant={variant}
      onClick={markAsResponded}
      disabled={disabled || loading}
      className={className}
    >
      <CheckCircle className="w-4 h-4 mr-1" />
      {loading ? "Guardando..." : "Respondido"}
    </Button>
  )
}
