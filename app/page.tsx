"use client"

import { RadicadosForm } from "@/components/radicados-form"
import { RadicadosTable } from "@/components/radicados-table"
import { AlertDashboard } from "@/components/alert-dashboard"
import { BusinessDaysCalculator } from "@/components/business-days-calculator"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Sistema de Seguimiento de Radicados Medio Ambiente
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Gestión y seguimiento de documentos oficiales</p>
        </div>

        <Tabs defaultValue="nuevo" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="nuevo" className="text-sm font-medium">
              Nuevo Radicado
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="text-sm font-medium">
              Seguimiento
            </TabsTrigger>
            <TabsTrigger value="alertas" className="text-sm font-medium">
              Alertas
            </TabsTrigger>
            <TabsTrigger value="calculadora" className="text-sm font-medium">
              Calculadora
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nuevo">
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 backdrop-blur-sm overflow-hidden">
              <div
                className="px-6 py-4 rounded-t-lg"
                style={{
                  background: "linear-gradient(to right, rgb(37, 99, 235), rgb(79, 70, 229))",
                }}
              >
                <div className="text-xl font-semibold text-white leading-none">Registrar Nuevo Radicado</div>
                <div className="text-sm font-medium mt-1.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Complete la información del documento a radicar
                </div>
              </div>
              <CardContent className="p-6">
                <RadicadosForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguimiento">
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 backdrop-blur-sm overflow-hidden">
              <div
                className="px-6 py-4"
                style={{
                  background: "linear-gradient(to right, rgb(5, 150, 105), rgb(20, 184, 166))",
                }}
              >
                <div className="text-xl font-semibold text-white leading-none">Seguimiento de Radicados</div>
                <div className="text-sm font-medium mt-1.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Monitoreo y gestión de documentos radicados
                </div>
              </div>
              <CardContent className="p-6">
                <RadicadosTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas">
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 backdrop-blur-sm overflow-hidden">
              <div
                className="px-6 py-4"
                style={{
                  background: "linear-gradient(to right, rgb(234, 88, 12), rgb(239, 68, 68))",
                }}
              >
                <div className="text-xl font-semibold text-white leading-none">Sistema de Alertas</div>
                <div className="text-sm font-medium mt-1.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Monitoreo de radicados próximos a vencer y vencidos
                </div>
              </div>
              <CardContent className="p-6">
                <AlertDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculadora">
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 backdrop-blur-sm overflow-hidden">
              <div
                className="px-6 py-4"
                style={{
                  background: "linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))",
                }}
              >
                <div className="text-xl font-semibold text-white leading-none">Calculadora de Días Hábiles</div>
                <div className="text-sm font-medium mt-1.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Herramienta para calcular días hábiles considerando festivos colombianos
                </div>
              </div>
              <CardContent className="p-6">
                <BusinessDaysCalculator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
