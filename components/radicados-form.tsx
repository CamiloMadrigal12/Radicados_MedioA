"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, RotateCcw, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RadicadoFormData {
  funcionario: string
  fechaRadicado: Date | undefined
  numeroRadicado: string
  fechaAsignacion: Date | undefined
  tema: string
  canal: string
  remitente: string
  solicitud: string
}

const canales = ["Correo Electrónico", "Físico", "Plataforma Digital", "Teléfono", "Fax", "Ventanilla Única"]

export function RadicadosForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RadicadoFormData>({
    funcionario: "",
    fechaRadicado: new Date(),
    numeroRadicado: "",
    fechaAsignacion: undefined,
    tema: "",
    canal: "",
    remitente: "",
    solicitud: "",
  })

  // Cliente de Supabase centralizado
  const supabase = createClient()
  // Seguimos mostrando alerta si faltan las variables públicas
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const calculateBusinessDays = (startDate: Date, businessDays: number): Date => {
    const currentDate = new Date(startDate)
    let addedDays = 0
    while (addedDays < businessDays) {
      currentDate.setDate(currentDate.getDate() + 1)
      // Fines de semana: sábado = 6, domingo = 0
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        addedDays++
      }
    }
    return currentDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasSupabaseEnv) {
      toast({
        title: "Error de configuración",
        description: "Las variables de entorno de Supabase no están configuradas",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 16 días hábiles desde fecha_asignacion
      const fechaLimite = formData.fechaAsignacion
        ? calculateBusinessDays(formData.fechaAsignacion, 16)
        : null

      const { error } = await supabase.from("radicados").insert({
        funcionario: formData.funcionario,
        fecha_radicado: formData.fechaRadicado?.toISOString().split("T")[0],
        numero_radicado: formData.numeroRadicado,
        fecha_asignacion: formData.fechaAsignacion?.toISOString().split("T")[0],
        fecha_limite_respuesta: fechaLimite?.toISOString().split("T")[0],
        tema: formData.tema,
        canal: formData.canal,
        remitente: formData.remitente,
        solicitud: formData.solicitud,
        alerta: false,
      })

      if (error) throw error

      toast({
        title: "Radicado registrado exitosamente",
        description: `Número de radicado: ${formData.numeroRadicado}`,
      })

      // Reset
      setFormData({
        funcionario: "",
        fechaRadicado: new Date(),
        numeroRadicado: "",
        fechaAsignacion: undefined,
        tema: "",
        canal: "",
        remitente: "",
        solicitud: "",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error al registrar radicado",
        description: "Por favor intente nuevamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasSupabaseEnv) {
    return (
      <div className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Configuración requerida:</strong> Para usar el formulario de radicados, necesitas configurar las
            variables de entorno de Supabase en Project Settings:
            <br />• <code>NEXT_PUBLIC_SUPABASE_URL</code>
            <br />• <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </AlertDescription>
        </Alert>
        <div className="opacity-50 pointer-events-none">
          {/* Vista previa deshabilitada */}
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Funcionario Responsable *
                </Label>
                <Input placeholder="Nombre del funcionario" disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Número de Radicado *</Label>
                <Input placeholder="Ej: RAD-2025-001" disabled />
              </div>
            </div>
            <Button disabled className="w-full">
              Configurar Supabase para continuar
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funcionario */}
        <div className="space-y-2">
          <Label htmlFor="funcionario" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Funcionario Responsable *
          </Label>
          <Input
            id="funcionario"
            value={formData.funcionario}
            onChange={(e) => setFormData((prev) => ({ ...prev, funcionario: e.target.value }))}
            placeholder="Nombre del funcionario"
            required
            className="border-slate-300 focus:border-blue-500"
          />
        </div>

        {/* Número de Radicado */}
        <div className="space-y-2">
          <Label htmlFor="numeroRadicado" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Número de Radicado *
          </Label>
          <Input
            id="numeroRadicado"
            value={formData.numeroRadicado}
            onChange={(e) => setFormData((prev) => ({ ...prev, numeroRadicado: e.target.value }))}
            placeholder="Ej: RAD-2025-001"
            required
            className="border-slate-300 focus:border-blue-500"
          />
        </div>

        {/* Fecha de Radicado */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Radicado *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-slate-300",
                  !formData.fechaRadicado && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.fechaRadicado ? (
                  format(formData.fechaRadicado, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.fechaRadicado}
                onSelect={(date) => setFormData((prev) => ({ ...prev, fechaRadicado: date }))}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fecha de Asignación */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Asignación</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-slate-300",
                  !formData.fechaAsignacion && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.fechaAsignacion ? (
                  format(formData.fechaAsignacion, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.fechaAsignacion}
                onSelect={(date) => setFormData((prev) => ({ ...prev, fechaAsignacion: date }))}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Canal */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Canal de Recepción</Label>
          <Select value={formData.canal} onValueChange={(value) => setFormData((prev) => ({ ...prev, canal: value }))}>
            <SelectTrigger className="border-slate-300 focus:border-blue-500">
              <SelectValue placeholder="Seleccionar canal" />
            </SelectTrigger>
            <SelectContent>
              {canales.map((canal) => (
                <SelectItem key={canal} value={canal}>
                  {canal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Remitente */}
        <div className="space-y-2">
          <Label htmlFor="remitente" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Remitente
          </Label>
          <Input
            id="remitente"
            value={formData.remitente}
            onChange={(e) => setFormData((prev) => ({ ...prev, remitente: e.target.value }))}
            placeholder="Nombre del remitente"
            className="border-slate-300 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tema */}
      <div className="space-y-2">
        <Label htmlFor="tema" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Tema/Asunto
        </Label>
        <Input
          id="tema"
          value={formData.tema}
          onChange={(e) => setFormData((prev) => ({ ...prev, tema: e.target.value }))}
          placeholder="Descripción breve del tema"
          className="border-slate-300 focus:border-blue-500"
        />
      </div>

      {/* Solicitud */}
      <div className="space-y-2">
        <Label htmlFor="solicitud" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Descripción de la Solicitud
        </Label>
        <Textarea
          id="solicitud"
          value={formData.solicitud}
          onChange={(e) => setFormData((prev) => ({ ...prev, solicitud: e.target.value }))}
          placeholder="Descripción detallada de la solicitud..."
          rows={4}
          className="border-slate-300 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Guardando..." : "Guardar Radicado"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>
    </form>
  )

  function resetForm() {
    setFormData({
      funcionario: "",
      fechaRadicado: new Date(),
      numeroRadicado: "",
      fechaAsignacion: undefined,
      tema: "",
      canal: "",
      remitente: "",
      solicitud: "",
    })
  }
}
