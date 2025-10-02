"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import RadicadosForm from "@/components/radicados-form"                  // default
import { RadicadosTable } from "@/components/radicados-table"            // named
import { AlertDashboard } from "@/components/alert-dashboard"            // named
import ResumenDashboard from "@/components/resumen-dashboard"            // default ✔

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          Sistema de Seguimiento de Radicados Medio Ambiente
        </h1>
        <p className="text-slate-500 mt-1">Gestión y seguimiento de documentos oficiales</p>
      </header>

      <Tabs defaultValue="nuevo" className="w-full">
        <TabsList className="grid grid-cols-4 w-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <TabsTrigger value="nuevo">Nuevo Radicado</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger> {/* <- antes decía "calculadora" */}
        </TabsList>

        <TabsContent value="nuevo" className="mt-6">
          <RadicadosForm />
        </TabsContent>

        <TabsContent value="seguimiento" className="mt-6">
          <RadicadosTable />
        </TabsContent>

        <TabsContent value="alertas" className="mt-6">
          <AlertDashboard />
        </TabsContent>

        <TabsContent value="resumen" className="mt-6">
          <ResumenDashboard />
        </TabsContent>
      </Tabs>
    </main>
  )
}
