"use client"

import { useState } from "react"
import { createClient, RADICADOS_TABLE } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { PopoverTrigger } from "@radix-ui/react-popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ================== Catálogos ================== */

const THEMES = [
  "Vertimientos",
  "Pozos sépticos",
  "Residuos",
  "Forestal",
  "Abejas y avispas",
  "Minería",
  "Ruido",
  "Control y vigilancia empresas",
  "Bienestar animal",
  "Fauna silvestre",
  "Olores ofensivos",
  "Rocería",
  "Visitas agropecuarias",
  "Huertas",
  "Evaluación licencias ambientales",
  "Calidad del aire",
  "Fuentes hídricas",
  "Compra de predios",
  "Administrativo",
  "Invitaciones",
  "Captación de aguas",
  "Solicitud de siembra",
  "Solicitud de información",
  "Otros",
]

const BARRIOS_VEREDAS = [
  "La Veta","Zarzal La Luz","Zarzal Curazao","Ancon","El Noral","El Salado","Sabaneta",
  "Quebrada Arriba","Alvarado","Montañita","Peñolcito","Cabuyal","Granizal","El Convento",
  "Fontidueño","Cristo Rey","Simon Bolivar","Obrero","Yarumito","Las Vegas","Tobon Quintero",
  "La Asunción","La Azulita","El Porvenir","Villanueva","El Recreo","El Remanso","Pedregal",
  "La Misericordia","Machado","San Juan","Maria","Tablazo-Canoas","El Mojon","C. Multiple",
  "Fatima","Pedrera","San Francisco","Miraflores",
]

const CANALES = [
  "Ventanilla",
  "Correo electrónico",
  "Teléfono",
  "WhatsApp",
  "PQRS",
  "Presencial",
  "Otro",
]

/* ================== Utils ================== */
const toLocalISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/* ================== Formulario ================== */
export default function RadicadosForm() {
  const supabase = createClient()
  const { toast } = useToast()

  // Campos
  const [numeroRadicado, setNumeroRadicado] = useState("")
  const [funcionario, setFuncionario] = useState("")
  const [tema, setTema] = useState<string>("")
  const [zona, setZona] = useState<"URBANO" | "RURAL" | "">("")
  const [barrioVereda, setBarrioVereda] = useState<string>("")
  const [canal, setCanal] = useState<string>("")
  const [remitente, setRemitente] = useState<string>("")
  const [solicitud, setSolicitud] = useState<string>("")

  // Fechas
  const [fechaRadicado, setFechaRadicado] = useState<Date | undefined>(new Date())
  const [fechaRecepcion, setFechaRecepcion] = useState<Date | undefined>(new Date())
  const [fechaAsignacion, setFechaAsignacion] = useState<Date | undefined>(undefined) // 👈 TERCERA FECHA

  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!numeroRadicado.trim()) {
      toast({ title: "Número de radicado requerido", variant: "destructive" })
      return
    }
    if (!fechaRadicado) {
      toast({ title: "Fecha de radicado requerida", variant: "destructive" })
      return
    }
    if (!fechaRecepcion) {
      toast({ title: "Fecha de recepción requerida", variant: "destructive" })
      return
    }
    if (!tema) {
      toast({ title: "Selecciona un tema", variant: "destructive" })
      return
    }
    if (!zona) {
      toast({ title: "Selecciona zona (Urbano/Rural)", variant: "destructive" })
      return
    }
    if (!barrioVereda) {
      toast({ title: "Selecciona Barrio/Vereda", variant: "destructive" })
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.from(RADICADOS_TABLE).insert({
        numero_radicado: numeroRadicado.trim(),
        funcionario: funcionario.trim() || null,
        tema,
        zona,
        barrio_vereda: barrioVereda,
        canal: canal || null,
        remitente: remitente.trim() || null,
        solicitud: solicitud.trim() || null,

        // Fechas
        fecha_radicado: toLocalISO(fechaRadicado),
        fecha_recepcion: toLocalISO(fechaRecepcion),
        fecha_asignacion: fechaAsignacion ? toLocalISO(fechaAsignacion) : null, // 👈 guardamos asignación
      })

      if (error) throw error

      toast({ title: "Radicado creado", description: `#${numeroRadicado}` })

      // Reset
      setNumeroRadicado("")
      setFuncionario("")
      setTema("")
      setZona("")
      setBarrioVereda("")
      setCanal("")
      setRemitente("")
      setSolicitud("")
      setFechaRadicado(new Date())
      setFechaRecepcion(new Date())
      setFechaAsignacion(undefined)
    } catch (err: any) {
      toast({
        title: "No se pudo guardar",
        description: err?.message ?? "Inténtalo nuevamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Cabecera visual */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-white shadow-sm">
        <h3 className="font-semibold text-lg">Registrar Nuevo Radicado</h3>
        <p className="text-white/80 text-sm">Complete la información del documento a radicar</p>
      </div>

      {/* Fila 1: Número & Funcionario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Número de radicado</Label>
          <Input value={numeroRadicado} onChange={(e) => setNumeroRadicado(e.target.value)} />
        </div>
        <div>
          <Label>Funcionario</Label>
          <Input value={funcionario} onChange={(e) => setFuncionario(e.target.value)} />
        </div>
      </div>

      {/* Fila 2: Fechas (Radicado / Recepción / Asignación) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fecha de radicado */}
        <div className="space-y-1.5">
          <Label>Fecha de radicado</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !fechaRadicado && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaRadicado ? fechaRadicado.toLocaleDateString("es-ES") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={fechaRadicado} onSelect={setFechaRadicado} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fecha de recepción */}
        <div className="space-y-1.5">
          <Label>Fecha de recepción</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !fechaRecepcion && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaRecepcion ? fechaRecepcion.toLocaleDateString("es-ES") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={fechaRecepcion} onSelect={setFechaRecepcion} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fecha de asignación (👈 NUEVA TERCERA FECHA) */}
        <div className="space-y-1.5">
          <Label>Fecha de asignación</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !fechaAsignacion && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaAsignacion ? fechaAsignacion.toLocaleDateString("es-ES") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={fechaAsignacion} onSelect={setFechaAsignacion} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Fila 3: Tema y Zona */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label>Tema</Label>
          <Select value={tema} onValueChange={setTema}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar tema" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {THEMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Zona</Label>
          <Select value={zona} onValueChange={(v: "URBANO" | "RURAL") => setZona(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="URBANO">Urbano</SelectItem>
              <SelectItem value="RURAL">Rural</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fila 4: Barrio/Vereda y Canal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label>Barrio / Vereda</Label>
          <Select value={barrioVereda} onValueChange={setBarrioVereda}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar barrio o vereda" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {BARRIOS_VEREDAS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Canal</Label>
          <Select value={canal} onValueChange={setCanal}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar canal" />
            </SelectTrigger>
            <SelectContent>
              {CANALES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Remitente */}
      <div>
        <Label>Remitente</Label>
        <Input value={remitente} onChange={(e) => setRemitente(e.target.value)} />
      </div>

      {/* Solicitud */}
      <div>
        <Label>Solicitud</Label>
        <Textarea value={solicitud} onChange={(e) => setSolicitud(e.target.value)} className="min-h-[120px]" />
      </div>

      {/* Acciones */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar Radicado"}
        </Button>
      </div>
    </form>
  )
}
