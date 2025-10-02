"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { createClient, RADICADOS_TABLE, addBusinessDays, calculateBusinessDaysBetween } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle, Clock, CheckCircle, Eye, Download } from "lucide-react"

import RadicadoDetailModal from "@/components/radicado-detail-modal"
import ResponderDialog from "@/components/responder-dialog"

/* ========================= */
type Radicado = {
  id: string
  funcionario: string
  fecha_radicado: string | null
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

type ReplyDialogRadicado = {
  id: string
  numero_radicado: string
  fecha_radicado: string | null
  fecha_limite_respuesta: string | null
}

// Modal: aseguramos string en fecha_radicado
type RadicadoForModal = Omit<Radicado, "fecha_radicado"> & { fecha_radicado: string }
const asModalRadicado = (r: Radicado): RadicadoForModal => ({ ...r, fecha_radicado: r.fecha_radicado ?? "" })

const formatDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""

const toLocalISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/* ========================= */
export function RadicadosTable() {
  const supabase = createClient()
  const { toast } = useToast()

  const [radicados, setRadicados] = useState<Radicado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendientes" | "respondidos" | "alertas">("todos")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRadicado, setSelectedRadicado] = useState<Radicado | null>(null)

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyRadicado, setReplyRadicado] = useState<ReplyDialogRadicado | null>(null)

  const fetchRadicados = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from(RADICADOS_TABLE)
      .select(
        "id, funcionario, fecha_radicado, numero_radicado, fecha_asignacion, fecha_limite_respuesta, tema, canal, remitente, solicitud, conclusion_respuesta, numero_radicado_prorroga, fecha_solicitud_prorroga, numero_radicado_respuesta, fecha_radicado_respuesta, dias_respuesta, alerta, respuesta_parcial, created_at",
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error cargando radicados:", error)
      toast({ title: "No se pudieron cargar los radicados", description: error.message, variant: "destructive" })
      setLoading(false)
      return
    }

    const list = (data as Radicado[]) || []

    // Completar fecha límite (+16 días hábiles) si falta y aún no está respondido
    for (const r of list) {
      if (!r.fecha_limite_respuesta && r.fecha_radicado && !r.fecha_radicado_respuesta) {
        const dl = await addBusinessDays(new Date(r.fecha_radicado), 16)
        r.fecha_limite_respuesta = toLocalISO(dl)
      }
    }

    // Reglas locales de "alerta" (no escribe DB)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const r of list) {
      if (r.fecha_radicado_respuesta) continue
      if (!r.fecha_limite_respuesta) continue

      const limite = new Date(r.fecha_limite_respuesta)
      limite.setHours(0, 0, 0, 0)

      const vencido = limite.getTime() < today.getTime()
      let pocosDias = false
      if (!vencido) {
        const restantes = await calculateBusinessDaysBetween(today, limite)
        pocosDias = restantes <= 10
      }

      // reflejamos en memoria (sin tocar DB)
      r.alerta = Boolean(r.alerta || vencido || pocosDias)
    }

    setRadicados(list)
    setLoading(false)
  }, [supabase, toast])

  useEffect(() => {
    fetchRadicados()
  }, [fetchRadicados])

  // Filtros de tabla (solo UI)
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    let list = !term
      ? radicados
      : radicados.filter((r) =>
          [r.numero_radicado, r.funcionario, r.tema, r.remitente].join(" ").toLowerCase().includes(term),
        )

    if (statusFilter === "pendientes") list = list.filter((r) => !r.fecha_radicado_respuesta)
    else if (statusFilter === "respondidos") list = list.filter((r) => r.fecha_radicado_respuesta)
    else if (statusFilter === "alertas") list = list.filter((r) => r.alerta)

    return list
  }, [radicados, searchTerm, statusFilter])

  const getStatusBadge = (r: Radicado) => {
    if (r.fecha_radicado_respuesta) {
      return (
        <Badge className="bg-green-600/90 text-white dark:bg-green-700">
          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Respondido
        </Badge>
      )
    }
    if (r.alerta) {
      return (
        <Badge className="bg-red-600/90 text-white dark:bg-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Alerta
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500/90 text-white dark:bg-amber-600">
        <Clock className="w-3.5 h-3.5 mr-1" /> Pendiente
      </Badge>
    )
  }

  const handleViewDetails = (r: Radicado) => {
    setSelectedRadicado(r)
    setIsModalOpen(true)
  }

  const abrirResponder = (r: Radicado) => {
    setReplyRadicado({
      id: r.id,
      numero_radicado: r.numero_radicado,
      fecha_radicado: r.fecha_radicado,
      fecha_limite_respuesta: r.fecha_limite_respuesta,
    })
    setReplyOpen(true)
  }

  /** Exportar a Excel (.xlsx) */
  const exportToExcel = async () => {
    const mod = await import("xlsx")
    const XLSX: any = (mod as any).default ?? mod

    const headers = ["Número Radicado", "Funcionario", "Fecha Radicado", "Fecha Límite", "Estado", "Tema", "Canal", "Remitente"]

    const rows = filtered.map((r) => [
      r.numero_radicado,
      r.funcionario,
      formatDate(r.fecha_radicado),
      formatDate(r.fecha_limite_respuesta),
      r.fecha_radicado_respuesta ? "Respondido" : r.alerta ? "Alerta" : "Pendiente",
      r.tema,
      r.canal,
      r.remitente,
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws["!cols"] = headers.map((h: string, i: number) => {
      const maxLen = Math.max(h.length, ...rows.map((r) => (r[i] ?? "").toString().length))
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Radicados")
    XLSX.writeFile(wb, "radicados.xlsx")
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200 bg-white">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-6">
          <h3 className="text-2xl font-semibold text-white">Seguimiento de Radicados</h3>
          <p className="text-emerald-50/90 text-sm">Monitoreo y gestión de documentos radicados</p>
        </div>

        <div className="-mt-6 px-4 pb-6 md:px-6">
          <div className="-mt-10 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 p-4 md:p-6">
            {/* Filtros */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número, funcionario, tema o remitente..."
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendientes">Pendientes</SelectItem>
                  <SelectItem value="respondidos">Respondidos</SelectItem>
                  <SelectItem value="alertas">Con alerta</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToExcel} variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
            </div>

            {/* Tabla */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Fecha Radicado</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tema</TableHead>
                    <TableHead>Remitente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="flex items-center">
                          <div className="h-4 w-4 rounded-full animate-pulse bg-slate-400 mr-2" />
                          <span className="ml-2 text-slate-600 dark:text-slate-300">Cargando radicados...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
                      const isResponded = !!r.fecha_radicado_respuesta
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono">{r.numero_radicado}</TableCell>
                          <TableCell>{r.funcionario}</TableCell>
                          <TableCell>{formatDate(r.fecha_radicado)}</TableCell>
                          <TableCell>{formatDate(r.fecha_limite_respuesta)}</TableCell>
                          <TableCell>{getStatusBadge(r)}</TableCell>
                          <TableCell className="truncate max-w-[260px]">{r.tema}</TableCell>
                          <TableCell className="truncate max-w-[260px]">{r.remitente}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(r)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                            >
                              <Eye className="w-4 h-4 mr-1" /> Ver
                            </Button>

                            {!isResponded && (
                              <Button size="sm" onClick={() => abrirResponder(r)} className="gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Responder
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {isModalOpen && selectedRadicado && (
        <RadicadoDetailModal
          radicado={asModalRadicado(selectedRadicado)}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={fetchRadicados}
        />
      )}

      {replyOpen && replyRadicado && (
        <ResponderDialog open={replyOpen} onOpenChange={setReplyOpen} radicado={replyRadicado} onDone={fetchRadicados} />
      )}
    </div>
  )
}
