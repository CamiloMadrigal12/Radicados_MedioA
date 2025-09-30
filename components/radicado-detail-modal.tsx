"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createClient, RADICADOS_TABLE, calculateBusinessDaysBetween } from "@/lib/supabase"
import { ArrowLeft, X, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Radicado = {
  id: string
  funcionario: string
  fecha_radicado: string
  numero_radicado: string
  fecha_asignacion: string | null
  fecha_limite_respuesta: string | null
  tema: string
  canal: string
  remitente: string
  solicitud: string
  conclusion_respuesta: string | null
  numero_radicado_prorroga: string | null
  fecha_solicitud_prorroga: string | null
  numero_radicado_respuesta: string | null
  fecha_radicado_respuesta: string | null
  dias_respuesta: number | null
  alerta: boolean
  respuesta_parcial: string | null
  created_at: string
}

interface Props {
  radicado: Radicado | null
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onUpdate?: () => void | Promise<void>
}

const toLocalISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function RadicadoDetailModal({
  radicado,
  open,
  isOpen,
  onOpenChange,
  onClose,
  onUpdate,
}: Props) {
  const supabase = createClient()
  const { toast } = useToast()
  const visible = Boolean(open ?? isOpen)

  const fechaLimiteFmt = useMemo(() => {
    if (!radicado?.fecha_limite_respuesta) return ""
    const d = new Date(radicado.fecha_limite_respuesta)
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }, [radicado?.fecha_limite_respuesta])

  if (!visible || !radicado) return null

  const close = () => {
    onOpenChange?.(false)
    onClose?.()
  }

  const markAsResponded = async () => {
    const hoy = new Date()
    const iso = toLocalISO(hoy)
    const dias =
      radicado.fecha_radicado
        ? await calculateBusinessDaysBetween(new Date(radicado.fecha_radicado), hoy)
        : null

    const { error } = await supabase
      .from(RADICADOS_TABLE)
      .update({
        fecha_radicado_respuesta: iso,
        dias_respuesta: dias,
        alerta: false,
      })
      .eq("id", radicado.id)

    if (error) {
      toast({
        title: "No se pudo marcar como respondido",
        description: error.message ?? "Inténtalo nuevamente.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Trámite respondido",
      description: `#${radicado.numero_radicado}`,
    })

    await onUpdate?.()
    close()
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* items-start + padding superior: evita que se corte en pantallas bajas */}
      <div className="min-h-full flex items-start justify-center p-4">
        <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header sticky para que el botón Volver siempre se vea */}
          <CardHeader className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b">
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="gap-1" onClick={close}>
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>

              <CardTitle className="text-base sm:text-lg">
                Detalle del radicado{" "}
                <span className="font-mono">#{radicado.numero_radicado}</span>
              </CardTitle>

              <Button variant="ghost" onClick={close} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Contenido con scroll propio dentro del Card */}
          <CardContent className="space-y-4 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Funcionario</Label>
                <Input readOnly value={radicado.funcionario ?? ""} />
              </div>
              <div>
                <Label className="text-xs">Tema</Label>
                <Input readOnly value={radicado.tema ?? ""} />
              </div>
              <div>
                <Label className="text-xs">Remitente</Label>
                <Input readOnly value={radicado.remitente ?? ""} />
              </div>
              <div>
                <Label className="text-xs">Fecha límite de respuesta</Label>
                <Input readOnly value={fechaLimiteFmt} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Solicitud</Label>
              <Textarea readOnly value={radicado.solicitud ?? ""} className="min-h-[100px]" />
            </div>

            {radicado.conclusion_respuesta ? (
              <div>
                <Label className="text-xs">Conclusión de la respuesta</Label>
                <Textarea readOnly value={radicado.conclusion_respuesta} className="min-h-[100px]" />
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>
                Cerrar
              </Button>
              {!radicado.fecha_radicado_respuesta && (
                <Button onClick={markAsResponded} className="gap-2">
                  <Save className="h-4 w-4" />
                  Marcar como respondido
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
