"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, Bell, CheckCircle, Calendar, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/** ----------------------------- Tipos ----------------------------- */
interface Radicado {
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
  alerta: boolean
  fecha_radicado_respuesta: string | null
}

interface AlertStats {
  vencidos: number
  proximosAVencer: number
  enAlerta: number
  total: number
}

/** ------------------------- Utilidades fecha ---------------------- */
const startOfLocalDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Cuenta días hábiles desde hoy (excluyendo hoy) hasta la fecha límite */
const businessDaysUntil = (deadlineDate: Date): number => {
  const today = startOfLocalDay(new Date())
  const deadline = startOfLocalDay(deadlineDate)
  if (deadline <= today) return 0

  let count = 0
  const cursor = new Date(today)
  while (cursor < deadline) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay() // 0=Dom,6=Sáb
    if (day !== 0 && day !== 6) count++
  }
  return count
}

/** Nivel visual de alerta en función de días hábiles restantes */
const getAlertLevel = (fechaLimite: string): "critical" | "warning" | "info" => {
  const days = businessDaysUntil(new Date(fechaLimite))
  if (days <= 0) return "critical"   // vencido
  if (days <= 3) return "critical"   // <= 3 días hábiles: crítico
  if (days <= 7) return "warning"    // <= 7 días hábiles: advertencia
  return "info"                      // 8-10 días hábiles
}

const getDaysRemainingText = (fechaLimite: string): string => {
  const days = businessDaysUntil(new Date(fechaLimite))
  if (days <= 0) return "Vencido"
  if (days === 1) return "1 día hábil"
  return `${days} días hábiles`
}

/** ============================= Componente ============================= */
export function AlertDashboard() {
  const [alertRadicados, setAlertRadicados] = useState<Radicado[]>([])
  const [stats, setStats] = useState<AlertStats>({
    vencidos: 0,
    proximosAVencer: 0,
    enAlerta: 0,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Cliente Supabase estable entre renders
  const supabase = useMemo(() => createClient(), [])

  /** Carga y sincroniza estado de alertas */
  const fetchAlertsAndUpdateStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      // Solo pendientes con fecha límite válida
      const { data, error } = await supabase
        .from("radicados")
        .select(
          "id, funcionario, fecha_radicado, numero_radicado, fecha_asignacion, fecha_limite_respuesta, tema, canal, remitente, solicitud, alerta, fecha_radicado_respuesta",
        )
        .is("fecha_radicado_respuesta", null)
        .not("fecha_limite_respuesta", "is", null)

      if (error) throw error
      const radicados = (data || []) as Radicado[]

      const toAlert: Radicado[] = []
      const toTrue: string[] = []
      const toFalse: string[] = []

      let vencidos = 0
      let proximos = 0

      for (const r of radicados) {
        const dl = r.fecha_limite_respuesta!
        const daysBusiness = businessDaysUntil(new Date(dl))
        const shouldAlert = daysBusiness <= 10 // regla de negocio

        // Clasificación para métricas
        if (daysBusiness <= 0) vencidos++
        else if (daysBusiness <= 10) proximos++

        if (shouldAlert) toAlert.push(r)

        // Sincronizar columna alerta solo si cambió
        if (shouldAlert && !r.alerta) toTrue.push(r.id)
        if (!shouldAlert && r.alerta) toFalse.push(r.id)
      }

      // Actualizaciones masivas
      if (toTrue.length) {
        await supabase.from("radicados").update({ alerta: true }).in("id", toTrue)
      }
      if (toFalse.length) {
        await supabase.from("radicados").update({ alerta: false }).in("id", toFalse)
      }

      setAlertRadicados(toAlert)
      setStats({
        vencidos,
        proximosAVencer: proximos,
        enAlerta: vencidos + proximos,
        total: radicados.length,
      })
    } catch (err) {
      console.error("Error fetching alerts:", err)
      toast({
        title: "Error al cargar alertas",
        description: "No se pudieron cargar o actualizar las alertas.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  /** Primera carga + chequeo cada hora */
  useEffect(() => {
    fetchAlertsAndUpdateStatus()
    const interval = setInterval(fetchAlertsAndUpdateStatus, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAlertsAndUpdateStatus])

  /** ----------------------------- UI ----------------------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-slate-600 dark:text-slate-300">Cargando alertas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.vencidos}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Vencidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.proximosAVencer}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Próximos a vencer</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.enAlerta}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">En alerta</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listado de radicados en alerta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
            <Bell className="mr-2 h-5 w-5 text-orange-600" />
            Radicados que requieren atención
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Vencidos o con ≤ 10 días hábiles restantes
          </p>
        </CardHeader>
        <CardContent>
          {alertRadicados.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">¡Excelente!</p>
              <p>No hay radicados que requieran atención inmediata</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertRadicados.map((r) => {
                const alertLevel = getAlertLevel(r.fecha_limite_respuesta!)
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alertLevel === "critical"
                        ? "border-l-red-500 bg-red-50 dark:bg-red-900/10"
                        : alertLevel === "warning"
                        ? "border-l-orange-500 bg-orange-50 dark:bg-orange-900/10"
                        : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            variant={alertLevel === "critical" ? "destructive" : "secondary"}
                            className={
                              alertLevel === "critical"
                                ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
                                : alertLevel === "warning"
                                ? "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
                            }
                          >
                            {r.numero_radicado}
                          </Badge>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {getDaysRemainingText(r.fecha_limite_respuesta!)}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          {r.tema || "Sin tema especificado"}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center">
                            <User className="mr-1 h-4 w-4" />
                            <span className="font-medium">Funcionario:</span>
                            <span className="ml-1">{r.funcionario}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span className="font-medium">Fecha límite:</span>
                            <span className="ml-1">{formatDate(r.fecha_limite_respuesta)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Remitente:</span>
                            <span className="ml-1">{r.remitente || "No especificado"}</span>
                          </div>
                        </div>

                        {r.solicitud && (
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{r.solicitud}</p>
                        )}
                      </div>

                      <div className="ml-4">
                        {alertLevel === "critical" ? (
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        ) : (
                          <Clock className="h-6 w-6 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de actualización manual */}
      <div className="flex justify-center">
        <Button
          onClick={fetchAlertsAndUpdateStatus}
          variant="outline"
          className="bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell className="mr-2 h-4 w-4" />
          Actualizar alertas
        </Button>
      </div>
    </div>
  )
}
