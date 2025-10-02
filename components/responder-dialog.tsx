"use client"

import { useEffect, useState } from "react"
import {
  createClient,
  RADICADOS_TABLE,
  addBusinessDays,
  calculateBusinessDaysBetween,
} from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type Radicado = {
  id: string
  numero_radicado: string
  fecha_radicado: string | null
  fecha_limite_respuesta: string | null
}

const toLocalISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  radicado: Radicado
  onDone?: () => void | Promise<void>
}

export default function ResponderDialog({ open, onOpenChange, radicado, onDone }: Props) {
  const supabase = createClient()
  const { toast } = useToast()

  const [numeroSalida, setNumeroSalida] = useState("")
  const [visita, setVisita] = useState<"SI" | "NO">("NO")
  const [tipo, setTipo] = useState<"COMPLETA" | "PARCIAL">("COMPLETA")
  const [fechaResp, setFechaResp] = useState<Date | undefined>(new Date())
  const [saving, setSaving] = useState(false)

  // Vista previa cuando es PARCIAL (sumar 15 días hábiles)
  const [previewNuevaFecha, setPreviewNuevaFecha] = useState<Date | null>(null)
  useEffect(() => {
    let cancel = false
    if (open && tipo === "PARCIAL" && fechaResp) {
      addBusinessDays(fechaResp, 15).then((d) => {
        if (!cancel) setPreviewNuevaFecha(d)
      })
    } else {
      setPreviewNuevaFecha(null)
    }
    return () => {
      cancel = true
    }
  }, [open, tipo, fechaResp])

  // Al abrir, limpiar el formulario
  useEffect(() => {
    if (open) {
      setNumeroSalida("")
      setVisita("NO")
      setTipo("COMPLETA")
      setFechaResp(new Date())
    }
  }, [open])

  const close = () => onOpenChange(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!numeroSalida.trim() || !fechaResp) {
      toast({ title: "Campos incompletos", description: "Completa número y fecha.", variant: "destructive" })
      return
    }

    try {
      setSaving(true)

      if (tipo === "COMPLETA") {
        const dias = radicado.fecha_radicado
          ? await calculateBusinessDaysBetween(new Date(radicado.fecha_radicado), fechaResp)
          : null

        const { error } = await supabase
          .from(RADICADOS_TABLE)
          .update({
            numero_radicado_respuesta: numeroSalida.trim(),
            fecha_radicado_respuesta: toLocalISO(fechaResp),
            requirio_visita: visita === "SI",
            respuesta_parcial: "NO",
            dias_respuesta: dias,
            alerta: false,
          })
          .eq("id", radicado.id)

        if (error) throw error

        toast({ title: "Trámite respondido", description: `#${radicado.numero_radicado}` })
      } else {
        const nuevaFechaLimite = await addBusinessDays(fechaResp, 15)

        const { error } = await supabase
          .from(RADICADOS_TABLE)
          .update({
            numero_radicado_respuesta: numeroSalida.trim(),
            requirio_visita: visita === "SI",
            respuesta_parcial: "SI",
            fecha_limite_respuesta: toLocalISO(nuevaFechaLimite),
            // Mantener NULL para indicar que falta respuesta final
            fecha_radicado_respuesta: null,
            alerta: false,
          })
          .eq("id", radicado.id)

        if (error) throw error

        toast({
          title: "Respuesta parcial registrada",
          description: `Nueva fecha límite: ${nuevaFechaLimite.toLocaleDateString("es-ES")}`,
        })
      }

      await onDone?.()
      close()
    } catch (e: any) {
      toast({
        title: "No se pudo guardar la respuesta",
        description: e?.message ?? "Revisa la consola.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-lg font-semibold">
              Responder radicado <span className="font-mono">#{radicado.numero_radicado}</span>
            </h3>
            <Button type="button" variant="ghost" onClick={close} aria-label="Cerrar">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="num-salida">Radicado de salida *</Label>
                <Input id="num-salida" value={numeroSalida} onChange={(e) => setNumeroSalida(e.target.value)} required />
              </div>

              <div>
                <Label>¿Requirió visita? *</Label>
                <Select value={visita} onValueChange={(v) => setVisita(v as "SI" | "NO")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  {/* elevar z-index para que quede por encima del overlay */}
                  <SelectContent className="z-[80]">
                    <SelectItem value="SI">Sí</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fecha de respuesta *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !fechaResp && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaResp ? fechaResp.toLocaleDateString("es-ES") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  {/* elevar z-index para que el calendario no quede detrás */}
                  <PopoverContent className="w-auto p-0 z-[80]">
                    <Calendar mode="single" selected={fechaResp} onSelect={setFechaResp} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Tipo de respuesta *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as "COMPLETA" | "PARCIAL")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="COMPLETA">Completa</SelectItem>
                    <SelectItem value="PARCIAL">Parcial (reprograma +15 días hábiles)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipo === "PARCIAL" && previewNuevaFecha && (
              <p className="text-sm text-slate-600">
                Nueva fecha límite estimada:&nbsp;
                <strong>{previewNuevaFecha.toLocaleDateString("es-ES")}</strong>
              </p>
            )}
          </div>

          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving || !numeroSalida.trim() || !fechaResp}>
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar respuesta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
