"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { createClient, RADICADOS_TABLE, addBusinessDays } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ClipboardList, Bell, Users } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

type Radicado = {
  id: string
  funcionario: string
  fecha_radicado: string | null
  numero_radicado: string
  fecha_asignacion: string | null
  fecha_limite_respuesta: string | null
  tema: string
  canal: string | null
  remitente: string
  solicitud: string
  alerta: boolean
  fecha_radicado_respuesta: string | null
}

const COLORS = {
  ok: "#22c55e",      // Respondidos
  warn: "#f59e0b",    // Pendientes
  danger: "#ef4444",  // En alerta
  gray: "#cbd5e1",
}

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "")

const normalizeCanal = (raw: string | null): string => {
  if (!raw) return "Otro"
  const b = stripAccents(raw.trim().toLowerCase())
  if (b.includes("correo") || b.includes("email")) return "Correo electrónico"
  if (b.includes("telefono") || b.includes("tel")) return "Teléfono"
  if (b.includes("whatsapp") || b.includes("wasap")) return "WhatsApp"
  if (b.includes("presencial") || b.includes("oficina") || b.includes("ventanilla")) return "Presencial"
  if (b.includes("web") || b.includes("formulario")) return "Web"
  if (b.includes("oficio") || b.includes("memorando")) return "Oficio"
  return raw.trim()
}

// --- Fechas / días hábiles ---
const startOfLocalDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const parseLocalISO = (s: string) => {
  // "YYYY-MM-DD" -> Date en hora local
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}
const businessDaysUntil = (deadline: Date) => {
  const today = startOfLocalDay(new Date())
  const end = startOfLocalDay(deadline)
  if (end <= today) return 0
  let c = 0
  const cur = new Date(today)
  while (cur < end) {
    cur.setDate(cur.getDate() + 1)
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) c++
  }
  return c
}

type MesState = {
  totalMes: number
  respondidosMes: number
  pendientesMes: number
  alertasMes: number
  pendientesTotal: number
  byCanal: Record<string, number>
  listaMes: Array<{ id: string; numero: string; tema: string; fecha: string; estado: "RESPONDIDO" | "PENDIENTE" | "ALERTA" }>
}

export default function ResumenDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [state, setState] = useState<MesState>({
    totalMes: 0,
    respondidosMes: 0,
    pendientesMes: 0,
    alertasMes: 0,
    pendientesTotal: 0,
    byCanal: {},
    listaMes: [],
  })
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from(RADICADOS_TABLE)
      .select(
        "id, funcionario, fecha_radicado, numero_radicado, fecha_asignacion, fecha_limite_respuesta, tema, canal, remitente, solicitud, alerta, fecha_radicado_respuesta",
      )
      .order("fecha_radicado", { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const all = (data || []) as Radicado[]

    // Totales "pendientes" sobre TODO (no sólo mes)
    const pendientesTotal = all.filter((r) => !r.fecha_radicado_respuesta).length

    // Agregación por canal SOBRE TODO (normalizado)
    const byCanal: Record<string, number> = {}
    for (const r of all) {
      const canal = normalizeCanal(r.canal ?? "")
      byCanal[canal] = (byCanal[canal] ?? 0) + 1
    }

    // Filtro del MES actual (por fecha_radicado)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1) // exclusivo

    const delMes = all.filter((r) => {
      if (!r.fecha_radicado) return false
      const d = parseLocalISO(r.fecha_radicado)
      return d >= monthStart && d < monthEnd
    })

    let respondidosMes = 0
    let pendientesMes = 0
    let alertasMes = 0
    const listaMes: MesState["listaMes"] = []

    for (const r of delMes) {
      const responded = !!r.fecha_radicado_respuesta

      // Determinar fecha límite: DB o +16 días hábiles desde fecha_radicado
      let limite: Date | null = null
      if (r.fecha_limite_respuesta) {
        limite = parseLocalISO(r.fecha_limite_respuesta)
      } else if (r.fecha_radicado) {
        limite = await addBusinessDays(parseLocalISO(r.fecha_radicado), 16)
      }

      // Recalcular alerta (¡independiente del flag de BD!)
      let isAlert = false
      if (!responded && limite) {
        const days = businessDaysUntil(limite)
        isAlert = days <= 10 // incluye vencidos (<=0)
      }

      if (responded) respondidosMes++
      else if (isAlert) alertasMes++
      else pendientesMes++

      listaMes.push({
        id: r.id,
        numero: r.numero_radicado,
        tema: r.tema || "",
        fecha: r.fecha_radicado ? new Date(r.fecha_radicado).toLocaleDateString("es-ES") : "",
        estado: responded ? "RESPONDIDO" : isAlert ? "ALERTA" : "PENDIENTE",
      })
    }

    setState({
      totalMes: delMes.length,
      respondidosMes,
      pendientesMes,
      alertasMes,
      pendientesTotal,
      byCanal,
      listaMes,
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    cargar()
  }, [cargar])

  const pieData = useMemo(
    () => [
      { name: "Respondidos", value: state.respondidosMes, color: COLORS.ok },
      { name: "Pendientes", value: state.pendientesMes, color: COLORS.warn },
      { name: "En alerta", value: state.alertasMes, color: COLORS.danger },
    ],
    [state.respondidosMes, state.pendientesMes, state.alertasMes],
  )

  const barData = useMemo(
    () =>
      Object.entries(state.byCanal).map(([name, value]) => ({
        canal: name,
        total: value,
      })),
    [state.byCanal],
  )

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="text-2xl font-bold">{state.totalMes}</div>
              <div className="text-sm text-slate-600">Radicados del mes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{state.pendientesTotal}</div>
              <div className="text-sm text-slate-600">Pendientes (total)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className="h-6 w-6 text-amber-600" />
            <div>
              <div className="text-2xl font-bold">{state.alertasMes}</div>
              <div className="text-sm text-slate-600">En alerta (mes)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estado del mes</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((p, i) => (
                    <Cell key={i} fill={p.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Radicados por canal (total)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="canal" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista del mes */}
      <Card>
        <CardHeader>
          <CardTitle>Radicados del mes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-500">Cargando…</div>
          ) : state.listaMes.length === 0 ? (
            <div className="text-slate-500">No hay radicados este mes.</div>
          ) : (
            <ul className="space-y-2">
              {state.listaMes.map((r) => (
                <li key={r.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.numero || "(sin número)"}</div>
                    <div className="text-sm text-slate-500">
                      Radicado: {r.fecha} • {r.tema || "Sin tema"}
                    </div>
                  </div>
                  <Badge
                    className={
                      r.estado === "RESPONDIDO"
                        ? "bg-emerald-600 text-white"
                        : r.estado === "ALERTA"
                        ? "bg-red-600 text-white"
                        : "bg-amber-500 text-white"
                    }
                  >
                    {r.estado === "RESPONDIDO" ? "Respondido" : r.estado === "ALERTA" ? "En alerta" : "Pendiente"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
