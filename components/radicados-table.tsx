"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { createClient, RADICADOS_TABLE, calculateBusinessDaysBetween } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle, Clock, CheckCircle, Eye, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ⛔️ ANTES: import RadicadoDetailModal from "./radicado-detail-modal";
// ✅ AHORA: import dinámico (ssr:false) y default export.
const RadicadoDetailModal = dynamic(() => import("./radicado-detail-modal"), { ssr: false })

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

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })

const toLocalISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function RadicadosTable() {
  const supabase = createClient()
  const { toast } = useToast()

  const [radicados, setRadicados] = useState<Radicado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendientes" | "respondidos" | "alertas">("todos")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRadicado, setSelectedRadicado] = useState<Radicado | null>(null)

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
      toast({
        title: "No se pudieron cargar los radicados",
        description: error.message,
        variant: "destructive",
      })
    }

    setRadicados((data as Radicado[]) || [])
    setLoading(false)
  }, [supabase, toast])

  useEffect(() => {
    fetchRadicados()
  }, [fetchRadicados])

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

  // 👉 Botón "Respondido"
  const markAsResponded = useCallback(
    async (r: Radicado) => {
      try {
        const today = new Date()
        const dias = r.fecha_radicado
          ? await calculateBusinessDaysBetween(new Date(r.fecha_radicado), today)
          : null

        const { error } = await supabase
          .from(RADICADOS_TABLE)
          .update({
            fecha_radicado_respuesta: toLocalISO(today),
            dias_respuesta: dias,
            alerta: false,
          })
          .eq("id", r.id)

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
          description: `#${r.numero_radicado}`,
        })

        await fetchRadicados()
      } catch (e: any) {
        toast({
          title: "Error inesperado",
          description: e?.message ?? "Revisa la consola.",
          variant: "destructive",
        })
      }
    },
    [supabase, toast, fetchRadicados],
  )

  const exportToCSV = () => {
    const headers = [
      "Número Radicado",
      "Funcionario",
      "Fecha Radicado",
      "Fecha Límite",
      "Estado",
      "Tema",
      "Canal",
      "Remitente",
    ]
    const rows = filtered.map((r) => [
      r.numero_radicado,
      r.funcionario,
      r.fecha_radicado ? formatDate(r.fecha_radicado) : "",
      r.fecha_limite_respuesta ? formatDate(r.fecha_limite_respuesta) : "",
      r.fecha_radicado_respuesta ? "Respondido" : r.alerta ? "Alerta" : "Pendiente",
      r.tema,
      r.canal,
      r.remitente,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "radicados.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
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
                    <TableCell>{r.fecha_radicado ? formatDate(r.fecha_radicado) : ""}</TableCell>
                    <TableCell>{r.fecha_limite_respuesta ? formatDate(r.fecha_limite_respuesta) : ""}</TableCell>
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
                        <Button size="sm" onClick={() => markAsResponded(r)} className="gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Respondido
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

      {/* Modal (solo se renderiza si el dynamic import resolvió) */}
      {RadicadoDetailModal ? (
        <RadicadoDetailModal
          radicado={selectedRadicado}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={fetchRadicados}
        />
      ) : null}
    </div>
  )
}
